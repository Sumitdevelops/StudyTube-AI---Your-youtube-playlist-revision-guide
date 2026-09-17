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
    <div
      id="player-section"
      className="clay-card"
      style={{
        width: '100%',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        scrollMarginTop: '20px',
      }}
    >
      {/* Player Header / Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#2ecc71',
              boxShadow: '0 0 8px #2ecc71',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '380px',
            }}
            title={videoTitle}
          >
            {videoTitle || 'Now Playing'}
          </span>
          {startTime > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary-surface)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(138, 120, 245, 0.3)',
              }}
            >
              @ {formatTime(startTime)}
            </span>
          )}
        </div>

        <a
          href={youtubeDirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-hover)',
            transition: 'all 0.2s ease',
          }}
        >
          Open on YouTube ↗
        </a>
      </div>

      {/* Video Iframe with 16:9 Aspect Ratio */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%', /* 16:9 */
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: '#000',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
        }}
      >
        <iframe
          key={`${videoId}_${startTime}_${playTrigger}`}
          src={embedUrl}
          title={videoTitle || 'YouTube Video Player'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}
