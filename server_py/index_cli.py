import os
import sys
import argparse
import logging
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Set up logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("indexer")

# Ensure server_py is in python path
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from app.config import settings
from app.db.vector_store import vector_store
from app.services.youtube_service import parse_playlist_id, fetch_playlist_videos
from app.services.transcriber import get_transcript
from app.services.chunker import chunk_transcript
from app.services.embedder import embed_batch

def index_playlist(url_or_id: str, max_videos: int = 0):
    print("=" * 65, flush=True)
    print("🚀 StudyTube AI — Local Playlist Indexer (Cloud Sync)", flush=True)
    print(f"📦 Target Database: Qdrant Cloud ({settings.QDRANT_URL})", flush=True)
    print("=" * 65, flush=True)

    try:
        playlist_id = parse_playlist_id(url_or_id)
    except Exception as e:
        logger.error(f"Invalid URL or Playlist ID: {e}")
        return

    logger.info(f"Fetching playlist metadata for: {playlist_id}")
    try:
        playlist = fetch_playlist_videos(playlist_id)
    except Exception as e:
        logger.error(f"Failed to fetch playlist info from YouTube API: {e}")
        return

    videos = playlist.get("videos", [])
    if not videos:
        logger.error("No videos found in this playlist.")
        return

    total_available = len(videos)
    if max_videos > 0 and max_videos < total_available:
        videos = videos[:max_videos]
        logger.info(f"Indexing first {max_videos} of {total_available} videos in '{playlist['title']}'")
    else:
        logger.info(f"Found {total_available} videos in '{playlist['title']}'")

    total_chunks_indexed = 0
    successful_videos = 0

    for i, video in enumerate(videos, start=1):
        vid = video["video_id"]
        title = video["title"]
        print(f"\n[{i}/{len(videos)}] 🎬 {title} ({vid})")

        # 1. Fetch transcript or Whisper fallback
        segments = []
        try:
            segments = get_transcript(vid, retries=1)
        except Exception as e:
            logger.warning(f"   ⚠️ Could not extract captions or audio: {e}")

        if not segments:
            logger.warning(f"   ⏩ Skipping video (no text available)")
            continue

        # 2. Chunk transcript
        chunks = chunk_transcript(segments, {
            "video_id": vid,
            "title": title,
            "thumbnail_url": video.get("thumbnail_url", ""),
            "duration": video.get("duration", 0),
            "playlist_id": playlist["playlist_id"],
            "playlist_title": playlist["title"],
            "channel_title": playlist.get("channel_title", "")
        })

        if not chunks:
            logger.warning(f"   ⏩ No chunks produced for {vid}")
            continue

        # 3. Generate embeddings
        texts = [c["chunk_text"] for c in chunks]
        logger.info(f"   🧠 Generating {len(chunks)} embeddings...")
        embeddings = embed_batch(texts)

        # 4. Prepare vector records
        records = [
            {
                "id": chunk["id"],
                "values": embeddings[idx],
                "metadata": chunk["metadata"]
            }
            for idx, chunk in enumerate(chunks)
        ]

        # 5. Save into Qdrant Cloud
        logger.info(f"   💾 Uploading {len(records)} vectors to Qdrant Cloud...")
        vector_store.upsert(records)

        total_chunks_indexed += len(chunks)
        successful_videos += 1
        logger.info(f"   ✅ Indexed successfully! ({len(chunks)} chunks)")

    print("\n" + "=" * 65)
    print(f"🎉 INDEXING COMPLETE!")
    print(f"📚 Playlist: {playlist['title']}")
    print(f"📺 Channel:  {playlist.get('channel_title', 'Unknown')}")
    print(f"📹 Videos Indexed: {successful_videos}/{len(videos)}")
    print(f"📦 Total New Chunks in Qdrant: {total_chunks_indexed}")
    print(f"🌐 Database Vector Count: {vector_store.get_count()} vectors")
    print("=" * 65)
    print("👉 Now refresh your live Vercel app to see the new playlist!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index YouTube playlists into Qdrant Cloud from your local machine.")
    parser.add_argument("url", help="YouTube Playlist URL or Playlist ID")
    parser.add_argument("--max", type=int, default=0, help="Optional: max number of videos to index (e.g. --max 10)")
    args = parser.parse_args()

    index_playlist(args.url, max_videos=args.max)
