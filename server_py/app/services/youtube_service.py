import re
import urllib.parse
from typing import Dict, Any, List
import requests
from app.config import settings

def parse_playlist_id(input_str: str) -> str:
    """Extract playlist ID from URL or raw ID string."""
    if not input_str:
        raise ValueError("Playlist URL or ID is required")
    trimmed = input_str.strip()

    try:
        parsed = urllib.parse.urlparse(trimmed)
        query = urllib.parse.parse_qs(parsed.query)
        if "list" in query and query["list"]:
            return query["list"][0]
    except Exception:
        pass

    if re.match(r"^[A-Za-z0-9_-]{10,}$", trimmed):
        return trimmed

    raise ValueError(f"Could not parse playlist ID from: {input_str}")

def parse_duration(iso_duration: str) -> int:
    """Parse ISO 8601 duration (e.g. PT1H2M10S, PT15M33S) into total seconds."""
    if not iso_duration:
        return 0
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso_duration)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds

def fetch_playlist_videos(playlist_id: str) -> Dict[str, Any]:
    """Fetch playlist metadata and all videos using YouTube Data API v3."""
    base_url = "https://www.googleapis.com/youtube/v3"
    key = settings.YOUTUBE_API_KEY

    if not key:
        raise ValueError("YOUTUBE_API_KEY is not configured in .env")

    # 1. Fetch playlist title
    pl_res = requests.get(f"{base_url}/playlists", params={
        "part": "snippet",
        "id": playlist_id,
        "key": key
    }, timeout=15)
    pl_data = pl_res.json()
    items = pl_data.get("items", [])
    playlist_title = items[0]["snippet"]["title"] if items else "Unknown Playlist"

    # 2. Paginate through playlistItems
    videos: List[Dict[str, Any]] = []
    page_token = ""

    while True:
        params = {
            "part": "snippet,contentDetails",
            "playlistId": playlist_id,
            "maxResults": 50,
            "key": key
        }
        if page_token:
            params["pageToken"] = page_token

        res = requests.get(f"{base_url}/playlistItems", params=params, timeout=15)
        data = res.json()

        if "error" in data:
            raise ValueError(f"YouTube API error: {data['error'].get('message', 'Unknown error')}")

        for item in data.get("items", []):
            content_details = item.get("contentDetails", {})
            snippet = item.get("snippet", {})
            video_id = content_details.get("videoId") or snippet.get("resourceId", {}).get("videoId")
            if not video_id:
                continue

            thumbs = snippet.get("thumbnails", {})
            thumb_url = thumbs.get("high", {}).get("url") or thumbs.get("default", {}).get("url") or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

            videos.append({
                "video_id": video_id,
                "title": snippet.get("title", "Untitled"),
                "thumbnail_url": thumb_url,
                "position": snippet.get("position", len(videos)),
                "duration": 0
            })

        page_token = data.get("nextPageToken", "")
        if not page_token:
            break

    # 3. Batch fetch durations
    if videos:
        batch_size = 50
        for i in range(0, len(videos), batch_size):
            batch = videos[i:i + batch_size]
            ids = ",".join(v["video_id"] for v in batch)
            d_res = requests.get(f"{base_url}/videos", params={
                "part": "contentDetails",
                "id": ids,
                "key": key
            }, timeout=15)
            d_data = d_res.json()
            durations = {item["id"]: parse_duration(item.get("contentDetails", {}).get("duration", "")) for item in d_data.get("items", [])}
            for v in batch:
                if v["video_id"] in durations:
                    v["duration"] = durations[v["video_id"]]

    return {
        "playlist_id": playlist_id,
        "title": playlist_title,
        "thumbnail_url": videos[0]["thumbnail_url"] if videos else "",
        "videos": videos
    }
