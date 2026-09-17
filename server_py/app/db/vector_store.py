import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.db.qdrant_adapter import QdrantAdapter

logger = logging.getLogger("vector_store")

class VectorStore:
    def __init__(self):
        self.mode = settings.VECTOR_DB_MODE
        if self.mode == "qdrant":
            self.engine = QdrantAdapter()
            logger.info(f"Using Qdrant adapter at {settings.QDRANT_URL}")
        else:
            # Default fallback to Qdrant adapter since credentials are set
            self.engine = QdrantAdapter()

    def upsert(self, items: List[Dict[str, Any]]) -> Dict[str, int]:
        return self.engine.upsert(items)

    def query(self, vector: List[float], filter_dict: Optional[Dict[str, Any]] = None, top_k: int = 5) -> List[Dict[str, Any]]:
        return self.engine.query(vector=vector, filter_dict=filter_dict, top_k=top_k)

    def get_playlists(self) -> List[Dict[str, Any]]:
        return self.engine.get_playlists()

    def get_playlist_videos(self, playlist_id: str) -> List[Dict[str, Any]]:
        return self.engine.get_playlist_videos(playlist_id)

    def delete_playlist(self, playlist_id: str) -> Dict[str, Any]:
        return self.engine.delete_playlist(playlist_id)

    def get_count(self) -> int:
        return self.engine.get_count()

vector_store = VectorStore()
