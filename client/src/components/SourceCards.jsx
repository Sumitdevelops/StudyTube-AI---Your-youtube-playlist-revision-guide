'use client';

import { formatTime } from '@/lib/formatters';

/**
 * SourceCards - Clickable timestamp citation cards.
 * Each card shows an English transcript excerpt and auto-seeks the video player on click.
 */
export default function SourceCards({ sources, activeSourceIdx, onSourceClick }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <h3
        style={{
          fontSize: '0.95rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '10px',
            background: 'var(--accent-success-surface)',
            boxShadow:
              '3px 3px 6px rgba(100,170,130,0.2), -2px -2px 4px rgba(255,255,255,0.6), inset 1px 1px 2px rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          📌
        </span>
        Sources & Video Citations ({sources.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sources.map((source, idx) => {
          const isActive = idx === activeSourceIdx;

          return (
            <button
              key={idx}
              onClick={() => onSourceClick(source, idx)}
              className={isActive ? 'clay-card-pressed' : 'clay-card'}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px 18px',
                border: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Nunito', sans-serif",
                width: '100%',
                background: isActive ? 'var(--accent-primary-surface)' : 'var(--bg-card)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Timestamp Play Button Badge */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--accent-primary)' : 'var(--accent-warning)',
                    boxShadow: isActive
                      ? 'var(--clay-shadow-accent)'
                      : '3px 3px 6px rgba(200,170,120,0.3), -2px -2px 4px rgba(255,255,255,0.6), inset 1px 1px 2px rgba(255,255,255,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <span style={{ fontSize: '18px', transform: 'translateX(1px)' }}>▶</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      marginTop: '1px',
                    }}
                  >
                    {source.formatted_time || formatTime(source.timestamp)}
                  </span>
                </div>

                {/* Similarity score */}
                {source.similarity != null && (
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      opacity: 0.8,
                    }}
                  >
                    {Math.round(source.similarity * 100)}% match
                  </span>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {source.title}
                  </p>
                  {isActive && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: 'var(--accent-primary)',
                        background: 'rgba(138, 120, 245, 0.15)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        flexShrink: 0,
                      }}
                    >
                      Now Playing
                    </span>
                  )}
                </div>

                {/* English Translated / Summarized Excerpt */}
                <p
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '8px',
                  }}
                >
                  "{source.chunk_preview}"
                </p>

                {/* Jump to play action */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                  }}
                >
                  ▶ Jump to {source.formatted_time || formatTime(source.timestamp)} and play
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
