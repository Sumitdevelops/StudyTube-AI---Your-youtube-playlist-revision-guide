import os
import sqlite3
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("catalog_db")

class CatalogDB:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.CATALOG_DB_PATH
        # Ensure parent directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # Enable WAL mode for high concurrency reading and writing
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("PRAGMA cache_size=-64000;")  # 64MB cache
        conn.execute("PRAGMA temp_store=MEMORY;")
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS playlists (
                    playlist_id TEXT PRIMARY KEY,
                    playlist_title TEXT NOT NULL,
                    channel_title TEXT DEFAULT '',
                    thumbnail_url TEXT DEFAULT '',
                    video_count INTEGER DEFAULT 0,
                    chunk_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE INDEX IF NOT EXISTS idx_playlists_title ON playlists(playlist_title COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_playlists_channel ON playlists(channel_title COLLATE NOCASE);
                CREATE INDEX IF NOT EXISTS idx_playlists_updated ON playlists(updated_at DESC);

                -- FTS5 Full-Text Search index for instant search across 1M+ playlists
                CREATE VIRTUAL TABLE IF NOT EXISTS playlists_fts USING fts5(
                    playlist_title,
                    channel_title,
                    content='playlists',
                    content_rowid='rowid',
                    tokenize='unicode61 remove_diacritics 2'
                );

                -- Auto-sync triggers: keep FTS index in lockstep with playlists table
                CREATE TRIGGER IF NOT EXISTS playlists_ai AFTER INSERT ON playlists BEGIN
                    INSERT INTO playlists_fts(rowid, playlist_title, channel_title)
                    VALUES (new.rowid, new.playlist_title, new.channel_title);
                END;

                CREATE TRIGGER IF NOT EXISTS playlists_ad AFTER DELETE ON playlists BEGIN
                    INSERT INTO playlists_fts(playlists_fts, rowid, playlist_title, channel_title)
                    VALUES ('delete', old.rowid, old.playlist_title, old.channel_title);
                END;

                CREATE TRIGGER IF NOT EXISTS playlists_au AFTER UPDATE ON playlists BEGIN
                    INSERT INTO playlists_fts(playlists_fts, rowid, playlist_title, channel_title)
                    VALUES ('delete', old.rowid, old.playlist_title, old.channel_title);
                    INSERT INTO playlists_fts(rowid, playlist_title, channel_title)
                    VALUES (new.rowid, new.playlist_title, new.channel_title);
                END;

                CREATE TABLE IF NOT EXISTS videos (
                    playlist_id TEXT NOT NULL,
                    video_id TEXT NOT NULL,
                    video_index INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    thumbnail_url TEXT DEFAULT '',
                    duration INTEGER DEFAULT 0,
                    has_transcript INTEGER DEFAULT 1,
                    chunk_count INTEGER DEFAULT 0,
                    PRIMARY KEY (playlist_id, video_id),
                    FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_videos_playlist_pos ON videos(playlist_id, video_index ASC);
            """)

            # Rebuild FTS index if it's empty but playlists exist (handles DB upgrade)
            fts_count = conn.execute("SELECT COUNT(*) FROM playlists_fts").fetchone()[0]
            pl_count = conn.execute("SELECT COUNT(*) FROM playlists").fetchone()[0]
            if pl_count > 0 and fts_count == 0:
                logger.info("Rebuilding FTS5 index from existing playlists...")
                conn.execute("INSERT INTO playlists_fts(playlists_fts) VALUES('rebuild');")
                conn.commit()

        logger.info(f"Initialized CatalogDB at {self.db_path}")

    def upsert_playlist(
        self,
        playlist_id: str,
        title: str,
        channel_title: str = "",
        thumbnail_url: str = "",
        video_count: int = 0,
        chunk_count: int = 0
    ):
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO playlists (playlist_id, playlist_title, channel_title, thumbnail_url, video_count, chunk_count, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(playlist_id) DO UPDATE SET
                    playlist_title = excluded.playlist_title,
                    channel_title = excluded.channel_title,
                    thumbnail_url = excluded.thumbnail_url,
                    video_count = excluded.video_count,
                    chunk_count = excluded.chunk_count,
                    updated_at = CURRENT_TIMESTAMP;
            """, (playlist_id, title, channel_title, thumbnail_url, video_count, chunk_count))

    def upsert_videos(self, playlist_id: str, videos: List[Dict[str, Any]]):
        if not videos:
            return
        with self._get_connection() as conn:
            rows = []
            for idx, v in enumerate(videos):
                v_idx = v.get("video_index", idx)
                rows.append((
                    playlist_id,
                    v["video_id"],
                    v_idx,
                    v.get("title", "Untitled Video"),
                    v.get("thumbnail_url", ""),
                    v.get("duration", 0),
                    1 if v.get("has_transcript", True) else 0,
                    v.get("chunk_count", 0)
                ))
            conn.executemany("""
                INSERT INTO videos (playlist_id, video_id, video_index, title, thumbnail_url, duration, has_transcript, chunk_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(playlist_id, video_id) DO UPDATE SET
                    video_index = excluded.video_index,
                    title = excluded.title,
                    thumbnail_url = excluded.thumbnail_url,
                    duration = excluded.duration,
                    has_transcript = excluded.has_transcript,
                    chunk_count = excluded.chunk_count;
            """, rows)

    def get_playlists(self, search: str = "", page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Instant search across 1M+ playlists using FTS5 inverted index.
        For search queries: skips expensive COUNT(*) — fetches limit+1 to detect has_more.
        For browse (no search): uses cached total from fast COUNT(*) on indexed table.
        """
        page = max(1, page)
        limit = max(1, min(100, limit))
        offset = (page - 1) * limit
        # Fetch one extra row to detect "has_more" without a separate COUNT(*)
        fetch_limit = limit + 1

        with self._get_connection() as conn:
            if search and search.strip():
                # Build FTS5 query: each word becomes a prefix match token
                # e.g. "deep learn" -> '"deep" * OR "learn" *'
                raw_terms = search.strip().split()
                fts_query = " OR ".join(f'"{t}" *' for t in raw_terms if t)

                cur = conn.execute("""
                    SELECT p.playlist_id, p.playlist_title, p.channel_title,
                           p.thumbnail_url, p.video_count, p.chunk_count
                    FROM playlists_fts fts
                    JOIN playlists p ON p.rowid = fts.rowid
                    WHERE playlists_fts MATCH ?
                    ORDER BY fts.rank
                    LIMIT ? OFFSET ?
                """, (fts_query, fetch_limit, offset))

                rows = cur.fetchall()
                has_more = len(rows) > limit
                items = [dict(r) for r in rows[:limit]]
                # Estimate total: exact count is expensive on search; UI only needs has_more
                total = offset + len(items) + (1 if has_more else 0)
            else:
                count_cur = conn.execute("SELECT COUNT(*) FROM playlists")
                total = count_cur.fetchone()[0]

                cur = conn.execute("""
                    SELECT playlist_id, playlist_title, channel_title, thumbnail_url, video_count, chunk_count
                    FROM playlists
                    ORDER BY updated_at DESC
                    LIMIT ? OFFSET ?
                """, (limit, offset))
                items = [dict(row) for row in cur.fetchall()]
                has_more = (offset + len(items)) < total

        return {
            "playlists": items,
            "total": total,
            "page": page,
            "limit": limit,
            "has_more": has_more
        }

    def get_playlist_meta(self, playlist_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cur = conn.execute("""
                SELECT playlist_id, playlist_title, channel_title, thumbnail_url, video_count, chunk_count
                FROM playlists
                WHERE playlist_id = ?
            """, (playlist_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    def get_playlist_videos(self, playlist_id: str, offset: int = 0, limit: int = 10) -> Dict[str, Any]:
        """
        Sliced / paginated video fetching for progressive loading.
        """
        offset = max(0, offset)
        limit = max(1, min(200, limit))

        with self._get_connection() as conn:
            count_cur = conn.execute("SELECT COUNT(*) FROM videos WHERE playlist_id = ?", (playlist_id,))
            total = count_cur.fetchone()[0]

            cur = conn.execute("""
                SELECT video_id, title, thumbnail_url, duration, has_transcript, chunk_count
                FROM videos
                WHERE playlist_id = ?
                ORDER BY video_index ASC
                LIMIT ? OFFSET ?
            """, (playlist_id, limit, offset))

            videos = []
            for row in cur.fetchall():
                v = dict(row)
                v["has_transcript"] = bool(v["has_transcript"])
                v["youtube_url"] = f"https://www.youtube.com/watch?v={v['video_id']}"
                videos.append(v)

        return {
            "videos": videos,
            "total": total,
            "offset": offset,
            "limit": limit,
            "has_more": (offset + len(videos)) < total
        }

    def delete_playlist(self, playlist_id: str):
        with self._get_connection() as conn:
            conn.execute("DELETE FROM playlists WHERE playlist_id = ?", (playlist_id,))

    def get_total_playlists_count(self) -> int:
        with self._get_connection() as conn:
            cur = conn.execute("SELECT COUNT(*) FROM playlists")
            return cur.fetchone()[0]

    def sync_from_vector_store_if_empty(self, vector_store):
        """
        If the catalog DB is currently empty, migrate existing playlists from Qdrant.
        """
        try:
            total = self.get_total_playlists_count()
            if total > 0:
                return  # already populated

            logger.info("Catalog DB is empty. Running one-time migration from Vector Store...")
            playlists = vector_store.get_playlists()
            if not playlists:
                logger.info("No existing playlists found in Vector Store.")
                return

            for pl in playlists:
                pid = pl.get("playlist_id")
                if not pid:
                    continue
                videos = vector_store.get_playlist_videos(pid)
                self.upsert_playlist(
                    playlist_id=pid,
                    title=pl.get("playlist_title") or "Untitled Playlist",
                    channel_title=pl.get("channel_title") or "",
                    thumbnail_url=pl.get("thumbnail_url") or "",
                    video_count=len(videos),
                    chunk_count=pl.get("chunk_count", 0)
                )
                self.upsert_videos(pid, videos)

            logger.info(f"Successfully migrated {len(playlists)} playlists to Catalog DB.")
        except Exception as e:
            logger.warning(f"Could not auto-sync catalog from vector store: {e}")

catalog_db = CatalogDB()
