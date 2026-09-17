import logging
from typing import List
from app.config import settings

logger = logging.getLogger("embedder")

_fastembed_model = None
_sentence_transformer_model = None

def get_model():
    global _fastembed_model, _sentence_transformer_model
    if _fastembed_model is not None or _sentence_transformer_model is not None:
        return _fastembed_model or _sentence_transformer_model

    # 1. Prefer FastEmbed (ONNX): uses only ~40MB RAM instead of 450MB+ PyTorch
    try:
        from fastembed import TextEmbedding
        logger.info("Using lightweight FastEmbed ONNX engine (~40MB RAM)...")
        _fastembed_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        logger.info("FastEmbed loaded successfully (384d).")
        return _fastembed_model
    except Exception as e:
        logger.info(f"FastEmbed not available ({e}), falling back to SentenceTransformer...")

    # 2. Fallback to SentenceTransformer
    import torch
    torch.set_num_threads(1)
    torch.set_num_interop_threads(1)
    from sentence_transformers import SentenceTransformer
    _sentence_transformer_model = SentenceTransformer(settings.EMBEDDING_MODEL, device="cpu")
    _sentence_transformer_model.eval()
    logger.info("SentenceTransformer loaded successfully.")
    return _sentence_transformer_model

def embed_text(text: str) -> List[float]:
    """Generate normalized embedding for a single string with minimal memory."""
    get_model()
    if _fastembed_model is not None:
        vecs = list(_fastembed_model.embed([text]))
        return vecs[0].tolist()
    else:
        import torch
        with torch.inference_mode():
            vec = _sentence_transformer_model.encode(text, normalize_embeddings=True, show_progress_bar=False)
        return vec.tolist()

def embed_batch(texts: List[str], batch_size: int = 16) -> List[List[float]]:
    """Generate normalized embeddings for a list of strings."""
    if not texts:
        return []
    get_model()
    if _fastembed_model is not None:
        vecs = list(_fastembed_model.embed(texts, batch_size=batch_size))
        return [v.tolist() for v in vecs]
    else:
        import torch
        with torch.inference_mode():
            vecs = _sentence_transformer_model.encode(texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False)
        return vecs.tolist()

