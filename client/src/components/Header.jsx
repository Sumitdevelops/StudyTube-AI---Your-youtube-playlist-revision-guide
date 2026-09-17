'use client';

export default function Header({ vectorCount, isConnected, onRequestPlaylist }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onRequestPlaylist}
          className="clay-button clay-button-primary"
          style={{
            fontSize: '0.84rem',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
          }}
        >
          ✨ Request Playlist
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

