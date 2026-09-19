'use client';

import { formatTime } from '@/lib/formatters';

export default function SourceCards({ sources, activeSourceIdx, onSourceClick }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="source-cards-wrapper animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <h3 className="source-section-title">
        <span className="source-icon-badge">📌</span>
        Video Citations &amp; Excerpts ({sources.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sources.map((source, idx) => {
          const isActive = idx === activeSourceIdx;

          return (
            <button
              key={idx}
              onClick={() => onSourceClick(source, idx)}
              className={`source-card-btn stitch-card ${isActive ? 'is-active' : ''}`}
            >
              {/* Timestamp Play Button Badge */}
              <div className="source-badge-col">
                <div className={`source-play-box ${isActive ? 'play-box-active' : 'play-box-idle'}`}>
                  <span style={{ fontSize: '15px', transform: 'translateX(1px)' }}>▶</span>
                  <span className="timestamp-text">
                    {source.formatted_time || formatTime(source.timestamp)}
                  </span>
                </div>

                {source.similarity != null && (
                  <span className="similarity-badge">
                    {Math.round(source.similarity * 100)}% match
                  </span>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="source-title-row">
                  <p className="source-video-title">
                    {source.title}
                  </p>
                  {isActive && (
                    <span className="now-playing-pill">
                      Now Playing
                    </span>
                  )}
                </div>

                <p className="source-excerpt">
                  &ldquo;{source.chunk_preview}&rdquo;
                </p>

                <span className="jump-action-text">
                  ▶ Jump to {source.formatted_time || formatTime(source.timestamp)} and play
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .source-section-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .source-icon-badge {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--accent-success-surface);
          border: 1px solid var(--accent-success-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .source-card-btn {
          display: flex;
          gap: 14px;
          padding: 14px 16px;
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: left;
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .source-card-btn:hover {
          background: var(--bg-hover);
          border-color: var(--border-muted);
          transform: translateY(-1px);
        }

        .source-card-btn.is-active {
          border-color: var(--accent-primary) !important;
          background: var(--accent-primary-surface) !important;
          box-shadow: var(--shadow-glow);
        }

        .source-badge-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .source-play-box {
          width: 54px;
          height: 54px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .play-box-active {
          background: var(--accent-primary);
          color: #ffffff;
          box-shadow: var(--clay-shadow-accent);
        }

        .play-box-idle {
          background: var(--bg-input);
          color: var(--accent-primary);
          border: 1px solid var(--border-subtle);
        }

        .timestamp-text {
          font-size: 0.68rem;
          font-weight: 800;
          margin-top: 1px;
        }

        .similarity-badge {
          font-size: 0.62rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .source-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .source-video-title {
          font-size: 0.88rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .now-playing-pill {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--accent-primary);
          background: var(--accent-primary-surface);
          border: 1px solid var(--accent-primary-border);
          padding: 2px 7px;
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }

        .source-excerpt {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 6px;
        }

        .jump-action-text {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--accent-primary);
        }

        @media (max-width: 640px) {
          .source-card-btn {
            gap: 10px;
            padding: 12px;
          }

          .source-play-box {
            width: 46px;
            height: 46px;
          }

          .source-video-title {
            font-size: 0.82rem;
          }

          .source-excerpt {
            font-size: 0.76rem;
          }
        }
      `}</style>
    </div>
  );
}
