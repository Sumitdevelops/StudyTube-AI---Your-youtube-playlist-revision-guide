import re
import json
import logging
from typing import Dict, Any, List, Generator
from groq import Groq
from app.config import settings
from app.db.vector_store import vector_store
from app.services.embedder import embed_text
from app.services.chunker import format_seconds

logger = logging.getLogger("groq_rag")

def get_system_prompt(playlist_title: str) -> str:
    return f"""You are an expert, dedicated AI study tutor for the YouTube course: "{playlist_title}".

CRITICAL INSTRUCTIONS:
1. RELEVANCE CHECK: If the provided transcript excerpts do NOT actually discuss or contain the topic the user asked about, or if the user question is unrelated to "{playlist_title}", you MUST state honestly:
"This topic is not covered in '{playlist_title}'. Please ask a question related to the topics covered in this course syllabus."
And under ===ENGLISH_SOURCES=== write NONE. Do NOT cite any irrelevant videos.

2. LANGUAGE: You MUST ALWAYS answer entirely in clear, natural ENGLISH. Even if the video transcripts are in Hindi, Hinglish, or Devanagari script, NEVER write in Hindi or Devanagari script. All explanations, bullet points, and source summaries MUST BE IN ENGLISH.

3. CITATIONS: If relevant info IS present, cite the exact video title and timestamp: [Video Title @ timestamp].

4. FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

<Your thorough educational explanation in English Markdown, or the not-covered message>

===ENGLISH_SOURCES===
[1] <1-2 sentence English explanation of excerpt 1>
[2] <1-2 sentence English explanation of excerpt 2>"""


STOP_WORDS = {
    'i', 'im', 'am', 'are', 'is', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'want', 'to', 'the', 'a',
    'an', 'in', 'on', 'at', 'of', 'and', 'or', 'for', 'with', 'about',
    'how', 'what', 'when', 'where', 'why', 'who', 'which', 'can', 'could',
    'you', 'your', 'my', 'me', 'he', 'she', 'it', 'we', 'they', 'tell',
    'explain', 'show', 'hi', 'hello', 'hey', 'please', 'some', 'this',
    'that', 'these', 'those', 'there', 'here', 'revise', 'learn', 'study',
    'course', 'video', 'videos', 'lecture', 'tutorial', 'class'
}

PHONETIC_MAP = {
    'rag': ['रैग', 'रिट्रीवल', 'retrieval', 'augmented', 'generation'],
    'langgraph': ['लैंगग्राफ', 'agent', 'graph', 'node', 'edge'],
    'agent': ['एजेंट', 'langgraph', 'react', 'agents'],
    'agents': ['एजेंट', 'langgraph', 'react', 'agent'],
    'token': ['टोकन', 'tokens', 'vocabulary'],
    'tokens': ['टोकन', 'token'],
    'embedding': ['एम्बेडिंग', 'vector', 'vectors', 'similarity', 'embeddings'],
    'embeddings': ['एम्बेडिंग', 'vector', 'vectors', 'embedding'],
    'qdrant': ['क्वाड्रेंट', 'vector database', 'collection', 'quadrant'],
    'quadrant': ['क्वाड्रेंट', 'qdrant', 'vector database'],
    'prompt': ['प्रॉम्प्ट', 'prompting', 'chaining'],
    'chaining': ['prompt chaining', 'prompt'],
    'streaming': ['chatgpt', 'stream'],
    'temperature': ['system role', 'temperature'],
    'pydantic': ['json', 'pydantic'],
}

