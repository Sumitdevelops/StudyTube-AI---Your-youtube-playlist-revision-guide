'use client';

import { useState } from 'react';
import { formatDuration } from '@/lib/formatters';

export default function PlaylistSidebar({
  videos = [],
  selectedVideoId,
  onSelectVideo,
  playlistTitle,
  playlists = [],
  activePlaylistId = '',
  onSelectPlaylist,
  isLoadingVideos = false,
  isLoadingMoreVideos = false,
  videoStats = { loaded: 0, total: 0 },
  recentPlaylists = [],
  onOpenBrowsePlaylists,
}) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const handleVideoClick = (video) => {
    onSelectVideo(video);
    // Smooth scroll to player on mobile
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      const playerEl = document.getElementById('player-section');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const activePlaylist = playlists?.find(p => p.playlist_id === activePlaylistId);

  // 1. Shimmer Skeleton Loading State (When loading and no cached videos exist)
  if (isLoadingVideos && (!videos || videos.length === 0)) {
    return (
      <div className="sidebar-wrapper clay-card-flat animate-fade-in">
        <div className="skeleton-header">
          <div className="skeleton-badge-pill" />
          <div className="skeleton-title-bar" />
          <div className="skeleton-sub-bar" />
        </div>

        <div className="loading-status-badge">
          <span className="spinner-dot" />
          <span>Loading course lectures...</span>
        </div>

        <div className="video-list-container">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-video-item">
              <div className="skeleton-thumb" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-line" style={{ width: `${60 + (i * 7) % 35}%` }} />
                <div className="skeleton-line-sm" style={{ width: '35%' }} />
              </div>
              <div className="skeleton-idx">#{i}</div>
            </div>
          ))}
        </div>

        <style jsx>{`
          .sidebar-wrapper {
            padding: 20px;
            max-height: calc(100vh - 220px);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .skeleton-header {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 8px;
          }
          .skeleton-badge-pill {
            width: 90px;
            height: 18px;
            border-radius: 999px;
            background: rgba(0,0,0,0.06);
            animation: pulse-shimmer 1.5s infinite ease-in-out;
          }
          .skeleton-title-bar {
            width: 75%;
            height: 22px;
            border-radius: 8px;
            background: rgba(0,0,0,0.08);
            animation: pulse-shimmer 1.5s infinite ease-in-out;
          }
          .skeleton-sub-bar {
            width: 40%;
            height: 14px;
            border-radius: 6px;
            background: rgba(0,0,0,0.05);
            animation: pulse-shimmer 1.5s infinite ease-in-out;
          }
          .loading-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background: var(--accent-primary-surface);
            color: var(--accent-primary);
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 800;
            width: fit-content;
          }
          .spinner-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--accent-primary);
            animation: pulse-dot 1s infinite alternate;
          }
          .skeleton-video-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: var(--radius-md);
            background: rgba(0,0,0,0.03);
          }
          .skeleton-thumb {
            width: 64px;
            height: 36px;
            border-radius: 8px;
            background: rgba(0,0,0,0.08);
            animation: pulse-shimmer 1.5s infinite ease-in-out;
            flex-shrink: 0;
          }
          .skeleton-line {
            height: 14px;
            border-radius: 6px;
            background: rgba(0,0,0,0.08);
            animation: pulse-shimmer 1.5s infinite ease-in-out;
          }
          .skeleton-line-sm {
            height: 10px;
            border-radius: 4px;
            background: rgba(0,0,0,0.05);
            animation: pulse-shimmer 1.5s infinite ease-in-out;
          }
          .skeleton-idx {
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--text-muted);
            opacity: 0.4;
          }
          @keyframes pulse-shimmer {
            0% { opacity: 0.4; }
            50% { opacity: 0.8; }
            100% { opacity: 0.4; }
          }
          @keyframes pulse-dot {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.3); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // 2. Empty State (When not loading and genuinely empty)
  if (!videos || videos.length === 0) {
    return (
      <div
        className="clay-card-flat"
        style={{
          padding: '24px 20px',
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '40px' }}>📚</div>
        <p style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          No playlist loaded
        </p>
        <p style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Index or select a YouTube course to start studying
        </p>
        {onOpenBrowsePlaylists && (
          <button
            onClick={onOpenBrowsePlaylists}
            className="clay-button"
            style={{ fontSize: '0.82rem', padding: '8px 16px', marginTop: '4px' }}
          >
            🔍 Browse Courses
          </button>
        )}
      </div>
    );
  }

  // Calculate loaded vs total stats for progressive bar
  const totalVideosCount = videoStats?.total || activePlaylist?.video_count || videos.length;
  const loadedVideosCount = videos.length;
  const progressPercent = Math.min(100, Math.round((loadedVideosCount / (totalVideosCount || 1)) * 100));

  return (
    <div className="sidebar-wrapper clay-card-flat">
      {/* Course Switcher & Quick Navigation */}
      <div className="course-nav-bar">
        <div className="course-nav-left">
          <span className="course-nav-label">📚 Course</span>
        </div>
        {onOpenBrowsePlaylists && (
          <button
            onClick={onOpenBrowsePlaylists}
            className="browse-courses-trigger"
            title="Search all available courses"
          >
            <span>🔍 Switch</span>
          </button>
        )}
      </div>

      {/* Recent Courses Chips (1-click instant switch) */}
      {recentPlaylists && recentPlaylists.length > 1 && (
        <div className="recent-chips-container">
          {recentPlaylists.slice(0, 4).map((rp) => {
            const isCurrent = rp.playlist_id === activePlaylistId;
            const cleanTitle = (rp.playlist_title || '').split('|')[0].split('-')[0].trim();
            return (
              <button
                key={rp.playlist_id}
                onClick={() => onSelectPlaylist && onSelectPlaylist(rp.playlist_id)}
                className={`recent-chip ${isCurrent ? 'recent-chip-active' : ''}`}
                title={rp.playlist_title}
              >
                {cleanTitle}
              </button>
            );
          })}
        </div>
      )}

      {/* Playlist Title & Mobile Accordion Toggle */}
      <div className="sidebar-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="sidebar-title" title={playlistTitle || 'Course Playlist'}>
            🎬 {playlistTitle || 'Course Playlist'}
          </h2>
          {activePlaylist?.channel_title && (
            <div className="sidebar-channel-badge">
              📺 {activePlaylist.channel_title}
            </div>
          )}
          <p className="sidebar-subtitle">
            {loadedVideosCount} {totalVideosCount > loadedVideosCount ? `of ${totalVideosCount}` : ''} lecture{loadedVideosCount !== 1 ? 's' : ''} ready
          </p>
        </div>

        <button
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="clay-button sidebar-mobile-toggle"
          aria-expanded={isMobileExpanded}
        >
          {isMobileExpanded ? '▲ Hide' : `▼ Lectures (${loadedVideosCount})`}
        </button>
      </div>

      {/* Progressive Loading Status Bar (when more lectures are streaming in the background) */}
      {isLoadingMoreVideos && (
        <div className="progressive-loading-container animate-fade-in">
          <div className="progressive-loading-text">
            <span>⚡ Loading remaining lectures ({loadedVideosCount}/{totalVideosCount})...</span>
            <span className="progressive-percent">{progressPercent}%</span>
          </div>
          <div className="progressive-track">
            <div
              className="progressive-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Video List */}
      <div className={`video-list-container ${isMobileExpanded ? 'mobile-show' : 'mobile-hide'}`}>
        {videos.map((video, idx) => {
          const isActive = video.video_id === selectedVideoId;
          return (
            <button
              key={video.video_id}
              onClick={() => handleVideoClick(video)}
              className={`video-item-btn ${isActive ? 'clay-card-pressed active-video' : ''}`}
            >
              {/* Thumbnail */}
              <div className="video-thumb-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail_url || `https://i.ytimg.com/vi/${video.video_id}/default.jpg`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>

              {/* Video Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className={`video-item-title ${isActive ? 'active-text' : ''}`}>
                  {isActive ? `▶ ${video.title}` : video.title}
                </p>
                {video.duration > 0 && (
                  <p className={`video-item-duration ${isActive ? 'active-text' : ''}`}>
                    ⏱ {formatDuration(video.duration)}
                  </p>
                )}
              </div>

              {/* Position */}
              <span className={`video-item-idx ${isActive ? 'active-text' : ''}`}>
                #{idx + 1}
              </span>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .sidebar-wrapper {
          padding: 20px;
          max-height: calc(100vh - 220px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .course-nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2px 4px;
        }

        .course-nav-label {
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .browse-courses-trigger {
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: var(--accent-primary);
          padding: 3px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .browse-courses-trigger:hover {
          background: var(--accent-primary);
          color: #fff;
        }

        .recent-chips-container {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
        }

        .recent-chip {
          padding: 4px 9px;
          font-size: 0.72rem;
          font-weight: 700;
          border-radius: 999px;
          background: var(--bg-card);
          color: var(--text-secondary);
          border: 1px solid rgba(0,0,0,0.08);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .recent-chip:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .recent-chip-active {
          background: var(--accent-primary);
          color: #ffffff;
          border-color: var(--accent-primary);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
          padding: 0 4px;
          gap: 8px;
        }

        .sidebar-title {
          font-size: 0.98rem;
          font-weight: 800;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.3;
        }

        .sidebar-channel-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.2);
          padding: 2px 7px;
          border-radius: var(--radius-sm);
          margin-top: 4px;
        }

        .sidebar-subtitle {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 3px;
        }

        .sidebar-mobile-toggle {
          display: none;
          font-size: 0.78rem;
          padding: 6px 12px;
          font-weight: 800;
          color: var(--accent-primary);
          background: var(--accent-primary-surface);
          border: 1px solid var(--accent-primary);
          white-space: nowrap;
          cursor: pointer;
        }

        .progressive-loading-container {
          padding: 8px 10px;
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progressive-loading-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--accent-primary);
        }

        .progressive-percent {
          opacity: 0.85;
        }

        .progressive-track {
          width: 100%;
          height: 5px;
          background: rgba(0,0,0,0.06);
          border-radius: 999px;
          overflow: hidden;
        }

        .progressive-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary) 0%, #a855f7 100%);
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .video-list-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .video-item-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-family: 'Nunito', sans-serif;
          transition: all 0.25s ease;
          width: 100%;
        }

        .video-item-btn:hover {
          background: var(--bg-hover);
          box-shadow: var(--clay-shadow-sm);
        }

        .active-video {
          background: var(--accent-primary-surface) !important;
          box-shadow: var(--clay-shadow-pressed) !important;
        }

        .video-thumb-box {
          width: 64px;
          height: 36px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 2px 2px 4px rgba(166,152,138,0.25), inset 1px 1px 2px rgba(255,255,255,0.3);
        }

        .video-item-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }

        .video-item-duration {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .video-item-idx {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .active-text {
          color: var(--accent-primary) !important;
          font-weight: 800 !important;
        }

        @media (max-width: 1024px) {
          .sidebar-wrapper {
            max-height: none;
            padding: 16px;
          }

          .sidebar-mobile-toggle {
            display: inline-flex;
          }

          .video-list-container.mobile-hide {
            display: none;
          }

          .video-list-container.mobile-show {
            display: flex;
            max-height: 480px;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}
