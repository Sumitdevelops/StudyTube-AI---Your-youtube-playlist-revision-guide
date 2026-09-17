'use client';

export default function Header({
  vectorCount,
  isConnected,
  onRequestPlaylist,
  onOpenAvailablePlaylists,
  playlistCount = 0,
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 28px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--clay-shadow-lg)',
        marginBottom: '4px',
      }}
    >
      {/* Logo & Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            boxShadow: 'var(--clay-shadow-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
          }}
        >
          🎓
        </div>
        <div>
          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}
          >
            StudyTube AI
          </h1>
          <p
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginTop: '2px',
            }}
          >
            Ask anything about your playlists
          </p>
        </div>
      </div>

      {/* Actions & Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Available Playlists Button */}
        <button
          onClick={onOpenAvailablePlaylists}
          className="clay-button"
          style={{
            fontSize: '0.86rem',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 800,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--clay-shadow-sm)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '1.5px solid rgba(255, 255, 255, 0.6)',
          }}
          title="View all available playlists and search courses"
        >
          <span style={{ fontSize: '1.05rem' }}>📚</span>
          <span>Available Playlists</span>
          {playlistCount > 0 && (
            <span
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 900,
              }}
            >
              {playlistCount}
            </span>
          )}
        </button>

        {/* Request Playlist Button */}
        <button
          onClick={onRequestPlaylist}
          className="clay-button"
          style={{
            fontSize: '0.86rem',
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '1.05rem', animation: 'spin-slow 8s linear infinite' }}>✨</span>
          <span>Request a Playlist</span>
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.22)',
              padding: '2px 7px',
              borderRadius: '999px',
              fontSize: '0.7rem',
              letterSpacing: '0.5px',
              fontWeight: 900,
            }}
          >
            FREE
          </span>
        </button>


        <div className="clay-badge-success">
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
          {isConnected ? 'API Connected' : 'API Offline'}
        </div>
        {vectorCount > 0 && (
          <div className="clay-badge-info">
            📦 {vectorCount.toLocaleString()} vectors
          </div>
        )}
      </div>
    </header>
  );
}

