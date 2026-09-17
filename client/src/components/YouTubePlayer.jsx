'use client';

import { formatTime } from '@/lib/formatters';

/**
 * YouTubePlayer component.
 * Embeds YouTube video with automatic autoplay at the specified timestamp.
 * Updates immediately when videoId or startTime changes.
 */
export default function YouTubePlayer({
  videoId,
  startTime = 0,
  videoTitle = '',
  playTrigger = 0,
}) {
  if (!videoId) {
    return (
      <div
        id="player-section"
        className="clay-card-pressed"
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-muted)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            boxShadow: 'var(--clay-shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          🎬
        </div>
        <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
          Select any video to play
        </p>
        <p style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Click any video in the sidebar or click a source timestamp card to jump directly to that moment
        </p>
      </div>
    );
  }

  // Autoplay ONLY when user actively triggered playback (clicked card or sidebar)
  const shouldAutoplay = playTrigger > 0 ? 1 : 0;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${shouldAutoplay}&start=${Math.max(0, Math.floor(startTime))}&rel=0&enablejsapi=1`;
  const youtubeDirectUrl = `https://www.youtube.com/watch?v=${videoId}${startTime > 0 ? `&t=${Math.floor(startTime)}s` : ''}`;

  return (
    <div id="player-section" className="player-wrapper clay-card">
      {/* Player Header / Status Bar */}
      <div className="player-header-bar">
        <div className="player-title-box">
          <span className="player-live-dot" />
          <span className="player-title-text" title={videoTitle}>
            {videoTitle || 'Now Playing'}
          </span>
          {startTime > 0 && (
            <span className="player-time-badge">
              @ {formatTime(startTime)}
            </span>
          )}
        </div>

        <a
          href={youtubeDirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="player-direct-link"
        >
          Open on YouTube ↗
        </a>
      </div>

      {/* Video Iframe with 16:9 Aspect Ratio */}
      <div className="player-iframe-container">
        <iframe
          key={`${videoId}_${startTime}_${playTrigger}`}
          src={embedUrl}
          title={videoTitle || 'YouTube Video Player'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="player-iframe"
        />
      </div>

      <style jsx>{`
        .player-wrapper {
          width: 100%;
          max-width: 100%;
          border-radius: var(--radius-xl);
          overflow: hidden;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scroll-margin-top: 20px;
          box-sizing: border-box;
        }

        .player-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 2px;
        }

        .player-title-box {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .player-live-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2ecc71;
          box-shadow: 0 0 8px #2ecc71;
          flex-shrink: 0;
        }

        .player-title-text {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .player-time-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background: var(--accent-primary-surface);
          color: var(--accent-primary);
          border: 1px solid rgba(138, 120, 245, 0.3);
          flex-shrink: 0;
          white-space: nowrap;
        }

        .player-direct-link {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--accent-primary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          background: var(--bg-hover);
          transition: all 0.2s ease;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .player-iframe-container {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 */
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #000;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.4);
        }

        .player-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        @media (max-width: 640px) {
          .player-wrapper {
            padding: 12px;
            border-radius: var(--radius-lg);
          }

          .player-title-text {
            font-size: 0.84rem;
          }

          .player-direct-link {
            font-size: 0.72rem;
            padding: 3px 8px;
          }
        }
      `}</style>
    </div>
  );
}
