'use client';

import { formatTime } from '@/lib/formatters';

export default function YouTubePlayer({
  videoId,
  startTime = 0,
  videoTitle = '',
  channelTitle = '',
  playTrigger = 0,
  onCopySummary,
  onExportAnki,
  onQuizClick,
}) {
  if (!videoId) {
    return (
      <div
        id="player-section"
        className="stitch-card player-empty-card"
      >
        <div className="empty-icon-circle">
          🎬
        </div>
        <p className="empty-title">
          Select any lecture to begin revising
        </p>
        <p className="empty-desc">
          Click any video from the playlist or click an AI timestamp pill to jump directly to that concept.
        </p>

        <style jsx>{`
          .player-empty-card {
            width: 100%;
            aspect-ratio: 16/9;
            border-radius: var(--radius-lg);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: var(--text-muted);
            padding: 24px;
            text-align: center;
          }
          .empty-icon-circle {
            width: 54px;
            height: 54px;
            border-radius: 50%;
            background: var(--accent-primary-surface);
            border: 1px solid var(--accent-primary-border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          .empty-title {
            font-weight: 800;
            font-size: 1rem;
            color: var(--text-primary);
          }
          .empty-desc {
            font-weight: 500;
            font-size: 0.82rem;
            color: var(--text-muted);
            max-width: 440px;
          }
        `}</style>
      </div>
    );
  }

  const shouldAutoplay = playTrigger > 0 ? 1 : 0;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${shouldAutoplay}&start=${Math.max(0, Math.floor(startTime))}&rel=0&enablejsapi=1`;
  const youtubeDirectUrl = `https://www.youtube.com/watch?v=${videoId}${startTime > 0 ? `&t=${Math.floor(startTime)}s` : ''}`;

  return (
    <div id="player-section" className="stitch-card player-wrapper">
      {/* 16:9 Video Viewport */}
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

      {/* Video Info Header Bar */}
      <div className="player-meta-bar">
        <div className="title-area">
          <h2 className="lecture-title" title={videoTitle}>
            {videoTitle || 'Now Playing'}
          </h2>
          <div className="meta-pills">
            {channelTitle && (
              <span className="channel-badge">
                {channelTitle} <span className="verified-check">✓</span>
              </span>
            )}
            <span className="clay-badge-success status-tag">
              ⚡ 100% Vector Indexed
            </span>
            <span className="hd-tag">
              1080p HD
            </span>
            {startTime > 0 && (
              <span className="timestamp-pill">
                ▶ Jumped to {formatTime(startTime)}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="player-actions">
          <a
            href={youtubeDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="clay-button action-btn yt-btn"
          >
            <span>Open on YouTube ↗</span>
          </a>
        </div>
      </div>

      <style jsx>{`
        .player-wrapper {
          width: 100%;
          max-width: 100%;
          border-radius: var(--radius-lg);
          overflow: hidden;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
        }

        .player-iframe-container {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 ratio */
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }

        .player-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .player-meta-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .title-area {
          flex: 1;
          min-width: 240px;
        }

        .lecture-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.35;
          letter-spacing: -0.015em;
          margin-bottom: 6px;
        }

        .meta-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .channel-badge {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .verified-check {
          color: var(--accent-primary);
          font-weight: 900;
        }

        .status-tag {
          font-size: 0.72rem;
          padding: 2px 8px;
        }

        .hd-tag {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 7px;
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }

        .timestamp-pill {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: var(--accent-primary-surface);
          border: 1px solid var(--accent-primary-border);
          color: var(--accent-primary);
        }

        .player-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-btn {
          font-size: 0.78rem;
          padding: 6px 12px;
          font-weight: 700;
        }

        .yt-btn {
          text-decoration: none;
          color: var(--text-secondary);
        }

        @media (max-width: 640px) {
          .player-wrapper {
            padding: 10px;
            border-radius: 12px;
          }

          .lecture-title {
            font-size: 0.95rem;
          }

          .player-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
