'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPlaylists } from '@/lib/api';

export default function AvailablePlaylistsModal({
  isOpen,
  onClose,
  playlists: initialPlaylists = [],
  activePlaylistId,
  onSelectPlaylist,
  onRequestPlaylist,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseList, setCourseList] = useState(initialPlaylists || []);
  const [totalCount, setTotalCount] = useState(initialPlaylists?.length || 0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const debounceTimerRef = useRef(null);

  // Fetch playlists with optional search & pagination
  const fetchCourses = useCallback(async (query = '', pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await getPlaylists({
        search: query.trim(),
        page: pageNum,
        limit: 20
      });

      const newItems = data.playlists || [];
      if (append) {
        setCourseList(prev => [...prev, ...newItems]);
      } else {
        setCourseList(newItems);
      }
      setTotalCount(data.total !== undefined ? data.total : newItems.length);
      setHasMore(Boolean(data.has_more));
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Fetch initial list when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      fetchCourses('', 1, false);
    }
  }, [isOpen, fetchCourses]);

  // Handle debounced search input
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCourses(val, 1, false);
    }, 250);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchCourses('', 1, false);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchCourses(searchQuery, page + 1, true);
    }
  };

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
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog clay-card animate-pop-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="modal-header-row">
          <div className="modal-header-icon">
            📚
          </div>
          <div>
            <h2 className="modal-title">
              Available Courses &amp; Playlists
            </h2>
            <p className="modal-subtitle">
              Instant indexed search across {totalCount > 0 ? `${totalCount.toLocaleString()} courses` : 'all playlists'}.
            </p>
          </div>
        </div>

        {/* Course Search Box */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            className="clay-input"
            type="text"
            placeholder="Search courses or channel (e.g. TOC, Gate Smashers, AI)..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              paddingLeft: '44px',
              paddingRight: searchQuery ? '40px' : '16px',
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
              onClick={handleClearSearch}
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
                padding: '4px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results Counter / Status */}
        <div className="modal-meta-row">
          <span>
            {isLoading ? (
              'Searching courses...'
            ) : (
              `${totalCount.toLocaleString()} ${totalCount === 1 ? 'course' : 'courses'} found`
            )}
          </span>
          <button
            onClick={() => handleRequestCourse(searchQuery)}
            className="request-link-btn"
          >
            Can&apos;t find your course? Request it ✨
          </button>
        </div>

        {/* Playlists Cards Grid (Scrollable) */}
        <div className="course-cards-list">
          {isLoading ? (
            /* Skeleton Loading in Modal */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="course-card clay-card-flat" style={{ opacity: 0.6 }}>
                  <div className="course-thumb-box" style={{ animation: 'pulse 1.5s infinite' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ height: '16px', width: '60%', background: 'rgba(0,0,0,0.08)', borderRadius: '6px' }} />
                    <div style={{ height: '12px', width: '35%', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : courseList.length > 0 ? (
            <>
              {courseList.map((playlist) => {
                const isActive = playlist.playlist_id === activePlaylistId;
                const shortTitle = (playlist.playlist_title || '')
                  .split('|')[0]
                  .split('-')[0]
                  .trim();

                return (
                  <div
                    key={playlist.playlist_id}
                    className={`course-card clay-card-flat animate-fade-in ${isActive ? 'is-active-course' : ''}`}
                  >
                    {/* Top / Main info row */}
                    <div className="course-main-content">
                      {/* Playlist Thumbnail */}
                      <div className="course-thumb-box">
                        {playlist.thumbnail_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={playlist.thumbnail_url}
                            alt={playlist.playlist_title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            loading="lazy"
                          />
                        ) : (
                          <div className="course-thumb-fallback">
                            🎓
                          </div>
                        )}
                      </div>

                      {/* Course Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                          <h3 className="course-title">
                            {shortTitle}
                          </h3>
                          {isActive && (
                            <span className="active-course-pill">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        {/* YouTube Channel Name */}
                        {playlist.channel_title && (
                          <div style={{ marginBottom: '4px' }}>
                            <span className="course-channel-badge">
                              📺 {playlist.channel_title}
                            </span>
                          </div>
                        )}

                        <p
                          className="course-full-title"
                          title={playlist.playlist_title}
                        >
                          {playlist.playlist_title}
                        </p>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {playlist.video_count > 0 && (
                            <span className="course-stat-badge">
                              🎬 {playlist.video_count} Lectures
                            </span>
                          )}
                          {playlist.chunk_count > 0 && (
                            <span className="course-stat-badge">
                              ⚡ {playlist.chunk_count} Chunks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Select / Action Button */}
                    <div className="course-action-col">
                      <button
                        onClick={() => handleSelect(playlist.playlist_id)}
                        className="clay-button course-select-btn"
                      >
                        {isActive ? '✓ Selected' : '🚀 Start Revising'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Load More Button if hasMore */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="clay-button"
                    style={{ fontSize: '0.84rem', padding: '9px 20px' }}
                  >
                    {isLoadingMore ? 'Loading more courses...' : '⬇ Load More Courses'}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State when searched course is not found */
            <div className="empty-state-card clay-card-flat animate-pop-in">
              <div className="empty-icon-circle">
                🔍
              </div>
              <h3 className="empty-title">
                No course found for &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="empty-desc">
                This playlist has not been indexed into StudyTube AI yet. You can request the admin to index it, and we will notify you on Telegram once it is live!
              </p>

              <button
                onClick={() => handleRequestCourse(searchQuery)}
                className="clay-button empty-request-btn"
              >
                ✨ Request &ldquo;{searchQuery}&rdquo; Playlist
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(30, 20, 40, 0.45);
          backdrop-filter: blur(6px);
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .modal-dialog {
          width: 100%;
          max-width: 740px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          padding: 28px 32px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--clay-shadow-lg);
          position: relative;
        }

        .modal-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          color: var(--text-muted);
          line-height: 1;
          z-index: 10;
          padding: 6px;
        }

        .modal-header-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .modal-header-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--accent-primary);
          box-shadow: var(--clay-shadow-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .modal-title {
          font-size: 1.3rem;
          font-weight: 900;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .modal-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .modal-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-secondary);
          flex-wrap: wrap;
          gap: 6px;
        }

        .request-link-btn {
          background: none;
          border: none;
          color: var(--accent-primary);
          cursor: pointer;
          font-weight: 800;
          font-size: 0.78rem;
          text-decoration: underline;
        }

        .course-cards-list {
          overflow-y: auto;
          flex: 1;
          padding-right: 4px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          -webkit-overflow-scrolling: touch;
        }

        .course-card {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-input);
          border-radius: var(--radius-lg);
          box-shadow: var(--clay-shadow-sm);
          border: 1px solid rgba(255, 255, 255, 0.4);
          transition: all 0.2s ease;
        }

        .course-card.is-active-course {
          background: var(--accent-primary-surface);
          border: 2px solid var(--accent-primary);
        }

        .course-main-content {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .course-thumb-box {
          width: 95px;
          height: 60px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background: #dcd4cc;
          box-shadow: var(--clay-shadow-sm);
        }

        .course-thumb-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .course-title {
          font-size: 0.96rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .active-course-pill {
          font-size: 0.66rem;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 999px;
          background: var(--accent-primary);
          color: #fff;
          letter-spacing: 0.4px;
        }

        .course-channel-badge {
          font-size: 0.72rem;
          font-weight: 800;
          color: #dc2626;
          background: rgba(220, 38, 38, 0.08);
          border: 1px solid rgba(220, 38, 38, 0.2);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .course-full-title {
          font-size: 0.76rem;
          color: var(--text-muted);
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .course-stat-badge {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.7);
          padding: 2px 7px;
          border-radius: var(--radius-sm);
        }

        .course-action-col {
          flex-shrink: 0;
        }

        .course-select-btn {
          padding: 9px 16px;
          font-size: 0.82rem;
          font-weight: 800;
          box-shadow: var(--clay-shadow-sm);
          white-space: nowrap;
        }

        .empty-state-card {
          text-align: center;
          padding: 30px 18px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
          border: 1.5px dashed rgba(99, 102, 241, 0.35);
          border-radius: var(--radius-lg);
        }

        .empty-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--accent-primary-surface);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 12px;
          box-shadow: var(--clay-shadow-sm);
        }

        .empty-title {
          font-size: 1.1rem;
          font-weight: 900;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .empty-desc {
          font-size: 0.84rem;
          color: var(--text-secondary);
          max-width: 440px;
          margin: 0 auto 18px;
          line-height: 1.5;
        }

        .empty-request-btn {
          padding: 10px 22px;
          font-size: 0.88rem;
          font-weight: 800;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .modal-overlay {
            padding: 8px;
          }

          .modal-dialog {
            padding: 18px 14px;
            max-height: 94vh;
            border-radius: var(--radius-lg);
          }

          .modal-title {
            font-size: 1.12rem;
          }

          .modal-header-icon {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }

          .course-card {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
            padding: 12px;
          }

          .course-thumb-box {
            width: 76px;
            height: 48px;
          }

          .course-title {
            font-size: 0.88rem;
          }

          .course-action-col {
            width: 100%;
          }

          .course-select-btn {
            width: 100%;
            justify-content: center;
            padding: 8px 12px;
            font-size: 0.8rem;
          }

          .empty-request-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
