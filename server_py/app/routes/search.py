import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.services.groq_rag import search_rag, search_rag_stream

router = APIRouter()
logger = logging.getLogger("search_routes")

class SearchRequest(BaseModel):
    query: str
    playlistId: str
    topK: Optional[int] = Field(default=5, ge=1, le=10)

@router.post("/search")
def search_endpoint(req: SearchRequest):
    try:
        if not req.query or not req.query.strip():
            raise HTTPException(status_code=400, detail="Query is required.")

        if not req.playlistId:
            raise HTTPException(status_code=400, detail="Playlist ID is required.")

        result = search_rag(
            query=req.query.strip(),
            playlist_id=req.playlistId,
            top_k=req.topK or 5
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search/stream")
def search_stream_endpoint(req: SearchRequest):
    try:
        if not req.query or not req.query.strip():
            raise HTTPException(status_code=400, detail="Query is required.")

        if not req.playlistId:
            raise HTTPException(status_code=400, detail="Playlist ID is required.")

        return StreamingResponse(
            search_rag_stream(
                query=req.query.strip(),
                playlist_id=req.playlistId,
                top_k=req.topK or 5
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search stream endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

