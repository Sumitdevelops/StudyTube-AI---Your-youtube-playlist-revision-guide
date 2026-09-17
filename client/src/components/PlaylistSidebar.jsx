import { useState } from 'react';
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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const handleVideoClick = (video) => {
    onSelectVideo(video);
    // Smooth scroll to player on mobile
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      const playerEl = document.getElementById('player-section');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (!videos || videos.length === 0) {
    return (
      <div
        className="clay-card-flat"
        style={{
          padding: '24px 20px',
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '40px' }}>📚</div>
        <p style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          No playlist loaded
        </p>
        <p style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Index a YouTube playlist to get started
        </p>
      </div>
    );
  }

  return (
    <div className="sidebar-wrapper clay-card-flat">
      {/* Playlist Selector Dropdown (when multiple playlists exist) */}
      {playlists && playlists.length > 1 && onSelectPlaylist && (
        <div className="playlist-selector-group">
          <label className="playlist-selector-label">
            📚 Switch Playlist ({playlists.length})
          </label>
          <select
            value={activePlaylistId || ''}
            onChange={(e) => onSelectPlaylist(e.target.value)}
            className="playlist-selector-dropdown"
          >
            {playlists.map((pl) => (
              <option key={pl.playlist_id} value={pl.playlist_id}>
                {pl.playlist_title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Playlist Title & Mobile Accordion Toggle */}
      <div className="sidebar-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="sidebar-title">
            🎬 {playlistTitle || 'Playlist'}
          </h2>
          <p className="sidebar-subtitle">
            {videos.length} lecture{videos.length !== 1 ? 's' : ''} indexed
          </p>
        </div>

        <button
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="clay-button sidebar-mobile-toggle"
          aria-expanded={isMobileExpanded}
        >
          {isMobileExpanded ? '▲ Hide' : `▼ Lectures (${videos.length})`}
        </button>
      </div>

      {/* Video List */}
      <div className={`video-list-container ${isMobileExpanded ? 'mobile-show' : 'mobile-hide'}`}>
        {videos.map((video, idx) => {
          const isActive = video.video_id === selectedVideoId;
          return (
            <button
              key={video.video_id}
              onClick={() => handleVideoClick(video)}
              className={`video-item-btn ${isActive ? 'clay-card-pressed active-video' : ''}`}
            >
              {/* Thumbnail */}
              <div className="video-thumb-box">
                <img
                  src={video.thumbnail_url || `https://i.ytimg.com/vi/${video.video_id}/default.jpg`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Video Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className={`video-item-title ${isActive ? 'active-text' : ''}`}>
                  {isActive ? `▶ ${video.title}` : video.title}
                </p>
                {video.duration > 0 && (
                  <p className={`video-item-duration ${isActive ? 'active-text' : ''}`}>
                    ⏱ {formatDuration(video.duration)}
                  </p>
                )}
              </div>

              {/* Position */}
              <span className={`video-item-idx ${isActive ? 'active-text' : ''}`}>
                #{idx + 1}
              </span>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .sidebar-wrapper {
          padding: 20px;
          max-height: calc(100vh - 220px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .playlist-selector-group {
          margin-bottom: 10px;
          padding: 0 2px;
        }

        .playlist-selector-label {
          font-size: 0.72rem;
          fontWeight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: 6px;
        }

        .playlist-selector-dropdown {
          width: 100%;
          padding: 9px 12px;
          font-size: 0.84rem;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          outline: none;
          background: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 0 4px;
          gap: 8px;
        }

        .sidebar-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sidebar-subtitle {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .sidebar-mobile-toggle {
          display: none;
          font-size: 0.78rem;
          padding: 6px 12px;
          font-weight: 800;
          color: var(--accent-primary);
          background: var(--accent-primary-surface);
          border: 1px solid var(--accent-primary);
          white-space: nowrap;
          cursor: pointer;
        }

        .video-list-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .video-item-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-family: 'Nunito', sans-serif;
          transition: all 0.25s ease;
          width: 100%;
        }

        .video-item-btn:hover {
          background: var(--bg-hover);
          box-shadow: var(--clay-shadow-sm);
        }

        .active-video {
          background: var(--accent-primary-surface) !important;
          box-shadow: var(--clay-shadow-pressed) !important;
        }

        .video-thumb-box {
          width: 64px;
          height: 36px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 2px 2px 4px rgba(166,152,138,0.25), inset 1px 1px 2px rgba(255,255,255,0.3);
        }

        .video-item-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }

        .video-item-duration {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .video-item-idx {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .active-text {
          color: var(--accent-primary) !important;
          font-weight: 800 !important;
        }

        @media (max-width: 1024px) {
          .sidebar-wrapper {
            max-height: none;
            padding: 16px;
          }

          .sidebar-mobile-toggle {
            display: inline-flex;
          }

          .video-list-container.mobile-hide {
            display: none;
          }

          .video-list-container.mobile-show {
            display: flex;
            max-height: 480px;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}
