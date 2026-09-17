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
                # 1. Primary: fetch default transcript
                raw_segments = YouTubeTranscriptApi.get_transcript(video_id)
            except Exception as e:
                logger.info(f"Default transcript failed for {video_id} ({e}), trying transcript list...")
                # 2. Fallback: inspect all available transcripts
                try:
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    # Try finding any transcript (manual or auto-generated)
                    transcript = None
                    for t in transcript_list:
                        transcript = t
                        break

                    if transcript:
                        raw_segments = transcript.fetch()
                    else:
                        raise e
                except Exception as list_err:
                    logger.warning(f"Failed to list transcripts for {video_id}: {list_err}")
                    raise list_err

            if not raw_segments:
                raise ValueError("No transcript segments returned")

            # Normalize timestamps to seconds
            normalized = []
            for seg in raw_segments:
                start = seg.get("start", 0.0)
                duration = seg.get("duration", 0.0)

                # If timestamps are in milliseconds (> 1000 and fractional or excessive)
                if start > 1000 or duration > 1000:
                    start = math.floor(start / 1000)
                    duration = math.floor(duration / 1000)
                else:
                    start = math.floor(start)
                    duration = math.ceil(duration)

                normalized.append({
                    "text": seg.get("text", "").replace("\n", " ").strip(),
                    "start": start,
                    "duration": duration
                })

            total_words = sum(len(s["text"].split()) for s in normalized)
            duration_mins = f"{normalized[-1]['start'] // 60}:{normalized[-1]['start'] % 60:02d}" if normalized else "0:00"
            logger.info(f"✅ Extracted {len(normalized)} segments ({total_words} words, ~{duration_mins}) for {video_id}")
            return normalized

        except (TranscriptsDisabled, NoTranscriptFound) as e:
            logger.warning(f"Captions not available for video {video_id}: {e}")
            raise e
        except Exception as e:
            if attempt > retries:
                logger.error(f"Failed to fetch captions for {video_id} after {attempt} attempts: {e}")
                raise e
            logger.info(f"Retrying caption fetch for {video_id}...")

    return []
