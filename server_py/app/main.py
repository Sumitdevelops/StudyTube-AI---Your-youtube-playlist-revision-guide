import os
# Prevent multi-threading memory overhead on low-RAM containers
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.health import router as health_router
from app.routes.playlist import router as playlist_router
from app.routes.search import router as search_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

app = FastAPI(
    title="YouTube Playlist Study Assistant (Python Backend)",
    description="FastAPI + Qdrant + SentenceTransformers + Groq RAG Engine",
    version="2.0.0"
)

# CORS middleware for Next.js frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes under /api
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(playlist_router, prefix="/api", tags=["Playlist"])
app.include_router(search_router, prefix="/api", tags=["Search"])

# Also mount under root as alias for flexibility
app.include_router(health_router, tags=["Health"])
app.include_router(playlist_router, tags=["Playlist"])
app.include_router(search_router, tags=["Search"])

@app.on_event("startup")
def startup_event():
    logger.info("=" * 60)
    logger.info(f"🚀 Python Study Assistant API starting on port {settings.PORT}")
    logger.info(f"   Health check: http://localhost:{settings.PORT}/api/health")
    logger.info(f"   Groq Model: {settings.GROQ_MODEL} (API Key: {'✅ Configured' if settings.GROQ_API_KEY else '❌ Missing'})")
    logger.info(f"   Embedder: SentenceTransformers ({settings.EMBEDDING_MODEL}, {settings.EMBEDDING_DIMENSION}d)")
    logger.info(f"   Vector DB: {settings.VECTOR_DB_MODE} at {settings.QDRANT_URL}")
    logger.info("=" * 60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=(settings.ENV == "development"))
