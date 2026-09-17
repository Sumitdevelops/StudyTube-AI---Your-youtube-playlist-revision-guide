from typing import List, Dict, Any
import math

CHUNK_TARGET_WORDS = 150  # ~500 tokens ≈ 150 words
OVERLAP_WORDS = 30        # ~50 tokens overlap between chunks

def format_seconds(seconds: float) -> str:
    """Format seconds into m:ss or h:mm:ss."""
    total_seconds = max(0, int(math.floor(seconds)))
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60

    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"

def chunk_transcript(segments: List[Dict[str, Any]], video_meta: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Chunk video transcript segments into overlapping text blocks with timestamps.
    segments: list of {'text': str, 'start': float, 'duration': float}
    video_meta: dict with video_id, title, thumbnail_url, duration, playlist_id, playlist_title
    """
    if not segments:
        return []

    words = []
    for seg in segments:
        seg_words = [w for w in seg.get('text', '').split() if w]
        seg_len = max(len(seg_words), 1)
        start = seg.get('start', 0)
        duration = seg.get('duration', 0)
        for i, word in enumerate(seg_words):
            word_time = start + (duration * i) / seg_len
            words.append({"word": word, "time": int(math.floor(word_time))})

    if not words:
        return []

    chunks = []
    chunk_index = 0
    start_idx = 0
    step = CHUNK_TARGET_WORDS - OVERLAP_WORDS

    while start_idx < len(words):
        end_idx = min(start_idx + CHUNK_TARGET_WORDS, len(words))
        chunk_words = words[start_idx:end_idx]

        chunk_text = " ".join(w["word"] for w in chunk_words)
        start_time = chunk_words[0]["time"]
        end_time = chunk_words[-1]["time"]

        chunk_id = f"{video_meta['video_id']}_chunk_{chunk_index:04d}"

        chunks.append({
            "id": chunk_id,
            "chunk_text": chunk_text,
            "start_time": start_time,
            "end_time": end_time,
            "chunk_index": chunk_index,
            "metadata": {
                "playlist_id": video_meta.get("playlist_id", ""),
                "playlist_title": video_meta.get("playlist_title", ""),
                "video_id": video_meta["video_id"],
                "video_title": video_meta.get("title", ""),
                "thumbnail_url": video_meta.get("thumbnail_url", ""),
                "start_time": start_time,
                "end_time": end_time,
                "formatted_time": format_seconds(start_time),
                "chunk_index": chunk_index,
                "chunk_text": chunk_text,
                "youtube_url": f"https://www.youtube.com/watch?v={video_meta['video_id']}&t={start_time}s",
            }
        })

        chunk_index += 1
        if end_idx >= len(words):
            break
        start_idx += step

    return chunks
