import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.vector_store import vector_store
from app.db.catalog_db import catalog_db
from app.services.youtube_service import parse_playlist_id, fetch_playlist_videos
from app.services.transcriber import get_transcript
from app.services.chunker import chunk_transcript
from app.services.embedder import embed_batch
from app.services.telegram_service import send_telegram_notification

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
                "playlist_title": playlist["title"],
                "channel_title": playlist.get("channel_title", "")
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

        # Save into high-performance catalog database
        catalog_db.upsert_playlist(
            playlist_id=playlist["playlist_id"],
            title=playlist["title"],
            channel_title=playlist.get("channel_title", ""),
            thumbnail_url=playlist.get("thumbnail_url", ""),
            video_count=len(processed_videos),
            chunk_count=total_chunks_indexed
        )
        catalog_db.upsert_videos(playlist["playlist_id"], processed_videos)

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
def get_playlists_endpoint(search: Optional[str] = None, page: int = 1, limit: int = 20):
    try:
        # Sync from vector store if catalog db is newly initialized
        catalog_db.sync_from_vector_store_if_empty(vector_store)
        data = catalog_db.get_playlists(search=search or "", page=page, limit=limit)
        return {
            "count": len(data["playlists"]),
            "total": data["total"],
            "page": data["page"],
            "limit": data["limit"],
            "has_more": data["has_more"],
            "playlists": data["playlists"]
        }
    except Exception as e:
        logger.error(f"Error in get_playlists: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/playlist/{playlist_id}")
def get_playlist_endpoint(playlist_id: str, offset: int = 0, limit: Optional[int] = None):
    try:
        catalog_db.sync_from_vector_store_if_empty(vector_store)
        pl_info = catalog_db.get_playlist_meta(playlist_id)

        # Fallback to vector store if not in catalog
        if not pl_info:
            videos = vector_store.get_playlist_videos(playlist_id)
            if not videos:
                raise HTTPException(status_code=404, detail="Playlist not found.")
            playlists = vector_store.get_playlists()
            matched = next((p for p in playlists if p.get("playlist_id") == playlist_id), None)
            pl_info = {
                "playlist_id": playlist_id,
                "playlist_title": matched.get("playlist_title", "Unknown Playlist") if matched else "Unknown Playlist",
                "channel_title": matched.get("channel_title", "") if matched else "",
                "thumbnail_url": matched.get("thumbnail_url", "") if matched else "",
                "video_count": len(videos),
                "chunk_count": matched.get("chunk_count", 0) if matched else 0,
            }
            catalog_db.upsert_playlist(
                playlist_id=playlist_id,
                title=pl_info["playlist_title"],
                channel_title=pl_info["channel_title"],
                thumbnail_url=pl_info["thumbnail_url"],
                video_count=pl_info["video_count"],
                chunk_count=pl_info["chunk_count"]
            )
            catalog_db.upsert_videos(playlist_id, videos)

        videos_data = catalog_db.get_playlist_videos(
            playlist_id=playlist_id,
            offset=offset,
            limit=limit if limit is not None else 1000
        )

        return {
            "playlist_id": playlist_id,
            "title": pl_info.get("playlist_title", "Unknown Playlist"),
            "channel_title": pl_info.get("channel_title", ""),
            "thumbnail_url": pl_info.get("thumbnail_url", ""),
            "video_count": pl_info.get("video_count", videos_data["total"]),
            "chunk_count": pl_info.get("chunk_count", 0),
            "videos": videos_data["videos"],
            "loaded_count": len(videos_data["videos"]),
            "total_videos": videos_data["total"],
            "offset": offset,
            "has_more": videos_data["has_more"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_playlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/playlist/{playlist_id}")
def delete_playlist_endpoint(playlist_id: str):
    try:
        catalog_db.delete_playlist(playlist_id)
        res = vector_store.delete_playlist(playlist_id)
        return {
            "success": True,
            "playlist_id": playlist_id,
            "deletedCount": res.get("deletedCount", 0)
        }
    except Exception as e:
        logger.error(f"Error in delete_playlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class PlaylistRequestPayload(BaseModel):
    name: Optional[str] = "Anonymous"
    email: Optional[str] = "Not provided"
    playlistUrl: str
    subject: str
    note: Optional[str] = ""

@router.post("/request-playlist")
def request_playlist_endpoint(req: PlaylistRequestPayload):
    try:
        url = (req.playlistUrl or "").strip()
        subject = (req.subject or "").strip()
        if not url:
            raise HTTPException(status_code=400, detail="Playlist URL is required.")
        if not subject:
            raise HTTPException(status_code=400, detail="Subject / Course name is required.")

        # Send Telegram notification to admin
        sent = send_telegram_notification(
            name=req.name or "Anonymous",
            email=req.email or "Not provided",
            playlist_url=url,
            subject=subject,
            note=req.note or ""
        )

        return {
            "success": True,
            "message": "Playlist request submitted successfully! The admin has been notified.",
            "telegramNotified": sent
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in request_playlist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