def search_rag(query: str, playlist_id: str, top_k: int = 5) -> Dict[str, Any]:
    """
    Execute Hybrid RAG pipeline with strict relevance filtering and English generation.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured in .env")

    trimmed_query = (query or "").strip()

    # Guard 1: Reject empty, symbol-only, or too short queries
    if len(trimmed_query) < 2 or not re.search(r"[a-zA-Z0-9]", trimmed_query):
        return {
            "answer": "Please enter a valid question or topic related to this course playlist.",
            "sources": []
        }

    logger.info(f"Query: '{trimmed_query}' in playlist: {playlist_id}")

    # Step 1: Syllabus inspection
    playlist_videos = vector_store.get_playlist_videos(playlist_id)
    if not playlist_videos:
        return {
            "answer": "This playlist has not been indexed yet. Please index it first.",
            "sources": []
        }

    # Step 2: Query keyword extraction and phonetic expansion
    clean_text = re.sub(r"[^a-zA-Z0-9\s]", " ", trimmed_query.lower())
    raw_words = clean_text.split()
    raw_keywords = [w for w in raw_words if w not in STOP_WORDS and (len(w) > 2 or w in ('ai', 'ml'))]

    expanded_keywords = list(raw_keywords)
    for kw in raw_keywords:
        if kw in PHONETIC_MAP:
            expanded_keywords.extend(PHONETIC_MAP[kw])

    all_keywords = list(dict.fromkeys(expanded_keywords))
    logger.info(f"Keywords for ranking: {all_keywords}")

    # Check if any query keyword matches video titles in the playlist
    matching_title_videos = [
        v for v in playlist_videos
        if any(kw in v.get("title", "").lower() for kw in all_keywords)
    ]
    logger.info(f"Found {len(matching_title_videos)} videos matching title keywords")

    # Step 3: Dense vector search via Qdrant
    query_vector = embed_text(trimmed_query)
    candidates = vector_store.query(
        vector=query_vector,
        filter_dict={"playlist_id": playlist_id},
        top_k=60
    )

    if not candidates:
        return {
            "answer": "This playlist has not been indexed yet. Please index it first.",
            "sources": []
        }

    # Step 4: Hybrid score fusion with distinct raw_score and final_score
    scored_candidates = []
    for cand in candidates:
        meta = cand.get("metadata", {})
        title = meta.get("video_title", "").lower()
        text = meta.get("chunk_text", "").lower()

        boost = 0.0
        for kw in all_keywords:
            if kw in title:
                boost += 0.40  # Boost for video title match
            if kw in text:
                boost += 0.15  # Boost for transcript match

        raw_score = cand.get("score", 0.0)
        final_score = raw_score + boost

        scored_candidates.append({
            **cand,
            "raw_score": raw_score,
            "final_score": final_score,
            "score": min(0.99, round(final_score, 2))
        })

    scored_candidates.sort(key=lambda c: c["final_score"], reverse=True)

    # Resolve playlist title
    playlist_title = "this course"
    if candidates:
        playlist_title = candidates[0].get("metadata", {}).get("playlist_title") or playlist_title
    if playlist_title == "this course":
        for pl in vector_store.get_playlists():
            if pl.get("playlist_id") == playlist_id:
                playlist_title = pl.get("playlist_title", "this course")
                break

    # STRICT RELEVANCE GATE:
    # If the query is unrelated/conversational and NO candidate matches title/keywords nor has high vector score:
    # Return NOTHING!
    top_cand = scored_candidates[0] if scored_candidates else None
    has_keyword_boost = top_cand and (top_cand["final_score"] - top_cand["raw_score"] >= 0.15)
    has_title_match = len(matching_title_videos) > 0
    has_strong_vector_match = top_cand and (top_cand["raw_score"] >= 0.35)

    if not has_keyword_boost and not has_title_match and not has_strong_vector_match:
        logger.info(f"🛑 No relevant topic found for '{trimmed_query}' in '{playlist_title}'. (raw: {top_cand['raw_score']:.3f}, matching titles: 0)")
        return {
            "answer": f"This topic is not covered in '{playlist_title}'. Please ask a question related to the topics covered in this course syllabus.",
            "sources": []
        }

    # Filter to valid candidates only
    valid_candidates = [
        c for c in scored_candidates
        if (c["final_score"] - c["raw_score"] >= 0.15) or (c["raw_score"] >= 0.28)
    ]
    top_results = (valid_candidates if valid_candidates else scored_candidates)[:top_k]

    logger.info("Top hybrid matches:")
    for i, r in enumerate(top_results):
        meta = r["metadata"]
        logger.info(f"  [{i+1}] (raw: {r['raw_score']:.3f}, score: {r['score']}) {meta.get('video_title')} @ {meta.get('formatted_time', format_seconds(meta.get('start_time', 0)))}")

    # Step 5: Build context from chunks
    context_parts = []
    for idx, r in enumerate(top_results):
        m = r["metadata"]
        t = m.get("formatted_time") or format_seconds(m.get("start_time", 0))
        context_parts.append(f"[{idx + 1}] Video: \"{m.get('video_title')}\" (Timestamp: {t})\n\"{m.get('chunk_text')}\"")
    context_string = "\n\n".join(context_parts)

    video_catalog = "\n".join(f"- {v.get('title')}" for v in playlist_videos[:15])

    user_message = f"""This playlist ({playlist_title}) covers:
{video_catalog}

Here are transcript excerpts from the YouTube playlist:
{context_string}

---
Question: {trimmed_query}

