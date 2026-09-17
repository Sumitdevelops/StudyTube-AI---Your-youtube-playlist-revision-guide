import logging
from typing import List
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger("embedder")

_model = None

def get_model():
    global _model
    if _model is None:
        logger.info(f"Loading SentenceTransformer model ({settings.EMBEDDING_MODEL})...")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info(f"Model {settings.EMBEDDING_MODEL} loaded successfully ({settings.EMBEDDING_DIMENSION}d).")
    return _model

def embed_text(text: str) -> List[float]:
    """Generate normalized embedding for a single string."""
    model = get_model()
    # normalize_embeddings=True ensures cosine similarity via dot product
    vec = model.encode(text, normalize_embeddings=True)
    return vec.tolist()

def embed_batch(texts: List[str], batch_size: int = 32) -> List[List[float]]:
    """Generate normalized embeddings for a list of strings."""
    if not texts:
        return []
    model = get_model()
    vecs = model.encode(texts, batch_size=batch_size, normalize_embeddings=True)
    return vecs.tolist()
