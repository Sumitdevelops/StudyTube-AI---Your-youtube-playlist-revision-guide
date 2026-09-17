const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Fetch wrapper with error handling.
 */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data.detail || data.error || (typeof data === 'string' ? data : `API error: ${res.status}`);
    throw new Error(msg);
  }
  return data;
}

/** GET /api/health */
export async function getHealth() {
  return apiFetch('/health');
}

/** GET /api/playlists */
export async function getPlaylists() {
  return apiFetch('/playlists');
}

/** GET /api/playlist/:id */
export async function getPlaylist(playlistId) {
  return apiFetch(`/playlist/${playlistId}`);
}

/**
 * POST /api/transcribe-playlist
 * Ingest a YouTube playlist.
 */
export async function transcribePlaylist(playlistUrl) {
  return apiFetch('/transcribe-playlist', {
    method: 'POST',
    body: JSON.stringify({ url: playlistUrl }),
  });
}

/**
 * POST /api/search
 * Semantic search with Groq RAG.
 */
export async function searchPlaylist(query, playlistId, topK = 5) {
  return apiFetch('/search', {
    method: 'POST',
    body: JSON.stringify({ query, playlistId, topK }),
  });
}
