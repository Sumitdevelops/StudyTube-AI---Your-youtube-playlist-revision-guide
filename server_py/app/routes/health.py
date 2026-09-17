import time
from datetime import datetime, timezone
from fastapi import APIRouter
from app.config import settings
from app.db.vector_store import vector_store

router = APIRouter()
START_TIME = time.time()

@router.get("/health")
def get_health():
    count = vector_store.get_count()
    return {
        "status": "ok",
        "uptime": round(time.time() - START_TIME, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "config": {
            "groqConfigured": bool(settings.GROQ_API_KEY),
            "groqModel": settings.GROQ_MODEL,
            "youtubeConfigured": bool(settings.YOUTUBE_API_KEY),
            "vectorDbMode": settings.VECTOR_DB_MODE,
            "vectorCount": count,
            "embedder": {
                "model": settings.EMBEDDING_MODEL,
                "dimension": settings.EMBEDDING_DIMENSION
            }
        }
    }
