'use client';

import { formatTime } from '@/lib/formatters';

/**
 * SourceCards - Clickable timestamp citation cards.
 * Each card shows an English transcript excerpt and auto-seeks the video player on click.
 */
export default function SourceCards({ sources, activeSourceIdx, onSourceClick }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="source-cards-wrapper animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <h3 className="source-section-title">
        <span className="source-icon-badge">
          📌
        </span>
        Sources &amp; Video Citations ({sources.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sources.map((source, idx) => {
          const isActive = idx === activeSourceIdx;

          return (
            <button
              key={idx}
              onClick={() => onSourceClick(source, idx)}
              className={`source-card-btn ${isActive ? 'clay-card-pressed is-active' : 'clay-card'}`}
            >
              {/* Timestamp Play Button Badge */}
              <div className="source-badge-col">
                <div className={`source-play-box ${isActive ? 'play-box-active' : 'play-box-idle'}`}>
                  <span style={{ fontSize: '16px', transform: 'translateX(1px)' }}>▶</span>
                  <span className="timestamp-text">
                    {source.formatted_time || formatTime(source.timestamp)}
                  </span>
                </div>

                {/* Similarity score */}
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

                {/* English Translated / Summarized Excerpt */}
                <p className="source-excerpt">
                  &ldquo;{source.chunk_preview}&rdquo;
                </p>

                {/* Jump to play action */}
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
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .source-icon-badge {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          background: var(--accent-success-surface);
          box-shadow: 3px 3px 6px rgba(100,170,130,0.2), -2px -2px 4px rgba(255,255,255,0.6), inset 1px 1px 2px rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .source-card-btn {
          display: flex;
          gap: 16px;
          padding: 16px 18px;
          border: 2px solid transparent;
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: left;
          font-family: 'Nunito', sans-serif;
          width: 100%;
          background: var(--bg-card);
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
        }

        .source-card-btn.is-active {
          border-color: var(--accent-primary);
          background: var(--accent-primary-surface);
        }

        .source-badge-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }

        .source-play-box {
          width: 58px;
          height: 58px;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: all 0.25s ease;
        }

        .play-box-active {
          background: var(--accent-primary);
          box-shadow: var(--clay-shadow-accent);
        }

        .play-box-idle {
          background: var(--accent-warning);
          box-shadow: 3px 3px 6px rgba(200,170,120,0.3), -2px -2px 4px rgba(255,255,255,0.6), inset 1px 1px 2px rgba(255,255,255,0.5);
        }

        .timestamp-text {
          font-size: 0.68rem;
          font-weight: 800;
          margin-top: 1px;
        }

        .similarity-badge {
          font-size: 0.64rem;
          font-weight: 700;
          color: var(--text-muted);
          opacity: 0.85;
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
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-primary);
          background: rgba(138, 120, 245, 0.15);
          padding: 2px 7px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }

        .source-excerpt {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 6px;
        }

        .jump-action-text {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--accent-primary);
        }

        @media (max-width: 640px) {
          .source-card-btn {
            gap: 10px;
            padding: 12px 14px;
            border-radius: var(--radius-md);
          }

          .source-play-box {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-sm);
          }

          .timestamp-text {
            font-size: 0.62rem;
          }

          .source-video-title {
            font-size: 0.82rem;
          }

          .source-excerpt {
            font-size: 0.76rem;
          }

          .jump-action-text {
            font-size: 0.72rem;
          }
        }
      `}</style>
    </div>
  );
}
