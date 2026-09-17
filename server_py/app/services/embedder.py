import logging
from typing import List
from app.config import settings

logger = logging.getLogger("embedder")

_model = None

def get_model():
    global _model
    if _model is None:
        logger.info(f"Loading SentenceTransformer model ({settings.EMBEDDING_MODEL}) on CPU...")
        import torch
        torch.set_num_threads(1)
        torch.set_num_interop_threads(1)

        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.EMBEDDING_MODEL, device="cpu")
        _model.eval()
        logger.info(f"Model {settings.EMBEDDING_MODEL} loaded successfully ({settings.EMBEDDING_DIMENSION}d).")
    return _model

def embed_text(text: str) -> List[float]:
    """Generate normalized embedding for a single string with minimal memory."""
    model = get_model()
    import torch
    with torch.inference_mode():
        vec = model.encode(text, normalize_embeddings=True, show_progress_bar=False)
    return vec.tolist()

def embed_batch(texts: List[str], batch_size: int = 16) -> List[List[float]]:
    """Generate normalized embeddings for a list of strings."""
    if not texts:
        return []
    model = get_model()
    import torch
    with torch.inference_mode():
        vecs = model.encode(texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False)
    return vecs.tolist()