Remember:
1. If the excerpts and syllabus do NOT discuss this topic or cannot answer this question, reply that the topic is not covered in this playlist and write NONE under ===ENGLISH_SOURCES===.
2. If it IS covered, explain clearly in English and list the citations under ===ENGLISH_SOURCES===."""

    # Step 6: Groq LLM Generation
    groq_client = Groq(api_key=settings.GROQ_API_KEY)
    completion = groq_client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": get_system_prompt(playlist_title)},
            {"role": "user", "content": user_message}
        ],
        temperature=0.2,
        max_tokens=750
    )


    full_text = completion.choices[0].message.content or "No response generated."

    # Parse answer and English sources
    answer = full_text
    english_previews = [None] * len(top_results)
    marker = "===ENGLISH_SOURCES==="
    split_idx = full_text.find(marker)
    is_none = False

    if split_idx != -1:
        answer = full_text[:split_idx].strip()
        source_section = full_text[split_idx + len(marker):].strip()

        if "NONE" in source_section.upper():
            is_none = True
        else:
            for line in source_section.split("\n"):
                m = re.match(r"^\[(\d+)\]\s*(.+)", line.strip())
                if m:
                    idx = int(m.group(1)) - 1
                    if 0 <= idx < len(top_results):
                        english_previews[idx] = m.group(2).strip()

    # Strict check: if model says not covered, return 0 sources
    lower_answer = answer.lower()
    if (
        is_none
        or "not covered in this playlist" in lower_answer
        or "not discussed in this playlist" in lower_answer
        or "do not contain a direct definition" in lower_answer
        or "no mention" in lower_answer
    ):
        logger.info("Model determined query is not present in playlist. Returning 0 sources.")
        return {
            "answer": answer,
            "sources": []
        }

    # Step 7: Format sources
    sources = []
    for idx, r in enumerate(top_results):
        meta = r["metadata"]
        preview = english_previews[idx]
        t = meta.get("formatted_time") or format_seconds(meta.get("start_time", 0))

        # Check for Devanagari unicode characters
        if not preview or re.search(r"[\u0900-\u097F]", preview):
            preview = f"Discussion in \"{meta.get('video_title')}\" at {t}."

        sources.append({
            "video_id": meta.get("video_id"),
            "title": meta.get("video_title"),
            "timestamp": meta.get("start_time", 0),
            "formatted_time": t,
            "chunk_preview": preview,
            "original_text": (meta.get("chunk_text") or "")[:200] + "...",
            "youtube_url": meta.get("youtube_url") or f"https://www.youtube.com/watch?v={meta.get('video_id')}&t={meta.get('start_time', 0)}s",
            "thumbnail_url": meta.get("thumbnail_url"),
            "similarity": r["score"],
        })

    logger.info(f"Generated English answer with {len(sources)} sources")
    return {
        "answer": answer,
        "sources": sources
    }

def search_rag_stream(query: str, playlist_id: str, top_k: int = 5) -> Generator[str, None, None]:
    """
    Execute streaming RAG pipeline using Server-Sent Events (SSE).
    Emits:
      - {"type": "sources", "sources": [...]}
      - {"type": "token", "text": "..."}
      - {"type": "done"}
    """
    if not settings.GROQ_API_KEY:
        yield f"data: {json.dumps({'type': 'error', 'message': 'GROQ_API_KEY is not configured in .env'})}\n\n"
        return

    trimmed_query = (query or "").strip()
    if len(trimmed_query) < 2 or not re.search(r"[a-zA-Z0-9]", trimmed_query):
        yield f"data: {json.dumps({'type': 'token', 'text': 'Please enter a valid question or topic related to this course playlist.'})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    logger.info(f"Streaming query: '{trimmed_query}' in playlist: {playlist_id}")

    # 1. Syllabus check
    playlist_videos = vector_store.get_playlist_videos(playlist_id)
    if not playlist_videos:
        yield f"data: {json.dumps({'type': 'token', 'text': 'This playlist has not been indexed yet. Please index it first.'})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    # 2. Keywords
    clean_text = re.sub(r"[^a-zA-Z0-9\s]", " ", trimmed_query.lower())
    raw_words = clean_text.split()
    raw_keywords = [w for w in raw_words if w not in STOP_WORDS and (len(w) > 2 or w in ('ai', 'ml'))]

    expanded_keywords = list(raw_keywords)
    for kw in raw_keywords:
        if kw in PHONETIC_MAP:
            expanded_keywords.extend(PHONETIC_MAP[kw])

    all_keywords = list(dict.fromkeys(expanded_keywords))
    matching_title_videos = [
        v for v in playlist_videos
        if any(kw in v.get("title", "").lower() for kw in all_keywords)
    ]

    # 3. Dense vector search via Qdrant
    query_vector = embed_text(trimmed_query)
    candidates = vector_store.query(
        vector=query_vector,
        filter_dict={"playlist_id": playlist_id},
        top_k=60
    )

    if not candidates:
        yield f"data: {json.dumps({'type': 'token', 'text': 'This playlist has not been indexed yet. Please index it first.'})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    # 4. Hybrid score fusion
    scored_candidates = []
    for cand in candidates:
        meta = cand.get("metadata", {})
        title = meta.get("video_title", "").lower()
        text = meta.get("chunk_text", "").lower()

        boost = 0.0
        for kw in all_keywords:
            if kw in title:
                boost += 0.40
            if kw in text:
                boost += 0.15

        raw_score = cand.get("score", 0.0)
        final_score = raw_score + boost

        scored_candidates.append({
            **cand,
            "raw_score": raw_score,
            "final_score": final_score,
            "score": min(0.99, round(final_score, 2))
        })

    scored_candidates.sort(key=lambda c: c["final_score"], reverse=True)

    # Resolve playlist title
    playlist_title = "this course"
    if candidates:
        playlist_title = candidates[0].get("metadata", {}).get("playlist_title") or playlist_title
    if playlist_title == "this course":
        for pl in vector_store.get_playlists():
            if pl.get("playlist_id") == playlist_id:
                playlist_title = pl.get("playlist_title", "this course")
                break

    top_cand = scored_candidates[0] if scored_candidates else None
    has_keyword_boost = top_cand and (top_cand["final_score"] - top_cand["raw_score"] >= 0.15)
    has_title_match = len(matching_title_videos) > 0
    has_strong_vector_match = top_cand and (top_cand["raw_score"] >= 0.35)

    if not has_keyword_boost and not has_title_match and not has_strong_vector_match:
        yield f"data: {json.dumps({'type': 'token', 'text': f'This topic is not covered in \"{playlist_title}\". Please ask a question related to this course syllabus.'})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return

    valid_candidates = [
        c for c in scored_candidates
        if (c["final_score"] - c["raw_score"] >= 0.15) or (c["raw_score"] >= 0.28)
    ]
    top_results = (valid_candidates if valid_candidates else scored_candidates)[:top_k]

    # Format sources and emit immediately!
    sources = []
    for idx, r in enumerate(top_results):
        meta = r["metadata"]
        t = meta.get("formatted_time") or format_seconds(meta.get("start_time", 0))
        sources.append({
            "video_id": meta.get("video_id"),
            "title": meta.get("video_title"),
            "timestamp": meta.get("start_time", 0),
            "formatted_time": t,
            "chunk_preview": f"Discussion in \"{meta.get('video_title')}\" at {t}.",
            "original_text": (meta.get("chunk_text") or "")[:200] + "...",
            "youtube_url": meta.get("youtube_url") or f"https://www.youtube.com/watch?v={meta.get('video_id')}&t={meta.get('start_time', 0)}s",
            "thumbnail_url": meta.get("thumbnail_url"),
            "similarity": r["score"],
        })

    yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

    # 5. Build context
    context_parts = []
    for idx, r in enumerate(top_results):
        m = r["metadata"]
        t = m.get("formatted_time") or format_seconds(m.get("start_time", 0))
        context_parts.append(f"[{idx + 1}] Video: \"{m.get('video_title')}\" (Timestamp: {t})\n\"{m.get('chunk_text')}\"")
    context_string = "\n\n".join(context_parts)

    video_catalog = "\n".join(f"- {v.get('title')}" for v in playlist_videos[:15])

    user_message = f"""This playlist ({playlist_title}) covers:
{video_catalog}

