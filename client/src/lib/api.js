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

/**
 * Background browser heartbeat: pings /api/health every 8 minutes
 * while the tab is open to prevent Render's 15-minute idle sleep.
 */
let _heartbeatStarted = false;
export function initKeepAliveHeartbeat() {
  if (typeof window === 'undefined' || _heartbeatStarted) return;
  _heartbeatStarted = true;
  const HEARTBEAT_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes
  setInterval(() => {
    fetch(`${API_BASE}/health`, { method: 'GET', keepalive: true }).catch(() => {});
  }, HEARTBEAT_INTERVAL_MS);
}

/** GET /api/playlists with optional search, page, and limit */
export async function getPlaylists(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/playlists${qs}`);
}

/** GET /api/playlist/:id with optional offset and limit for progressive loading */
export async function getPlaylist(playlistId, params = {}) {
  const query = new URLSearchParams();
  if (params.offset !== undefined) query.set('offset', params.offset);
  if (params.limit !== undefined) query.set('limit', params.limit);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/playlist/${playlistId}${qs}`);
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
 * POST /api/request-playlist
 * Request a new playlist to be indexed by the admin.
 */
export async function requestPlaylist(data) {
  return apiFetch('/request-playlist', {
    method: 'POST',
    body: JSON.stringify(data),
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

/**
 * POST /api/search/stream
 * Semantic search with Groq RAG streaming word-by-word via SSE.
 * 
 * @param {string} query - Search question
 * @param {string} playlistId - ID of active playlist
 * @param {number} topK - Top K results
 * @param {Function} onToken - Callback for streaming token
 * @param {Function} onSources - Callback for sources array
 */
export async function searchPlaylistStream(query, playlistId, topK = 5, onToken, onSources) {
  const url = `${API_BASE}/search/stream`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, playlistId, topK }),
  });

  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail || err.error || msg;
    } catch {
      // not JSON
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const jsonStr = trimmed.slice(6);
      try {
        const data = JSON.parse(jsonStr);
        if (data.type === 'sources' && onSources) {
          onSources(data.sources || []);
        } else if (data.type === 'token' && onToken) {
          onToken(data.text || '');
        } else if (data.type === 'error') {
          throw new Error(data.message || 'Stream error');
        }
      } catch (e) {
        if (e.message && e.message.includes('Stream error')) throw e;
        console.error('Error parsing SSE event:', e);
      }
    }
  }
}

