'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  const [filterQuery, setFilterQuery] = useState('');

  const handleVideoClick = (video) => {
    onSelectVideo(video);
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      const playerEl = document.getElementById('player-section');
      if (playerEl) {
        playerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const activePlaylist = playlists?.find(p => p.playlist_id === activePlaylistId);

  // In-playlist filter
  const filteredVideos = useMemo(() => {
    if (!filterQuery.trim()) return videos;
    const q = filterQuery.toLowerCase();
    return videos.filter(v => (v.title || '').toLowerCase().includes(q));
  }, [videos, filterQuery]);

  // Loading skeleton state
  if (isLoadingVideos && (!videos || videos.length === 0)) {
    return (
      <div className="sidebar-wrapper stitch-card animate-fade-in">
        <div className="skeleton-header">
          <div className="skeleton" style={{ width: '80px', height: '16px' }} />
          <div className="skeleton" style={{ width: '90%', height: '22px' }} />
          <div className="skeleton" style={{ width: '50%', height: '14px' }} />
        </div>

        <div className="loading-badge">
          <span className="spinner-dot" />
          <span>Buffering course lectures...</span>
        </div>

        <div className="video-list-container">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-item">
              <div className="skeleton" style={{ width: '60px', height: '36px', borderRadius: '6px' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton" style={{ width: `${55 + (i * 9) % 35}%`, height: '14px' }} />
                <div className="skeleton" style={{ width: '30%', height: '10px' }} />
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          .sidebar-wrapper {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            border-radius: var(--radius-lg);
          }
          .skeleton-header {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .loading-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: var(--accent-primary-surface);
            color: var(--accent-primary);
            border-radius: var(--radius-full);
            font-size: 0.76rem;
            font-weight: 700;
            width: fit-content;
          }
          .spinner-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent-primary);
            animation: pulse-dot 1s infinite alternate;
          }
          .video-list-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .skeleton-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            border-radius: var(--radius-md);
            background: var(--bg-hover);
          }
          @keyframes pulse-dot {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.3); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Empty state
  if (!videos || videos.length === 0) {
    return (
      <div className="stitch-card empty-sidebar">
        <div style={{ fontSize: '36px' }}>📚</div>
        <p style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
          No Course Loaded
        </p>
        <p style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Explore our indexed courses to begin revising
        </p>
        <Link
          href="/playlists"
          className="clay-button"
          style={{ fontSize: '0.8rem', padding: '6px 14px', textDecoration: 'none', color: 'inherit' }}
        >
          🔍 Browse Courses
        </Link>
        <style jsx>{`
          .empty-sidebar {
            padding: 24px 16px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border-radius: var(--radius-lg);
          }
        `}</style>
      </div>
    );
  }

  const totalVideosCount = videoStats?.total || activePlaylist?.video_count || videos.length;
  const loadedVideosCount = videos.length;
  const progressPercent = Math.min(100, Math.round((loadedVideosCount / (totalVideosCount || 1)) * 100));

  return (
    <div className="sidebar-wrapper stitch-card">
      {/* Course Context Header */}
      <div className="course-header-box">
        <div className="course-title-row">
          <div>
            <span className="course-label">Active Course</span>
            <h2 className="course-heading" title={playlistTitle || 'Course Playlist'}>
              {playlistTitle || 'Course Playlist'}
            </h2>
            {activePlaylist?.channel_title && (
              <span className="channel-pill">
                📺 {activePlaylist.channel_title}
              </span>
            )}
          </div>
          <Link
            href="/playlists"
            className="switch-btn"
            title="Browse full course catalog"
            style={{ textDecoration: 'none' }}
          >
            <span>Switch ↗</span>
          </Link>
        </div>

        {/* Recent Courses Chips */}
        {recentPlaylists && recentPlaylists.length > 1 && (
          <div className="recent-chips-scroll">
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

        {/* Indexing Progress Indicator */}
        <div className="indexing-status-row">
          <span className="lecture-count-tag">
            {loadedVideosCount} {totalVideosCount > loadedVideosCount ? `of ${totalVideosCount}` : ''} Lectures
          </span>
          <span className="clay-badge-success indexed-badge">
            ✓ 100% Vector Ready
          </span>
        </div>

        {/* Background Stream Progress Bar (if still buffering) */}
        {isLoadingMoreVideos && (
          <div className="stream-progress-box">
            <div className="stream-text">
              <span>Streaming lectures...</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="stream-bar-track">
              <div className="stream-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        {/* Fast In-Playlist Search Input */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Filter lectures (e.g. DFA, Greedy)..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="lecture-search-input"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="clear-search-btn"
              title="Clear filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Lecture Items */}
      <div className="lecture-scroll-list">
        {filteredVideos.map((video, idx) => {
          const isActive = video.video_id === selectedVideoId;
          const displayIdx = video.position || idx + 1;
          return (
            <button
              key={video.video_id}
              onClick={() => handleVideoClick(video)}
              className={`lecture-card ${isActive ? 'active-lecture-glow active-card' : ''}`}
            >
              {/* Thumbnail Container */}
              <div className="thumb-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail_url || `https://i.ytimg.com/vi/${video.video_id}/default.jpg`}
                  alt=""
                  className="thumb-img"
                  loading="lazy"
                />
                {video.duration > 0 && (
                  <span className="duration-tag">
                    {formatDuration(video.duration)}
                  </span>
                )}
              </div>

              {/* Title & Index */}
              <div className="lecture-info">
                <div className="index-row">
                  <span className="index-pill">
                    #{displayIdx < 10 ? `0${displayIdx}` : displayIdx}
                  </span>
                  {isActive && <span className="now-playing-pill">NOW PLAYING</span>}
                </div>
                <p className="lecture-title-text" title={video.title}>
                  {video.title}
                </p>
              </div>
            </button>
          );
        })}
        {filteredVideos.length === 0 && filterQuery && (
          <p className="no-matches-text">
            No lectures match &quot;{filterQuery}&quot;
          </p>
        )}
      </div>

      <style jsx>{`
        .sidebar-wrapper {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-radius: var(--radius-lg);
          max-height: calc(100vh - 120px);
          overflow: hidden;
        }

        .course-header-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 12px;
        }

        .course-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .course-label {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .course-heading {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.25;
          margin-top: 2px;
          max-width: 240px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .channel-pill {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-top: 2px;
          display: inline-block;
        }

        .switch-btn {
          font-size: 0.74rem;
          font-weight: 800;
          color: var(--accent-primary);
          padding: 3px 8px;
          background: var(--accent-primary-surface);
          border: 1px solid var(--accent-primary-border);
          border-radius: var(--radius-sm);
          white-space: nowrap;
          transition: all 0.18s;
        }

        .switch-btn:hover {
          background: var(--accent-primary);
          color: #fff;
        }

        .recent-chips-scroll {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px 0;
        }
        .recent-chips-scroll::-webkit-scrollbar {
          display: none;
        }

        .recent-chip {
          padding: 3px 8px;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          background: var(--bg-hover);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.16s;
        }

        .recent-chip-active {
          background: var(--accent-primary);
          color: #fff;
          border-color: var(--accent-primary);
        }

        .indexing-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.74rem;
          margin-top: 2px;
        }

        .lecture-count-tag {
          font-weight: 700;
          color: var(--text-secondary);
        }

        .indexed-badge {
          font-size: 0.68rem;
          padding: 1px 7px;
        }

        .stream-progress-box {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .stream-text {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--accent-primary);
        }

        .stream-bar-track {
          width: 100%;
          height: 4px;
          border-radius: 999px;
          background: var(--border-subtle);
          overflow: hidden;
        }

        .stream-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          transition: width 0.3s ease;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .lecture-search-input {
          width: 100%;
          padding: 7px 28px 7px 12px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          color: var(--text-primary);
          outline: none;
          transition: all 0.18s;
        }

        .lecture-search-input:focus {
          border-color: var(--accent-primary);
          background: var(--bg-card);
        }

        .clear-search-btn {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.72rem;
          cursor: pointer;
        }

        .lecture-scroll-list {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-right: 2px;
          max-height: calc(100vh - 360px);
        }

        .lecture-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 9px;
          border-radius: var(--radius-md);
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.18s ease;
        }

        .lecture-card:hover {
          background: var(--bg-hover);
          border-color: var(--border-muted);
          transform: translateX(2px);
        }

        .active-card {
          background: var(--bg-card) !important;
        }

        .thumb-container {
          position: relative;
          width: 68px;
          height: 40px;
          border-radius: 6px;
          overflow: hidden;
          background: #000;
          flex-shrink: 0;
        }

        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .duration-tag {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: rgba(0, 0, 0, 0.78);
          color: #fff;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 3px;
        }

        .lecture-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .index-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .index-pill {
          font-size: 0.66rem;
          font-weight: 800;
          color: var(--text-muted);
        }

        .now-playing-pill {
          font-size: 0.6rem;
          font-weight: 900;
          color: var(--accent-primary);
          background: var(--accent-primary-surface);
          padding: 1px 5px;
          border-radius: var(--radius-full);
          letter-spacing: 0.04em;
        }

        .lecture-title-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .no-matches-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-align: center;
          padding: 18px 8px;
        }

        @media (max-width: 1024px) {
          .sidebar-wrapper {
            max-height: none;
          }
          .lecture-scroll-list {
            max-height: 380px;
          }
        }
      `}</style>
    </div>
  );
}
