import os
from pathlib import Path
from dotenv import load_dotenv

# Find .env in project root (parent of server_py or current dir)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "5000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    ENV: str = os.getenv("NODE_ENV", "development")

    # Groq API
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

    # YouTube API
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")

    # Vector DB
    VECTOR_DB_MODE: str = os.getenv("VECTOR_DB_MODE", "qdrant").lower()
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    COLLECTION_NAME: str = "youtube_chunks"
    CATALOG_DB_PATH: str = os.getenv("CATALOG_DB_PATH", str(Path(__file__).resolve().parent.parent / "data" / "catalog.db"))

    # Embeddings
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    # Telegram Bot Notifications
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")

settings = Settings()

