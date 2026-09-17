'use client';

import { formatDuration } from '@/lib/formatters';

export default function PlaylistSidebar({
  videos,
  selectedVideoId,
  onSelectVideo,
  playlistTitle,
  playlists = [],
  activePlaylistId = '',
  onSelectPlaylist
}) {
  if (!videos || videos.length === 0) {
    return (
      <div
        className="clay-card-flat"
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
        }}
      >
        <div style={{ fontSize: '48px' }}>📚</div>
        <p style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          No playlist loaded
        </p>
        <p style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Index a YouTube playlist to get started
        </p>
      </div>
    );
  }

  return (
    <div
      className="clay-card-flat"
      style={{
        padding: '20px',
        maxHeight: 'calc(100vh - 220px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Playlist Selector Dropdown (when multiple playlists exist) */}
      {playlists && playlists.length > 1 && onSelectPlaylist && (
        <div style={{ marginBottom: '10px', padding: '0 2px' }}>
          <label
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            📚 Switch Playlist ({playlists.length})
          </label>
          <select
            value={activePlaylistId || ''}
            onChange={(e) => onSelectPlaylist(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: '12px',
              cursor: 'pointer',
              outline: 'none',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {playlists.map((pl) => (
              <option key={pl.playlist_id} value={pl.playlist_id}>
                {pl.playlist_title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Playlist Title */}
      <div style={{ marginBottom: '8px', padding: '0 4px' }}>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🎬 {playlistTitle || 'Playlist'}
        </h2>
        <p
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}
        >
          {videos.length} video{videos.length !== 1 ? 's' : ''} indexed
        </p>
      </div>

      {/* Video List */}
      {videos.map((video, idx) => {
        const isActive = video.video_id === selectedVideoId;
        return (
          <button
            key={video.video_id}
            onClick={() => onSelectVideo(video)}
            className={isActive ? 'clay-card-pressed' : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isActive ? 'var(--accent-primary-surface)' : 'transparent',
              boxShadow: isActive ? 'var(--clay-shadow-pressed)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'Nunito', sans-serif",
              transition: 'all 0.25s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.boxShadow = 'var(--clay-shadow-sm)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: '64px',
                height: '36px',
                borderRadius: '10px',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '2px 2px 4px rgba(166,152,138,0.25), inset 1px 1px 2px rgba(255,255,255,0.3)',
              }}
            >
              <img
                src={video.thumbnail_url || `https://i.ytimg.com/vi/${video.video_id}/default.jpg`}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Video Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                }}
              >
                {isActive ? `▶ ${video.title}` : video.title}
              </p>
              {video.duration > 0 && (
                <p
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    marginTop: '2px',
                    opacity: isActive ? 0.9 : 1,
                  }}
                >
                  ⏱ {formatDuration(video.duration)}
                </p>
              )}
            </div>

            {/* Position */}
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              #{idx + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
