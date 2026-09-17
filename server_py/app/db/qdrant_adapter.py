import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient, models
from app.config import settings

logger = logging.getLogger("qdrant")

class QdrantAdapter:
    def __init__(self):
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None
        )
        self.collection_name = settings.COLLECTION_NAME
        self._initialized = False

    def _ensure_collection(self, vector_size: int = 384):
        if self._initialized:
            return

        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)

            if not exists:
                logger.info(f"Creating collection '{self.collection_name}' ({vector_size} dims, Cosine)...")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=vector_size,
                        distance=models.Distance.COSINE
                    )
                )
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="playlist_id",
                    field_schema=models.PayloadSchemaType.KEYWORD
                )
                logger.info(f"Collection '{self.collection_name}' created with playlist_id index.")
            else:
                logger.info(f"Collection '{self.collection_name}' already exists.")

            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to ensure Qdrant collection: {e}")
            raise e

    def _string_to_uuid(self, string_id: str) -> str:
        """Deterministically convert any string ID to a valid UUID."""
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, string_id))

    def _build_filter(self, filter_dict: Optional[Dict[str, Any]]) -> Optional[models.Filter]:
        if not filter_dict:
            return None
        conditions = []
        for key, value in filter_dict.items():
            conditions.append(
                models.FieldCondition(
                    key=key,
                    match=models.MatchValue(value=value)
                )
            )
        return models.Filter(must=conditions)

    def upsert(self, items: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Upsert points with metadata.
        items: List[{ 'id': str, 'values': list[float], 'metadata': dict }]
        """
        if not items:
            return {"upsertedCount": 0}

        vector_size = len(items[0]["values"])
        self._ensure_collection(vector_size)

        points = []
        for item in items:
            p_id = self._string_to_uuid(item["id"])
            payload = {**item.get("metadata", {}), "_original_id": item["id"]}
            points.append(models.PointStruct(
                id=p_id,
                vector=item["values"],
                payload=payload
            ))

        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.client.upsert(
                collection_name=self.collection_name,
                points=batch,
                wait=True
            )

        logger.info(f"Upserted {len(items)} vectors to Qdrant")
        return {"upsertedCount": len(items)}

    def query(self, vector: List[float], filter_dict: Optional[Dict[str, Any]] = None, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Cosine similarity search with metadata filtering.
        """
        self._ensure_collection(len(vector))
        q_filter = self._build_filter(filter_dict)

        res = self.client.query_points(
            collection_name=self.collection_name,
            query=vector,
            limit=top_k,
            query_filter=q_filter,
            with_payload=True
        )

        results = []
        for point in res.points:
            payload = point.payload or {}
            orig_id = payload.pop("_original_id", str(point.id))
            results.append({
                "id": orig_id,
                "score": point.score,
                "metadata": payload
            })

        return results

    def get_playlists(self) -> List[Dict[str, Any]]:
        """Extract all unique playlists from the collection with accurate counts."""
        playlist_map = {}
        offset = None

        while True:
            scroll_res = self.client.scroll(
                collection_name=self.collection_name,
                limit=1000,
                offset=offset,
                with_payload=["playlist_id", "playlist_title", "thumbnail_url", "video_id", "channel_title", "channel_name"]
            )
            points, next_offset = scroll_res

            for p in points:
                payload = p.payload or {}
                pid = payload.get("playlist_id")
                if pid:
                    if pid not in playlist_map:
                        channel = (
                            payload.get("channel_title")
                            or payload.get("channel_name")
                            or ("Gate Smashers" if "PLxCzCOWd7ai" in pid else "Padho with Pratyush" if "PLW4OpyGE0RdY" in pid else "")
                        )
                        playlist_map[pid] = {
                            "playlist_id": pid,
                            "playlist_title": payload.get("playlist_title", ""),
                            "channel_title": channel,
                            "thumbnail_url": payload.get("thumbnail_url", ""),
                            "video_ids": set(),
                            "chunk_count": 0,
                        }
                    else:
                        if not playlist_map[pid].get("channel_title"):
                            c = payload.get("channel_title") or payload.get("channel_name")
                            if c:
                                playlist_map[pid]["channel_title"] = c
                    playlist_map[pid]["chunk_count"] += 1
                    vid = payload.get("video_id")
                    if vid:
                        playlist_map[pid]["video_ids"].add(vid)

            offset = next_offset
            if offset is None:
                break

        results = []
        for item in playlist_map.values():
            v_ids = item.pop("video_ids", set())
            item["video_count"] = len(v_ids)
            results.append(item)

        return results


    def get_playlist_videos(self, playlist_id: str) -> List[Dict[str, Any]]:
        """Get all unique videos in a playlist."""
        video_map = {}
        offset = None
        q_filter = models.Filter(
            must=[models.FieldCondition(key="playlist_id", match=models.MatchValue(value=playlist_id))]
        )

        while True:
            scroll_res = self.client.scroll(
                collection_name=self.collection_name,
                limit=1000,
                offset=offset,
                with_payload=["video_id", "video_title", "thumbnail_url", "video_duration", "playlist_id"],
                scroll_filter=q_filter
            )
            points, next_offset = scroll_res

            for p in points:
                payload = p.payload or {}
                vid = payload.get("video_id")
                if vid and vid not in video_map:
                    video_map[vid] = {
                        "video_id": vid,
                        "title": payload.get("video_title", ""),
                        "thumbnail_url": payload.get("thumbnail_url", ""),
                        "duration": payload.get("video_duration", 0),
                        "youtube_url": f"https://www.youtube.com/watch?v={vid}",
                    }

            offset = next_offset
            if offset is None:
                break

        return list(video_map.values())

    def delete_playlist(self, playlist_id: str) -> Dict[str, Any]:
        """Delete all vectors for a given playlist."""
        q_filter = models.Filter(
            must=[models.FieldCondition(key="playlist_id", match=models.MatchValue(value=playlist_id))]
        )
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=models.FilterSelector(filter=q_filter),
            wait=True
        )
        logger.info(f"Deleted points for playlist: {playlist_id}")
        return {"deletedCount": -1}

    def get_count(self) -> int:
        """Get total vector count."""
        try:
            info = self.client.get_collection(self.collection_name)
            return info.points_count or 0
        except Exception:
            return 0
