'use client';

import { useState, useMemo } from 'react';

export default function AvailablePlaylistsModal({
  isOpen,
  onClose,
  playlists = [],
  activePlaylistId,
  onSelectPlaylist,
  onRequestPlaylist,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter playlists based on search query
  const filteredPlaylists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter((p) =>
      (p.playlist_title || '').toLowerCase().includes(q)
    );
  }, [playlists, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (playlistId) => {
    onSelectPlaylist(playlistId);
    onClose();
  };

  const handleRequestCourse = (subjectName) => {
    onClose();
    if (onRequestPlaylist) {
      onRequestPlaylist(subjectName);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(30, 20, 40, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="clay-card animate-pop-in"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 32px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--clay-shadow-lg)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            lineHeight: 1,
            zIndex: 10,
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              boxShadow: 'var(--clay-shadow-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            📚
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              Available Courses &amp; Playlists
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Explore indexed courses, search by topic, or request a new course!
            </p>
          </div>
        </div>

        {/* Course Search Box */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input
            className="clay-input"
            type="text"
            placeholder="Search available courses (e.g. TOC, AI, Python, Operating Systems)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '44px',
              paddingRight: searchQuery ? '40px' : '16px',
              fontSize: '0.95rem',
              width: '100%',
            }}
            autoFocus
          />
          <span
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.1rem',
              opacity: 0.6,
            }}
          >
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results Counter / Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            {filteredPlaylists.length} {filteredPlaylists.length === 1 ? 'course' : 'courses'} available
          </span>
          <button
            onClick={() => handleRequestCourse(searchQuery)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.8rem',
              textDecoration: 'underline',
            }}
          >
            Can&apos;t find your course? Request it ✨
          </button>
        </div>

        {/* Playlists Cards Grid (Scrollable) */}
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            paddingRight: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {filteredPlaylists.length > 0 ? (
            filteredPlaylists.map((playlist) => {
              const isActive = playlist.playlist_id === activePlaylistId;
              const shortTitle = (playlist.playlist_title || '')
                .split('|')[0]
                .split('-')[0]
                .trim();

              return (
                <div
                  key={playlist.playlist_id}
                  className="clay-card-flat animate-fade-in"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    background: isActive ? 'var(--accent-primary-surface)' : 'var(--bg-input)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--clay-shadow-sm)',
                    border: isActive ? '2px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Playlist Thumbnail */}
                  <div
                    style={{
                      width: '100px',
                      height: '62px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: '#dcd4cc',
                      boxShadow: 'var(--clay-shadow-sm)',
                      position: 'relative',
                    }}
                  >
                    {playlist.thumbnail_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={playlist.thumbnail_url}
                        alt={playlist.playlist_title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                        }}
                      >
                        🎓
                      </div>
                    )}
                  </div>

                  {/* Course Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3
                        style={{
                          fontSize: '0.98rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: 0,
                        }}
                      >
                        {shortTitle}
                      </h3>
                      {isActive && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 900,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'var(--accent-primary)',
                            color: '#fff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={playlist.playlist_title}
                    >
                      {playlist.playlist_title}
                    </p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {playlist.video_count > 0 && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            background: 'rgba(255,255,255,0.7)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          🎬 {playlist.video_count} Lectures
                        </span>
                      )}
                      {playlist.chunk_count > 0 && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            background: 'rgba(255,255,255,0.7)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          ⚡ {playlist.chunk_count} Knowledge Chunks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Select / Action Button */}
                  <div style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => handleSelect(playlist.playlist_id)}
                      className="clay-button"
                      style={{
                        padding: '9px 18px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        background: isActive ? 'var(--accent-primary)' : 'var(--bg-card)',
                        color: isActive ? '#fff' : 'var(--text-primary)',
                        boxShadow: 'var(--clay-shadow-sm)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isActive ? '✓ Selected' : '🚀 Start Revising'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            /* Empty State when searched course is not found */
            <div
              className="clay-card-flat animate-pop-in"
              style={{
                textAlign: 'center',
                padding: '36px 24px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                border: '1.5px dashed rgba(99, 102, 241, 0.35)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary-surface)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: '14px',
                  boxShadow: 'var(--clay-shadow-sm)',
                }}
              >
                🔍
              </div>
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                No course found for &ldquo;{searchQuery}&rdquo;
              </h3>
              <p
                style={{
                  fontSize: '0.86rem',
                  color: 'var(--text-secondary)',
                  maxWidth: '460px',
                  margin: '0 auto 20px',
                  lineHeight: 1.5,
                }}
              >
                This playlist has not been indexed into StudyTube AI yet. You can request the admin to index it, and we will notify you on Telegram once it is live!
              </p>

              <button
                onClick={() => handleRequestCourse(searchQuery)}
                className="clay-button"
                style={{
                  padding: '11px 24px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ✨ Request &ldquo;{searchQuery}&rdquo; Playlist
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
