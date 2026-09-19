'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getPlaylists } from '@/lib/api';
import RequestPlaylistModal from '@/components/RequestPlaylistModal';

export default function PlaylistsPage() {
  const router = useRouter();

  // State
  const [playlists, setPlaylists] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isColdStarting, setIsColdStarting] = useState(false);

  // Request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestSubject, setRequestSubject] = useState('');

  const searchTimerRef = useRef(null);

  // Fetch playlists from Catalog API
  const fetchPlaylists = useCallback(async (query = '', pageNum = 1, append = false) => {
    if (pageNum === 1 && playlists.length === 0) {
      setIsLoading(true);
    } else if (pageNum > 1) {
      setIsLoadingMore(true);
    }

    try {
      const data = await getPlaylists({
        search: query.trim(),
        page: pageNum,
        limit: 12
      });

      const fetched = data.playlists || [];
      setTotalCount(data.total || (append ? playlists.length + fetched.length : fetched.length));
      setHasMore(Boolean(data.has_more));
      setPage(pageNum);

      if (append) {
        setPlaylists(prev => {
          const existingIds = new Set(prev.map(p => p.playlist_id));
          const newUnique = fetched.filter(p => !existingIds.has(p.playlist_id));
          return [...prev, ...newUnique];
        });
      } else {
        setPlaylists(fetched);
        // Cache initial browse list in localStorage for instant 0ms first paint
        if (!query && pageNum === 1 && typeof window !== 'undefined' && fetched.length > 0) {
          try {
            localStorage.setItem('studytube_catalog_cache', JSON.stringify({
              playlists: fetched,
              total: data.total || fetched.length
            }));
          } catch (e) {
            console.warn('Could not cache catalog:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
      if (!append && playlists.length === 0) setPlaylists([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [playlists.length]);

  // Initial load: 0ms first paint from localStorage + background revalidation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('studytube_catalog_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.playlists) && parsed.playlists.length > 0) {
            setPlaylists(parsed.playlists);
            setTotalCount(parsed.total || parsed.playlists.length);
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.warn('Error reading catalog cache:', e);
      }
    }

    // Cold-start detector: show warning if server takes > 2.5s
    const coldTimer = setTimeout(() => {
      setIsColdStarting(true);
    }, 2500);

    fetchPlaylists('', 1, false).finally(() => {
      clearTimeout(coldTimer);
      setIsColdStarting(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      fetchPlaylists(val, 1, false);
    }, 250);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    fetchPlaylists('', 1, false);
  };

  // Load next page on scroll / click
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    fetchPlaylists(searchQuery, page + 1, true);
  };

  // Click "Start Revising" -> Save active session and route to home
  const handleStartRevising = (playlist) => {
    if (!playlist || !playlist.playlist_id) return;

    if (typeof window !== 'undefined') {
      // Store in localStorage for instant 0ms first paint on home page
      try {
        localStorage.setItem('studytube_active_session', JSON.stringify({
          playlist_id: playlist.playlist_id,
          playlist_title: playlist.playlist_title,
          channel_title: playlist.channel_title,
          video_count: playlist.video_count,
          chunk_count: playlist.chunk_count,
          total: playlist.video_count,
          videos: []
        }));
      } catch (e) {
        console.warn('Could not cache session:', e);
      }
    }

    // Redirect to home page with query param
    router.push(`/?playlist=${encodeURIComponent(playlist.playlist_id)}`);
  };

  const handleOpenRequest = (subject = '') => {
    setRequestSubject(subject);
    setIsRequestModalOpen(true);
  };

  // Filter categorization
  const filteredPlaylists = playlists.filter(p => {
    if (activeFilter === 'ALL') return true;
    const text = `${p.playlist_title} ${p.channel_title}`.toLowerCase();
    if (activeFilter === 'DSA') return text.includes('dsa') || text.includes('algorithm') || text.includes('pointer') || text.includes('structure');
    if (activeFilter === 'AI') return text.includes('ai') || text.includes('learning') || text.includes('engineer') || text.includes('data');
    if (activeFilter === 'CS') return text.includes('gate') || text.includes('computation') || text.includes('toc') || text.includes('network') || text.includes('os');
    return true;
  });

  return (
    <div className="playlists-page-container">
      {/* Top Navbar */}
      <header className="site-header">
        <div className="nav-left">
          <Link href="/" className="brand-group" style={{ textDecoration: 'none' }}>
            <div className="brand-icon">🎓</div>
            <div>
              <h1 className="brand-title">StudyTube AI</h1>
              <p className="brand-subtitle">Interactive YouTube Playlist Study Assistant</p>
            </div>
          </Link>
        </div>

        {/* Global Nav Actions */}
        <div className="header-actions">
          <Link href="/" className="clay-button header-btn back-home-btn">
            <span>← Study Room</span>
          </Link>

          <button
            onClick={() => handleOpenRequest(searchQuery)}
            className="clay-button header-btn request-btn"
          >
            <span>✨</span>
            <span className="btn-label-desktop">Request Playlist</span>
            <span className="btn-label-mobile">Request</span>
            <span className="btn-tag">FREE</span>
          </button>
        </div>
      </header>

      {/* Main Content Hub */}
      <main className="playlists-main-content">
        {/* Cloud Server Cold-Start Reassurance Banner */}
        {isColdStarting && (
          <div
            className="clay-card-flat animate-fade-in"
            style={{
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.86rem',
              color: 'var(--accent-primary)',
              background: 'var(--accent-primary-surface)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              border: '1px solid rgba(99, 102, 241, 0.25)',
              boxShadow: 'var(--clay-shadow-sm)',
            }}
          >
            <span style={{ fontSize: '1.2rem', animation: 'spin 2s linear infinite' }}>⚡</span>
            <div>
              <p style={{ margin: 0, fontWeight: 800 }}>Waking up cloud server...</p>
              <p style={{ margin: 0, fontSize: '0.76rem', opacity: 0.85, fontWeight: 500 }}>
                Free-tier cloud hosting goes to sleep after inactivity. Please allow ~15 seconds to connect.
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="explore-hero-card clay-card-flat">
          <div className="hero-content">
            <span className="hero-pill-badge">
              📚 COURSE CATALOG
            </span>
            <h2 className="explore-headline">
              Explore Available Playlists
            </h2>
            <p className="explore-subhead">
              Browse fully transcribed and AI-indexed YouTube lecture series. Pick any course to start instant timestamped revision, smart Q&amp;A, and active recall.
            </p>
          </div>

          {/* Search Bar */}
          <div className="search-bar-wrapper">
            <div className="search-input-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="clay-input search-input"
                placeholder="Search courses by topic or channel (e.g. TOC, Gate Smashers, DSA, AI)..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="filter-chips-row">
            {[
              { id: 'ALL', label: 'All Playlists' },
              { id: 'DSA', label: 'DSA & Algorithms' },
              { id: 'AI', label: 'AI & Data Science' },
              { id: 'CS', label: 'Computer Science (GATE)' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`filter-chip ${activeFilter === f.id ? 'filter-chip-active' : ''}`}
              >
                {f.label}
              </button>
            ))}

            <span className="catalog-count-indicator">
              {isLoading ? (
                'Scanning catalog...'
              ) : (
                `${totalCount.toLocaleString()} course${totalCount !== 1 ? 's' : ''} available`
              )}
            </span>
          </div>
        </section>

        {/* Video / Course Cards Grid (YouTube Style) */}
        <section className="courses-grid-section">
          {isLoading ? (
            /* Skeleton Loading Grid */
            <div className="youtube-courses-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="yt-card-skeleton clay-card-flat">
                  <div className="skeleton-thumb-box" />
                  <div className="skeleton-meta-box">
                    <div className="skeleton-avatar" />
                    <div className="skeleton-lines">
                      <div className="skeleton-line-title" />
                      <div className="skeleton-line-channel" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPlaylists.length > 0 ? (
            <>
              <div className="youtube-courses-grid">
                {filteredPlaylists.map(playlist => {
                  const channel = playlist.channel_title || 'YouTube Channel';
                  const title = playlist.playlist_title || 'Untitled Playlist';
                  const videoCount = playlist.video_count || 0;
                  const chunkCount = playlist.chunk_count || 0;
                  const thumb = playlist.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';

                  // Letter avatar for channel
                  const channelInitial = channel.trim().charAt(0).toUpperCase() || 'Y';

                  return (
                    <div
                      key={playlist.playlist_id}
                      className="yt-course-card clay-card-flat animate-fade-in"
                    >
                      {/* 16:9 YouTube-Style Thumbnail Container */}
                      <div
                        className="yt-thumb-wrapper"
                        onClick={() => handleStartRevising(playlist)}
                        title={`Start revising: ${title}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumb}
                          alt={title}
                          className="yt-thumb-img"
                          loading="lazy"
                        />

                        {/* Dark Gradient Bottom Overlay */}
                        <div className="yt-thumb-gradient" />

                        {/* Playlist Overlay Badge (Bottom-Right) */}
                        <div className="yt-playlist-badge">
                          <span className="badge-icon">📑</span>
                          <span className="badge-text">
                            {videoCount} {videoCount === 1 ? 'VIDEO' : 'VIDEOS'}
                          </span>
                        </div>

                        {/* Hover Play Icon */}
                        <div className="yt-hover-play">
                          <div className="play-circle">
                            ▶
                          </div>
                        </div>

                        {/* Top-Right AI Ready Badge */}
                        {chunkCount > 0 && (
                          <div className="yt-ai-badge">
                            <span>🧠 {chunkCount.toLocaleString()} chunks</span>
                          </div>
                        )}
                      </div>

                      {/* Course Card Body */}
                      <div className="yt-card-body">
                        {/* Channel Row */}
                        <div className="yt-channel-row">
                          <div className="yt-channel-avatar">
                            {channelInitial}
                          </div>
                          <span className="yt-channel-name" title={channel}>
                            {channel}
                          </span>
                          <span className="yt-verified-check" title="Indexed & Transcribed">
                            ✓
                          </span>
                        </div>

                        {/* Course Title */}
                        <h3
                          className="yt-course-title"
                          onClick={() => handleStartRevising(playlist)}
                          title={title}
                        >
                          {title}
                        </h3>

                        {/* Info Chips */}
                        <div className="yt-meta-chips">
                          <span className="meta-chip">
                            📹 {videoCount} Lectures
                          </span>
                          <span className="meta-chip meta-chip-highlight">
                            ⚡ Instant Revision Ready
                          </span>
                        </div>

                        {/* Start Revision CTA Button */}
                        <button
                          onClick={() => handleStartRevising(playlist)}
                          className="clay-button start-revising-cta"
                          title={`Launch ${title} in Study Room`}
                        >
                          <span>Start Revising</span>
                          <span className="cta-arrow">🚀</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Pagination Button */}
              {hasMore && (
                <div className="load-more-section">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="clay-button load-more-btn"
                  >
                    {isLoadingMore ? (
                      <>
                        <span className="spinner-dot" />
                        <span>Loading more playlists...</span>
                      </>
                    ) : (
                      <>
                        <span>Load More Playlists</span>
                        <span>↓</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="empty-courses-state clay-card-flat">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">No playlists found</h3>
              <p className="empty-desc">
                {searchQuery
                  ? `We couldn't find any indexed playlist matching "${searchQuery}".`
                  : 'No playlists are indexed in the catalog yet.'}
              </p>
              <button
                onClick={() => handleOpenRequest(searchQuery)}
                className="clay-button request-cta-btn"
              >
                <span>✨ Request &quot;{searchQuery || 'New Course'}&quot;</span>
              </button>
            </div>
          )}
        </section>

        {/* Request Playlist Callout Banner */}
        <section className="request-banner clay-card-flat">
          <div className="request-banner-content">
            <div className="request-banner-icon">✨</div>
            <div>
              <h3 className="request-banner-title">
                Can&apos;t find your YouTube playlist?
              </h3>
              <p className="request-banner-subtitle">
                Paste any YouTube playlist link and our AI system will automatically transcribe and index it for your study sessions.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenRequest('')}
            className="clay-button request-banner-btn"
          >
            <span>Request Course Now</span>
            <span>→</span>
          </button>
        </section>
      </main>

      {/* Request Playlist Modal */}
      <RequestPlaylistModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        initialSubject={requestSubject}
      />

      <style jsx>{`
        .playlists-page-container {
          min-height: 100vh;
          background: var(--bg-main);
          display: flex;
          flex-direction: column;
          font-family: inherit;
        }

        .site-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 28px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          background: var(--bg-card);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .brand-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: var(--accent-primary);
          box-shadow: var(--clay-shadow-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .brand-title {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .brand-subtitle {
          font-size: 0.76rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 700;
          border-radius: var(--radius-md);
          text-decoration: none;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-home-btn {
          background: var(--bg-input);
        }

        .back-home-btn:hover {
          color: var(--accent-primary);
        }

        .request-btn {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.12) 100%);
          border: 1px solid rgba(99, 102, 241, 0.25);
        }

        .btn-tag {
          font-size: 0.65rem;
          font-weight: 800;
          background: var(--accent-primary);
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 999px;
          letter-spacing: 0.04em;
        }

        .playlists-main-content {
          max-width: 1360px;
          width: 100%;
          margin: 0 auto;
          padding: 28px 24px 60px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Hero Card */
        .explore-hero-card {
          padding: 32px 36px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hero-pill-badge {
          display: inline-block;
          padding: 4px 12px;
          background: var(--accent-primary-surface);
          color: var(--accent-primary);
          font-size: 0.72rem;
          font-weight: 800;
          border-radius: 999px;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .explore-headline {
          font-size: 1.9rem;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: -0.03em;
        }

        .explore-subhead {
          font-size: 0.95rem;
          color: var(--text-secondary);
          max-width: 720px;
          line-height: 1.5;
          margin-top: 6px;
        }

        /* Search input */
        .search-bar-wrapper {
          width: 100%;
          max-width: 820px;
        }

        .search-input-box {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.15rem;
          opacity: 0.6;
        }

        .search-input {
          width: 100%;
          padding: 14px 44px 14px 50px;
          font-size: 0.96rem;
          font-weight: 600;
          border-radius: var(--radius-lg);
          outline: none;
        }

        .search-clear-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1rem;
          color: var(--text-muted);
          cursor: pointer;
        }

        /* Filter chips */
        .filter-chips-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding-top: 4px;
        }

        .filter-chip {
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 999px;
          background: var(--bg-input);
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-chip:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .filter-chip-active {
          background: var(--accent-primary);
          color: #ffffff;
          border-color: var(--accent-primary);
          box-shadow: var(--clay-shadow-accent);
        }

        .catalog-count-indicator {
          margin-left: auto;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        /* YouTube Courses Grid */
        .courses-grid-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .youtube-courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 26px;
        }

        /* YouTube Card */
        .yt-course-card {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: var(--clay-shadow-sm);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .yt-course-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--clay-shadow-md);
        }

        /* 16:9 Thumbnail */
        .yt-thumb-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #181528;
          overflow: hidden;
          cursor: pointer;
        }

        .yt-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .yt-thumb-wrapper:hover .yt-thumb-img {
          transform: scale(1.05);
        }

        .yt-thumb-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%);
          pointer-events: none;
        }

        .yt-playlist-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(18, 14, 28, 0.88);
          backdrop-filter: blur(4px);
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.04em;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .yt-ai-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(99, 102, 241, 0.9);
          backdrop-filter: blur(4px);
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
        }

        .yt-hover-play {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          background: rgba(0, 0, 0, 0.3);
          transition: opacity 0.2s ease;
        }

        .yt-thumb-wrapper:hover .yt-hover-play {
          opacity: 1;
        }

        .play-circle {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: var(--accent-primary);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          padding-left: 3px;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.5);
          transform: scale(0.9);
          transition: transform 0.2s;
        }

        .yt-thumb-wrapper:hover .play-circle {
          transform: scale(1);
        }

        /* Card Body */
        .yt-card-body {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .yt-channel-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .yt-channel-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .yt-channel-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .yt-verified-check {
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 900;
        }

        .yt-course-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          cursor: pointer;
          transition: color 0.2s;
        }

        .yt-course-title:hover {
          color: var(--accent-primary);
        }

        .yt-meta-chips {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 2px;
        }

        .meta-chip {
          font-size: 0.74rem;
          font-weight: 700;
          padding: 3px 8px;
          background: var(--bg-input);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
        }

        .meta-chip-highlight {
          color: var(--accent-primary);
          background: var(--accent-primary-surface);
        }

        /* Start Revising CTA Button */
        .start-revising-cta {
          margin-top: auto;
          width: 100%;
          padding: 10px 16px;
          font-size: 0.88rem;
          font-weight: 800;
          background: var(--accent-primary);
          color: #ffffff;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: var(--clay-shadow-accent);
          cursor: pointer;
          transition: all 0.2s;
        }

        .start-revising-cta:hover {
          opacity: 0.95;
          transform: scale(1.01);
        }

        .cta-arrow {
          transition: transform 0.2s;
        }

        .start-revising-cta:hover .cta-arrow {
          transform: translateX(3px);
        }

        /* Load more */
        .load-more-section {
          display: flex;
          justify-content: center;
          padding: 16px 0 8px;
        }

        .load-more-btn {
          padding: 12px 28px;
          font-size: 0.9rem;
          font-weight: 800;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        /* Empty state */
        .empty-courses-state {
          padding: 48px 32px;
          text-align: center;
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-icon {
          font-size: 40px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .empty-desc {
          font-size: 0.88rem;
          color: var(--text-muted);
          max-width: 440px;
        }

        .request-cta-btn {
          margin-top: 8px;
          padding: 10px 20px;
          font-size: 0.88rem;
          font-weight: 800;
          background: var(--accent-primary);
          color: #ffffff;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        /* Request Banner */
        .request-banner {
          padding: 26px 32px;
          border-radius: var(--radius-xl);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.1) 100%);
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .request-banner-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .request-banner-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: var(--accent-primary);
          box-shadow: var(--clay-shadow-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .request-banner-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .request-banner-subtitle {
          font-size: 0.84rem;
          color: var(--text-secondary);
          margin-top: 3px;
          max-width: 600px;
        }

        .request-banner-btn {
          padding: 10px 22px;
          font-size: 0.88rem;
          font-weight: 800;
          background: var(--accent-primary);
          color: #ffffff;
          border-radius: var(--radius-md);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--clay-shadow-accent);
          white-space: nowrap;
        }

        /* Skeleton */
        .yt-card-skeleton {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-card);
        }

        .skeleton-thumb-box {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: rgba(0, 0, 0, 0.08);
          animation: pulse 1.5s infinite;
        }

        .skeleton-meta-box {
          padding: 16px;
          display: flex;
          gap: 12px;
        }

        .skeleton-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.08);
          animation: pulse 1.5s infinite;
          flex-shrink: 0;
        }

        .skeleton-lines {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-line-title {
          height: 16px;
          width: 80%;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.08);
          animation: pulse 1.5s infinite;
        }

        .skeleton-line-channel {
          height: 12px;
          width: 45%;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.05);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .site-header {
            padding: 12px 16px;
          }

          .btn-label-desktop {
            display: none;
          }

          .btn-label-mobile {
            display: inline;
          }

          .playlists-main-content {
            padding: 16px 14px 40px;
            gap: 18px;
          }

          .explore-hero-card {
            padding: 20px 18px;
          }

          .explore-headline {
            font-size: 1.4rem;
          }

          .youtube-courses-grid {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .request-banner {
            padding: 20px 18px;
            flex-direction: column;
            align-items: flex-start;
          }

          .request-banner-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