Here are transcript excerpts from the YouTube playlist:
{context_string}

---
Question: {trimmed_query}

Provide a comprehensive, clearly explained educational response in English Markdown. Cite relevant video titles and timestamps."""

    stream_system_prompt = f"""You are an expert, dedicated AI study tutor for the YouTube course: "{playlist_title}".
CRITICAL INSTRUCTIONS:
1. FOCUS: Answer questions strictly based on the syllabus and transcript excerpts of "{playlist_title}".
2. RELEVANCE: If the question is not covered in this course, state clearly: "This topic is not covered in '{playlist_title}'. Please ask a question related to this course syllabus."
3. LANGUAGE: ALWAYS answer entirely in clear, natural ENGLISH. Even if the video transcripts are in Hindi, Hinglish, or Devanagari script, NEVER write in Hindi or Devanagari script. All explanations, bullet points, and summaries MUST BE IN ENGLISH.
4. CITATIONS: Cite the exact video title and timestamp: [Video Title @ timestamp].
5. FORMATTING: Use clean Markdown with headers, bullet points, bold keywords, and concise explanations."""

    # 6. Stream Groq tokens
    try:
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        stream = groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": stream_system_prompt},
                {"role": "user", "content": user_message}
            ],

            temperature=0.2,
            max_tokens=750,
            stream=True
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield f"data: {json.dumps({'type': 'token', 'text': delta})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as err:
        logger.error(f"Error in Groq streaming: {err}")
        yield f"data: {json.dumps({'type': 'error', 'message': str(err)})}\n\n"

