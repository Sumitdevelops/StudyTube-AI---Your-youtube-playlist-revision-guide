import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.vector_store import vector_store
from app.services.youtube_service import parse_playlist_id, fetch_playlist_videos
from app.services.transcriber import get_transcript
from app.services.chunker import chunk_transcript
from app.services.embedder import embed_batch

router = APIRouter()
logger = logging.getLogger("playlist_routes")

class TranscribeRequest(BaseModel):
    url: str

@router.post("/transcribe-playlist")
def transcribe_playlist_endpoint(req: TranscribeRequest):
    try:
        url = req.url
        if not url:
            raise HTTPException(status_code=400, detail="Playlist URL is required.")

        playlist_id = parse_playlist_id(url)
        logger.info(f"Ingesting playlist: {playlist_id}")

        # 1. Fetch playlist metadata and videos
        playlist = fetch_playlist_videos(playlist_id)
        videos = playlist.get("videos", [])
        if not videos:
            raise HTTPException(status_code=400, detail="No videos found in this playlist.")

        logger.info(f"Found {len(videos)} videos in '{playlist['title']}'")

        processed_videos = []
        total_chunks_indexed = 0

        for i, video in enumerate(videos):
            logger.info(f"[{i+1}/{len(videos)}] Processing: {video['title']} ({video['video_id']})")

            # 2. Extract captions
            segments = []
            try:
                segments = get_transcript(video["video_id"])
            except Exception as e:
                logger.warning(f"Could not get transcript for {video['video_id']}: {e}")

            if not segments:
                processed_videos.append({
                    "video_id": video["video_id"],
                    "title": video["title"],
                    "thumbnail_url": video["thumbnail_url"],
                    "duration": video.get("duration", 0),
                    "has_transcript": False,
                })
                continue

            # 3. Chunk transcript
            chunks = chunk_transcript(segments, {
                "video_id": video["video_id"],
                "title": video["title"],
                "thumbnail_url": video["thumbnail_url"],
                "duration": video.get("duration", 0),
                "playlist_id": playlist["playlist_id"],
                "playlist_title": playlist["title"]
            })

            if not chunks:
                processed_videos.append({
                    "video_id": video["video_id"],
                    "title": video["title"],
                    "thumbnail_url": video["thumbnail_url"],
                    "duration": video.get("duration", 0),
                    "has_transcript": False,
                })
                continue

            # 4. Generate embeddings
            texts = [c["chunk_text"] for c in chunks]
            embeddings = embed_batch(texts)

            # 5. Prepare vector records
            records = [
                {
                    "id": chunk["id"],
                    "values": embeddings[idx],
                    "metadata": chunk["metadata"]
                }
                for idx, chunk in enumerate(chunks)
            ]

            # 6. Upsert to Vector DB
            vector_store.upsert(records)
            total_chunks_indexed += len(chunks)

            logger.info(f"Indexed {len(chunks)} chunks for {video['title']} (Total: {total_chunks_indexed})")
            processed_videos.append({
                "video_id": video["video_id"],
                "title": video["title"],
                "thumbnail_url": video["thumbnail_url"],
                "duration": video.get("duration", 0),
                "has_transcript": True,
                "chunk_count": len(chunks)
            })

        if total_chunks_indexed == 0:
            raise HTTPException(
                status_code=400,
                detail="Could not extract any transcripts from this playlist. Videos may not have captions enabled."
            )

        return {
            "success": True,
            "playlist": {
                "playlist_id": playlist["playlist_id"],
                "title": playlist["title"],
                "thumbnail_url": playlist.get("thumbnail_url", ""),
                "video_count": len(processed_videos),
                "chunk_count": total_chunks_indexed,
            },
            "videos": processed_videos
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in transcribe playlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/playlists")
def get_playlists_endpoint():
    try:
        playlists = vector_store.get_playlists()
        return {
            "count": len(playlists),
            "playlists": playlists
        }
    except Exception as e:
        logger.error(f"Error in get_playlists: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/playlist/{playlist_id}")
def get_playlist_endpoint(playlist_id: str):
    try:
        videos = vector_store.get_playlist_videos(playlist_id)
        if not videos:
            raise HTTPException(status_code=404, detail="Playlist not found.")

        playlists = vector_store.get_playlists()
        pl_info = next((p for p in playlists if p.get("playlist_id") == playlist_id), None)
        title = pl_info.get("playlist_title", "Unknown Playlist") if pl_info else "Unknown Playlist"

        return {
            "playlist_id": playlist_id,
            "title": title,
            "video_count": len(videos),
            "chunk_count": 0,
            "videos": videos
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_playlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/playlist/{playlist_id}")
def delete_playlist_endpoint(playlist_id: str):
    try:
        res = vector_store.delete_playlist(playlist_id)
        return {
            "success": True,
            "playlist_id": playlist_id,
            "deletedCount": res.get("deletedCount", 0)
        }
    except Exception as e:
        logger.error(f"Error in delete_playlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))
