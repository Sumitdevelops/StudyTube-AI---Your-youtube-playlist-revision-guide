'use client';

import Link from 'next/link';

export default function Header({
  vectorCount,
  isConnected,
  onRequestPlaylist,
  playlistCount = 0,
  activePlaylistTitle = '',
  theme = 'light',
  onToggleTheme,
}) {
  return (
    <header className="site-header stitch-card">
      {/* Brand Group */}
      <div className="header-left">
        <Link href="/" className="brand-group" style={{ textDecoration: 'none' }}>
          <div className="brand-icon">
            🎓
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="brand-title">StudyTube AI</h1>
              <span className="live-status-pill">
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isConnected ? '#10b981' : '#ef4444',
                    display: 'inline-block',
                    boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
                  }}
                />
                {isConnected ? 'Ready' : 'Offline'}
              </span>
            </div>
            <p className="brand-subtitle">
              {activePlaylistTitle ? activePlaylistTitle : 'AI-Powered Playlist Revision Guide'}
            </p>
          </div>
        </Link>
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Explore All Playlists */}
        <Link
          href="/playlists"
          className="clay-button header-action-btn"
          title="Explore all available courses"
          style={{ textDecoration: 'none' }}
        >
          <span>📚</span>
          <span className="btn-text-full">Explore Courses</span>
          <span className="btn-text-short">Courses</span>
          {playlistCount > 0 && (
            <span className="counter-pill">{playlistCount}</span>
          )}
        </Link>

        {/* Request Playlist Action */}
        <button
          onClick={onRequestPlaylist}
          className="clay-button header-action-btn request-btn"
          title="Request any YouTube playlist to be transcribed & indexed"
        >
          <span>✨</span>
          <span className="btn-text-full">Request Playlist</span>
          <span className="btn-text-short">Request</span>
          <span className="free-badge">FREE</span>
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="clay-button theme-toggle-btn"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Vector DB count tag (Desktop) */}
        {vectorCount > 0 && (
          <div className="clay-badge-info hide-on-mobile" style={{ fontSize: '0.74rem' }}>
            ⚡ {vectorCount.toLocaleString()} vectors
          </div>
        )}
      </div>

      <style jsx>{`
        .site-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-radius: var(--radius-lg);
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          box-shadow: var(--clay-shadow-accent);
          flex-shrink: 0;
        }

        .brand-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          background: var(--accent-success-surface);
          border: 1px solid var(--accent-success-border);
          border-radius: var(--radius-full);
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--accent-success);
        }

        .brand-subtitle {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 2px;
          max-width: 320px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-action-btn {
          font-size: 0.82rem;
          padding: 8px 14px;
          font-weight: 700;
        }

        .request-btn {
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%) !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        }

        .counter-pill {
          background: var(--accent-primary-surface);
          color: var(--accent-primary);
          padding: 1px 7px;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .free-badge {
          background: rgba(255, 255, 255, 0.25);
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 9999px;
          font-size: 0.65rem;
          font-weight: 800;
        }

        .theme-toggle-btn {
          width: 38px;
          height: 38px;
          padding: 0;
          border-radius: 50%;
          font-size: 1.05rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-text-short {
          display: none;
        }

        @media (max-width: 768px) {
          .site-header {
            padding: 10px 14px;
          }

          .brand-icon {
            width: 38px;
            height: 38px;
            font-size: 19px;
          }

          .brand-title {
            font-size: 1.1rem;
          }

          .brand-subtitle {
            max-width: 180px;
          }

          .btn-text-full {
            display: none;
          }

          .btn-text-short {
            display: inline;
          }

          .hide-on-mobile {
            display: none;
          }

          .header-action-btn {
            padding: 7px 10px;
            font-size: 0.78rem;
          }
        }
      `}</style>
    </header>
  );
}
