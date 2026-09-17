import logging
import math
from typing import List, Dict, Any
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

logger = logging.getLogger("transcriber")

def get_transcript(video_id: str, retries: int = 2) -> List[Dict[str, Any]]:
    """
    Fetch timestamped transcript for a YouTube video using youtube-transcript-api.
    Tries default transcript first, falls back to any available language track.
    Returns: List[{ 'text': str, 'start': float, 'duration': float }]
    """
    for attempt in range(1, retries + 2):
        try:
            logger.info(f"Fetching captions for video: {video_id} (attempt {attempt})")

            raw_segments = None
            try:
                # Support new youtube-transcript-api API (>= 0.6.3 / 1.x)
                if not hasattr(YouTubeTranscriptApi, 'get_transcript'):
                    api = YouTubeTranscriptApi()
                    try:
                        # Try listing transcripts to get any available track (auto-generated or manual)
                        transcript_list = api.list(video_id)
                        for t in transcript_list:
                            raw_segments = t.fetch()
                            break
                    except Exception:
                        raw_segments = api.fetch(video_id)
                else:
                    # Legacy youtube-transcript-api API
                    try:
                        raw_segments = YouTubeTranscriptApi.get_transcript(video_id)
                    except Exception as e:
                        logger.info(f"Default transcript failed for {video_id} ({e}), trying transcript list...")
                        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                        for t in transcript_list:
                            raw_segments = t.fetch()
                            break
            except Exception as list_err:
                logger.warning(f"Failed to get transcript for {video_id}: {list_err}")
                raise list_err

            if not raw_segments:
                raise ValueError("No transcript segments returned")

            # Normalize timestamps to seconds
            normalized = []
            for seg in raw_segments:
                # Support both objects (new API) and dicts (old API)
                text = getattr(seg, "text", None) or (seg.get("text", "") if isinstance(seg, dict) else "")
                start = getattr(seg, "start", None) if not isinstance(seg, dict) else seg.get("start", 0.0)
                duration = getattr(seg, "duration", None) if not isinstance(seg, dict) else seg.get("duration", 0.0)

                if start is None:
                    start = 0.0
                if duration is None:
                    duration = 0.0

                # If timestamps are in milliseconds (> 1000 and fractional or excessive)
                if start > 1000 or duration > 1000:
                    start = math.floor(start / 1000)
                    duration = math.floor(duration / 1000)
                else:
                    start = math.floor(start)
                    duration = math.ceil(duration)

                normalized.append({
                    "text": str(text).replace("\n", " ").strip(),
                    "start": start,
                    "duration": duration
                })

            total_words = sum(len(s["text"].split()) for s in normalized)
            duration_mins = f"{normalized[-1]['start'] // 60}:{normalized[-1]['start'] % 60:02d}" if normalized else "0:00"
            logger.info(f"✅ Extracted {len(normalized)} segments ({total_words} words, ~{duration_mins}) for {video_id}")
            return normalized

        except (TranscriptsDisabled, NoTranscriptFound) as e:
            logger.warning(f"Captions not available for video {video_id}: {e}. Attempting Groq Whisper fallback...")
            try:
                from app.services.whisper_service import transcribe_with_whisper
                whisper_segments = transcribe_with_whisper(video_id)
                if whisper_segments:
                    return whisper_segments
            except Exception as whisper_err:
                logger.warning(f"Whisper fallback failed for {video_id}: {whisper_err}")
            raise e
        except Exception as e:
            if attempt > retries:
                logger.error(f"Failed to fetch captions for {video_id} after {attempt} attempts: {e}. Attempting Groq Whisper fallback...")
                try:
                    from app.services.whisper_service import transcribe_with_whisper
                    whisper_segments = transcribe_with_whisper(video_id)
                    if whisper_segments:
                        return whisper_segments
                except Exception as whisper_err:
                    logger.warning(f"Whisper fallback failed for {video_id}: {whisper_err}")
                raise e
            logger.info(f"Retrying caption fetch for {video_id}...")

    return []
