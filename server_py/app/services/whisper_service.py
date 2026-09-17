import os
import glob
import math
import tempfile
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger("whisper_service")

def transcribe_with_whisper(video_id: str) -> List[Dict[str, Any]]:
    """
    Fallback transcription using yt-dlp audio download + Groq Whisper API (whisper-large-v3).
    Returns timestamped segments: List[{ 'text': str, 'start': int, 'duration': int }]
    """
    if not settings.GROQ_API_KEY:
        logger.warning("Cannot run Whisper fallback: GROQ_API_KEY is not configured.")
        return []

    try:
        import yt_dlp
        from groq import Groq
    except ImportError as e:
        logger.warning(f"Whisper fallback dependency missing: {e}")
        return []

    temp_dir = tempfile.gettempdir()
    file_prefix = f"yt_audio_{video_id}"
    outtmpl = os.path.join(temp_dir, f"{file_prefix}.%(ext)s")
    video_url = f"https://www.youtube.com/watch?v={video_id}"

    ydl_opts = {
        "format": "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio",
        "outtmpl": outtmpl,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "max_filesize": 25 * 1024 * 1024,  # Groq 25MB file limit
    }

    downloaded_files = []
    try:
        logger.info(f"🎙️ Downloading audio stream for captionless video: {video_id}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])

        # Find the downloaded file
        downloaded_files = glob.glob(os.path.join(temp_dir, f"{file_prefix}.*"))
        if not downloaded_files:
            logger.warning(f"No audio file was saved for video {video_id}")
            return []

        audio_path = downloaded_files[0]
        file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        logger.info(f"Audio downloaded: {audio_path} ({file_size_mb:.2f} MB). Transcribing via Groq Whisper...")

        client = Groq(api_key=settings.GROQ_API_KEY)
        with open(audio_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                file=(os.path.basename(audio_path), f.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
                temperature=0.0
            )

        # Parse segments
        segments = []
        raw_segments = getattr(transcription, "segments", []) or []
        for seg in raw_segments:
            text = seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", "")
            start = seg.get("start", 0.0) if isinstance(seg, dict) else getattr(seg, "start", 0.0)
            end = seg.get("end", 0.0) if isinstance(seg, dict) else getattr(seg, "end", 0.0)

            clean_text = str(text).replace("\n", " ").strip()
            if not clean_text:
                continue

            duration = max(1, math.ceil(end - start))
            segments.append({
                "text": clean_text,
                "start": math.floor(start),
                "duration": duration
            })

        logger.info(f"✅ Groq Whisper transcribed {len(segments)} segments for video {video_id}")
        return segments

    except Exception as e:
        logger.warning(f"Whisper fallback failed for video {video_id}: {e}")
        return []

    finally:
        # Clean up temporary audio files
        for fpath in downloaded_files:
            try:
                if os.path.exists(fpath):
                    os.remove(fpath)
            except Exception:
                pass
