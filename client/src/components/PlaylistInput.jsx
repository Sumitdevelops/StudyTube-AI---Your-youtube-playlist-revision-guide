'use client';

import { useState } from 'react';

export default function PlaylistInput({ onIngest, isLoading, onRequestClick }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) {
      setError('Please enter a YouTube playlist URL');
      return;
    }
    onIngest(url.trim());
  };

  const samplePlaylists = [
    { label: '🟡 JavaScript Crash Course', id: 'PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP' },
    { label: '🔵 Python for Beginners', id: 'PLsyeobzWxl7poL9JTVyndKe62ieoN-MZ3' },
    { label: '🟣 CS50 Harvard 2024', id: 'PLhQjrBD2T381WAHyx1pq-sBfykqMBI7V4' },
  ];

  return (
    <div
      className="clay-card-flat animate-pop-in"
      style={{ padding: '28px', marginBottom: '24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: 0,
          }}
        >
          <span
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-secondary)',
              boxShadow:
                '3px 3px 6px rgba(200, 140, 120, 0.3), -2px -2px 4px rgba(255,255,255,0.6), inset 1px 1px 2px rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            📺
          </span>
          Add YouTube Playlist
        </h2>

        {onRequestClick && (
          <button
            type="button"
            onClick={onRequestClick}
            className="clay-badge"
            style={{
              cursor: 'pointer',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.8rem',
              padding: '6px 14px',
              color: 'var(--accent-primary)',
              fontWeight: 800,
              background: 'var(--accent-primary-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ✨ Can&apos;t find your subject? Request it!
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>

        <input
          className="clay-input"
          type="text"
          placeholder="Paste YouTube playlist URL or ID..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          className="clay-button clay-button-primary"
          disabled={isLoading}
          style={{
            minWidth: '140px',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              Indexing...
            </>
          ) : (
            <>🚀 Index Playlist</>
          )}
        </button>
      </form>

      {error && (
        <p
          style={{
            marginTop: '12px',
            color: '#e74c3c',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}

      {/* Sample playlists */}
      <div style={{ marginTop: '18px' }}>
        <p
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Or try a sample
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {samplePlaylists.map((sample) => (
            <button
              key={sample.id}
              className="clay-button"
              onClick={() => {
                setUrl(`https://www.youtube.com/playlist?list=${sample.id}`);
              }}
              disabled={isLoading}
              style={{ fontSize: '0.82rem', padding: '8px 16px' }}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
