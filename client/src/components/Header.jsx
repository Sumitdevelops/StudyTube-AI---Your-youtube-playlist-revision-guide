'use client';

import Link from 'next/link';

export default function Header({
  vectorCount,
  isConnected,
  onRequestPlaylist,
  onOpenAvailablePlaylists,
  playlistCount = 0,
}) {
  return (
    <header className="site-header">
      {/* Logo & Brand */}
      <Link href="/" className="brand-group" style={{ textDecoration: 'none' }}>
        <div className="brand-icon">
          🎓
        </div>
        <div>
          <h1 className="brand-title">
            StudyTube AI
          </h1>
          <p className="brand-subtitle">
            Ask anything about your playlists
          </p>
        </div>
      </Link>

      {/* Actions & Status Indicators */}
      <div className="header-actions">
        {/* Available Playlists Button -> Direct Link to /playlists */}
        <Link
          href="/playlists"
          className="clay-button header-btn"
          title="Explore all available playlists and search courses"
          style={{ textDecoration: 'none' }}
        >
          <span style={{ fontSize: '1.05rem' }}>📚</span>
          <span className="btn-label-desktop">Available Playlists</span>
          <span className="btn-label-mobile">Courses</span>
          {playlistCount > 0 && (
            <span className="btn-counter">
              {playlistCount}
            </span>
          )}
        </Link>

        {/* Request Playlist Button */}
        <button
          onClick={onRequestPlaylist}
          className="clay-button header-btn request-btn"
        >
          <span style={{ fontSize: '1.05rem' }}>✨</span>
          <span className="btn-label-desktop">Request Playlist</span>
          <span className="btn-label-mobile">Request</span>
          <span className="btn-tag">
            FREE
          </span>
        </button>

        {/* Status Indicators */}
        <div className="status-indicators">
          <div className="clay-badge-success status-badge">
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#4ade80' : '#f87171',
                display: 'inline-block',
                boxShadow: isConnected
                  ? '0 0 8px rgba(74, 222, 128, 0.6)'
                  : '0 0 8px rgba(248, 113, 113, 0.6)',
              }}
            />
            <span>{isConnected ? 'Connected' : 'Offline'}</span>
          </div>

          {vectorCount > 0 && (
            <div className="clay-badge-info status-badge hide-xs">
              📦 {vectorCount.toLocaleString()} vectors
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .site-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--clay-shadow-lg);
          margin-bottom: 4px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--accent-primary);
          box-shadow: var(--clay-shadow-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .brand-title {
          font-size: 1.35rem;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .brand-subtitle {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .header-btn {
          font-size: 0.84rem;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: var(--clay-shadow-sm);
          cursor: pointer;
          border: 1.5px solid rgba(255, 255, 255, 0.6);
        }

        .request-btn {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: #ffffff;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }

        .btn-counter {
          background-color: var(--accent-primary);
          color: #fff;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 900;
        }

        .btn-tag {
          background-color: rgba(255, 255, 255, 0.22);
          padding: 2px 6px;
          border-radius: 999px;
          font-size: 0.68rem;
          font-weight: 900;
        }

        .status-indicators {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-badge {
          font-size: 0.74rem;
          padding: 5px 10px;
        }

        .btn-label-mobile {
          display: none;
        }

        @media (max-width: 640px) {
          .site-header {
            padding: 12px 14px;
            border-radius: var(--radius-lg);
          }

          .brand-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .brand-title {
            font-size: 1.15rem;
          }

          .brand-subtitle {
            font-size: 0.72rem;
          }

          .btn-label-desktop {
            display: none;
          }

          .btn-label-mobile {
            display: inline;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
            gap: 6px;
          }

          .header-btn {
            flex: 1;
            padding: 7px 10px;
            font-size: 0.78rem;
            justify-content: center;
          }

          .status-indicators {
            display: none;
          }
        }

        @media (max-width: 400px) {
          .hide-xs {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

