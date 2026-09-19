'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import PlaylistInput from '@/components/PlaylistInput';
import PlaylistSidebar from '@/components/PlaylistSidebar';
import YouTubePlayer from '@/components/YouTubePlayer';
import SearchBar from '@/components/SearchBar';
import AnswerView from '@/components/AnswerView';
import SourceCards from '@/components/SourceCards';
import RequestPlaylistModal from '@/components/RequestPlaylistModal';
import AvailablePlaylistsModal from '@/components/AvailablePlaylistsModal';
import HeroBanner from '@/components/HeroBanner';
import { getHealth, getPlaylists, getPlaylist, transcribePlaylist, searchPlaylistStream, initKeepAliveHeartbeat } from '@/lib/api';

export default function Home() {
  // App & Theme state
  const [theme, setTheme] = useState('light');
  const [isConnected, setIsConnected] = useState(false);
  const [vectorCount, setVectorCount] = useState(0);

  // Playlist state
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [activePlaylistTitle, setActivePlaylistTitle] = useState('');
  const [videos, setVideos] = useState([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');

  // Performance & Progressive Loading State
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [isLoadingMoreVideos, setIsLoadingMoreVideos] = useState(false);
  const [videoStats, setVideoStats] = useState({ loaded: 0, total: 0 });
  const [totalPlaylistsCount, setTotalPlaylistsCount] = useState(0);
  const [recentPlaylists, setRecentPlaylists] = useState([]);
  const [isColdStarting, setIsColdStarting] = useState(false);

  // Mobile Companion State
  const [mobileTab, setMobileTab] = useState('doubts'); // 'doubts' | 'lectures' | 'notes'
  const [mobileFloatingQuery, setMobileFloatingQuery] = useState('');

  // Player state
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [playTime, setPlayTime] = useState(0);
  const [playTrigger, setPlayTrigger] = useState(0);

  // Search state
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [activeSourceIdx, setActiveSourceIdx] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAvailableModalOpen, setIsAvailableModalOpen] = useState(false);
  const [requestModalSubject, setRequestModalSubject] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleOpenRequestModal = (initialSubject = '') => {
    setRequestModalSubject(initialSubject || '');
    setIsRequestModalOpen(true);
  };

  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      localStorage.removeItem('studytube_admin');
    } else {
      const pass = window.prompt('Enter Admin Passcode:');
      if (pass === 'admin' || pass === 'admin123') {
        setIsAdmin(true);
        localStorage.setItem('studytube_admin', 'true');
      } else if (pass !== null) {
        alert('Incorrect admin passcode.');
      }
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('studytube_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
  };

  // Restore Theme, Session, and URL parameters on mount
  useEffect(() => {
    let initialTargetPlaylistId = null;

    if (typeof window !== 'undefined') {
      try {
        // Theme initialization
        const savedTheme = localStorage.getItem('studytube_theme');
        if (savedTheme) {
          setTheme(savedTheme);
          document.documentElement.setAttribute('data-theme', savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        }

        // Instant Session & URL Query Restore (0ms First Paint)
        const params = new URLSearchParams(window.location.search);
        const urlPlaylist = params.get('playlist');
        if (urlPlaylist) {
          initialTargetPlaylistId = urlPlaylist;
          setActivePlaylistId(urlPlaylist);
        }

        const cachedSession = localStorage.getItem('studytube_active_session');
        if (cachedSession) {
          const parsed = JSON.parse(cachedSession);
          if (parsed && parsed.playlist_id) {
            if (!initialTargetPlaylistId || initialTargetPlaylistId === parsed.playlist_id) {
              setActivePlaylistId(parsed.playlist_id);
              setActivePlaylistTitle(parsed.playlist_title || '');
              if (parsed.videos && parsed.videos.length > 0) {
                setVideos(parsed.videos);
                setSelectedVideoId(parsed.selectedVideoId || parsed.videos[0].video_id);
                setVideoStats({
                  loaded: parsed.videos.length,
                  total: parsed.total || parsed.videos.length
                });
              }
            }
          }
        }

        const cachedRecent = localStorage.getItem('studytube_recent_playlists');
        if (cachedRecent) {
          setRecentPlaylists(JSON.parse(cachedRecent));
        }

        if (params.get('admin') === 'true' || localStorage.getItem('studytube_admin') === 'true') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.warn('Error restoring session from localStorage:', e);
      }
    }

    // Cold-start detector timer
    const coldTimer = setTimeout(() => {
      setIsColdStarting(true);
    }, 2500);

    // Keep-alive heartbeat & initial fetch
    initKeepAliveHeartbeat();
    checkHealth();
    loadPlaylists(initialTargetPlaylistId).finally(() => {
      clearTimeout(coldTimer);
      setIsColdStarting(false);
    });
  }, []);

  const checkHealth = async () => {
    try {
      const data = await getHealth();
      setIsConnected(true);
      setVectorCount(data.config?.vectorCount || 0);
    } catch {
      setIsConnected(false);
    }
  };

  // Load available playlists from backend
  const loadPlaylists = async (preferredPlaylistId = null) => {
    try {
      const data = await getPlaylists({ page: 1, limit: 100 });
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.playlists)) {
        list = data.playlists;
        setTotalPlaylistsCount(data.total || list.length);
      }
      setPlaylists(list);

      const targetId = preferredPlaylistId || activePlaylistId;
      if (list.length > 0) {
        const found = list.find((p) => p.playlist_id === targetId);
        if (found) {
          setActivePlaylistTitle(found.playlist_title);
          if (!videos || videos.length === 0 || preferredPlaylistId) {
            loadPlaylistVideos(found.playlist_id);
          }
        } else if (!activePlaylistId) {
          setActivePlaylistId(list[0].playlist_id);
          setActivePlaylistTitle(list[0].playlist_title);
          loadPlaylistVideos(list[0].playlist_id);
        }
      }
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  };

  // Progressive Video Loading
  const loadPlaylistVideos = async (playlistId) => {
    setIsLoadingVideos(true);
    try {
      const initialData = await getPlaylist(playlistId, { offset: 0, limit: 10 });
      const initialVideos = initialData.videos || [];
      const totalCount = initialData.total_videos || initialVideos.length;

      setVideos(initialVideos);
      setVideoStats({ loaded: initialVideos.length, total: totalCount });

      if (initialVideos.length > 0 && !selectedVideoId) {
        setSelectedVideoId(initialVideos[0].video_id);
      }

      // Cache session in localStorage
      if (typeof window !== 'undefined') {
        const sessionPayload = {
          playlist_id: playlistId,
          playlist_title: activePlaylistTitle,
          videos: initialVideos,
          selectedVideoId: initialVideos[0]?.video_id || null,
          total: totalCount
        };
        localStorage.setItem('studytube_active_session', JSON.stringify(sessionPayload));

        // Add to recent courses
        const currentRecent = JSON.parse(localStorage.getItem('studytube_recent_playlists') || '[]');
        const updatedRecent = [
          { playlist_id: playlistId, playlist_title: activePlaylistTitle },
          ...currentRecent.filter(r => r.playlist_id !== playlistId)
        ].slice(0, 5);
        setRecentPlaylists(updatedRecent);
        localStorage.setItem('studytube_recent_playlists', JSON.stringify(updatedRecent));
      }

      setIsLoadingVideos(false);

      // Stream remaining videos in background
      if (initialData.has_more) {
        setIsLoadingMoreVideos(true);
        const fullData = await getPlaylist(playlistId, { offset: 10, limit: 1000 });
        const allVideos = [...initialVideos, ...(fullData.videos || [])];
        setVideos(allVideos);
        setVideoStats({ loaded: allVideos.length, total: fullData.total_videos || allVideos.length });

        if (typeof window !== 'undefined') {
          const sessionPayload = {
            playlist_id: playlistId,
            playlist_title: activePlaylistTitle,
            videos: allVideos,
            selectedVideoId: selectedVideoId || allVideos[0]?.video_id,
            total: fullData.total_videos || allVideos.length
          };
          localStorage.setItem('studytube_active_session', JSON.stringify(sessionPayload));
        }
        setIsLoadingMoreVideos(false);
      }
    } catch (err) {
      console.error('Error fetching playlist details:', err);
      setIsLoadingVideos(false);
      setIsLoadingMoreVideos(false);
    }
  };

  const handleSelectPlaylist = (id) => {
    setActivePlaylistId(id);
    const chosen = playlists.find((p) => p.playlist_id === id);
    if (chosen) {
      setActivePlaylistTitle(chosen.playlist_title);
    }
    setAnswer('');
    setSources([]);
    loadPlaylistVideos(id);
  };

  const handleIngest = async (url) => {
    setIsIngesting(true);
    setIngestStatus('Analyzing and indexing YouTube playlist into Qdrant...');
    try {
      const res = await transcribePlaylist(url);
      setIngestStatus(`✅ Successfully indexed! Processed ${res.videos_processed} videos into ${res.total_chunks} vector chunks.`);
      await loadPlaylists(res.playlist_id);
      checkHealth();
    } catch (err) {
      setIngestStatus(`❌ Error: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // Search handler with real-time SSE streaming
  const handleSearch = async (query) => {
    if (!activePlaylistId) return;
    setLastQuery(query);
    setIsSearching(true);
    setAnswer('');
    setSources([]);
    setActiveSourceIdx(-1);
    setMobileTab('doubts'); // Ensure mobile view displays the answer

    let fullAnswerText = '';
    try {
      await searchPlaylistStream(
        query,
        activePlaylistId,
        5,
        (token) => {
          fullAnswerText += token;
          setAnswer((prev) => prev + token);
        },
        (newSources) => {
          setSources(newSources || []);
          if (newSources && newSources.length > 0) {
            const first = newSources[0];
            setSelectedVideoId(first.video_id);
            setPlayTime(first.timestamp);
            setActiveSourceIdx(0);
            setPlayTrigger((prev) => prev + 1);
          } else {
            setActiveSourceIdx(-1);
          }
        }
      );

      const ansLower = fullAnswerText.toLowerCase();
      if (
        ansLower.includes('not covered') ||
        ansLower.includes('not appear to be a standard technical term') ||
        ansLower.includes('transcription error') ||
        ansLower.includes('request this playlist')
      ) {
        setSources([]);
        setActiveSourceIdx(-1);
      }
    } catch (err) {
      setAnswer(`Error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTryDemo = async (query, playlistId, playlistTitle) => {
    setActivePlaylistId(playlistId);
    setActivePlaylistTitle(playlistTitle);
    await loadPlaylistVideos(playlistId);
    handleSearch(query);

    setTimeout(() => {
      const el = document.getElementById('player-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleSourceClick = useCallback((source, idx) => {
    setSelectedVideoId(source.video_id);
    setPlayTime(source.timestamp);
    setActiveSourceIdx(idx);
    setPlayTrigger(prev => prev + 1);

    setTimeout(() => {
      const el = document.getElementById('player-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }, []);

  const handleSelectVideo = useCallback((video) => {
    setSelectedVideoId(video.video_id);
    setPlayTime(0);
    setActiveSourceIdx(-1);
    setPlayTrigger(prev => prev + 1);

    setTimeout(() => {
      const el = document.getElementById('player-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }, []);

  const activePlaylist = playlists.find(p => p.playlist_id === activePlaylistId);
  const activeChannelTitle = activePlaylist?.channel_title || '';
  const currentVideoTitle = (videos.find(v => v.video_id === selectedVideoId) || sources.find(s => s.video_id === selectedVideoId))?.title || '';

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        vectorCount={vectorCount}
        isConnected={isConnected}
        onRequestPlaylist={() => handleOpenRequestModal('')}
        playlistCount={totalPlaylistsCount || playlists.length}
        activePlaylistTitle={activePlaylistTitle}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Cloud Server Cold-Start Reassurance Banner */}
      {isColdStarting && (
        <div className="stitch-card cold-start-banner animate-fade-in">
          <span style={{ fontSize: '1.25rem' }}>☕</span>
          <div style={{ flex: 1 }}>
            <strong>Waking up cloud backend...</strong>{' '}
            <span style={{ opacity: 0.85 }}>
              Free-tier instances take a few seconds to spin up. Your courses will appear in a moment!
            </span>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <HeroBanner
        onTryDemo={handleTryDemo}
        onRequestClick={() => handleOpenRequestModal('')}
      />

      {/* Admin Panel */}
      {isAdmin && (
        <div style={{ marginTop: '20px' }}>
          <div className="admin-status-bar">
            <span>👑 Admin Ingestion Panel (Visible to Admin Only)</span>
            <button onClick={handleAdminToggle} className="exit-admin-btn">
              Exit Admin
            </button>
          </div>
          <PlaylistInput
            onIngest={handleIngest}
            isLoading={isIngesting}
            onRequestClick={() => handleOpenRequestModal('')}
          />
          {ingestStatus && (
            <div className="ingest-status-box animate-fade-in">
              {ingestStatus}
            </div>
          )}
        </div>
      )}

      {/* Mobile Top Video Player (Always pinned above tabs on small viewports) */}
      <div className="mobile-player-container hide-desktop">
        <YouTubePlayer
          videoId={selectedVideoId}
          startTime={playTime}
          videoTitle={currentVideoTitle}
          channelTitle={activeChannelTitle}
          playTrigger={playTrigger}
        />
      </div>

      {/* Mobile 3-Tab Segmented Switcher */}
      <div className="mobile-segmented-wrapper hide-desktop">
        <div className="segmented-control">
          <button
            onClick={() => setMobileTab('doubts')}
            className={`segmented-pill ${mobileTab === 'doubts' ? 'active' : ''}`}
          >
            <span>🤖 AI Doubts</span>
          </button>
          <button
            onClick={() => setMobileTab('lectures')}
            className={`segmented-pill ${mobileTab === 'lectures' ? 'active' : ''}`}
          >
            <span>📚 Lectures ({videos.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('notes')}
            className={`segmented-pill ${mobileTab === 'notes' ? 'active' : ''}`}
          >
            <span>📝 Formulas</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="main-grid">
        {/* Left: Playlist Sidebar (Always visible on Desktop; visible under 'lectures' tab on mobile) */}
        <aside className={`desktop-sidebar ${mobileTab !== 'lectures' ? 'hide-mobile' : ''}`}>
          <PlaylistSidebar
            videos={videos}
            selectedVideoId={selectedVideoId}
            onSelectVideo={handleSelectVideo}
            playlistTitle={activePlaylistTitle}
            playlists={playlists}
            activePlaylistId={activePlaylistId}
            onSelectPlaylist={handleSelectPlaylist}
            isLoadingVideos={isLoadingVideos}
            isLoadingMoreVideos={isLoadingMoreVideos}
            videoStats={videoStats}
            recentPlaylists={recentPlaylists}
            onOpenBrowsePlaylists={() => setIsAvailableModalOpen(true)}
          />
        </aside>

        {/* Right: Main Stage */}
        <main className={`stage-main ${mobileTab === 'lectures' ? 'hide-mobile' : ''}`}>
          {/* Desktop Player (Hidden on mobile because mobile uses the top player) */}
          <div className="desktop-player-container hide-mobile">
            <YouTubePlayer
              videoId={selectedVideoId}
              startTime={playTime}
              videoTitle={currentVideoTitle}
              channelTitle={activeChannelTitle}
              playTrigger={playTrigger}
            />
          </div>

          {/* AI Doubt Solver View (Visible under 'doubts' tab or on desktop) */}
          {(mobileTab === 'doubts' || typeof window === 'undefined') && (
            <div className="doubts-view-group">
              {/* Search Bar */}
              <SearchBar
                onSearch={handleSearch}
                isLoading={isSearching}
                disabled={!activePlaylistId}
                playlistTitle={activePlaylistTitle}
                channelTitle={activeChannelTitle}
                videos={videos}
              />

              {/* AI Answer Card */}
              <AnswerView
                answer={answer}
                isLoading={isSearching}
                playlistTitle={activePlaylistTitle}
                channelTitle={activeChannelTitle}
                onRequestPlaylist={handleOpenRequestModal}
                userQuery={lastQuery}
                sources={sources}
                onJumpToCitation={(vId, ts) => {
                  if (vId) setSelectedVideoId(vId);
                  setPlayTime(ts);
                  setPlayTrigger((prev) => prev + 1);
                  setTimeout(() => {
                    const el = document.getElementById('player-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 50);
                }}
              />

              {/* Video Sources with exact timestamp tags */}
              <SourceCards
                sources={sources}
                activeSourceIdx={activeSourceIdx}
                onSourceClick={handleSourceClick}
              />
            </div>
          )}

          {/* Formulas & Exam Notes Tab (Mobile Tab 3) */}
          {mobileTab === 'notes' && (
            <div className="stitch-card notes-container animate-fade-in hide-desktop">
              <div className="notes-header">
                <span style={{ fontSize: '20px' }}>📝</span>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                    High-Yield Exam Formulas & Notes
                  </h3>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Core theoretical bounds and GATE / syllabus summaries
                  </p>
                </div>
              </div>

              <div className="formula-card">
                <span className="formula-tag">THEORETICAL BOUND [CRUCIAL]</span>
                <p style={{ fontFamily: 'monospace', fontWeight: 700, margin: '6px 0', fontSize: '0.92rem' }}>
                  |Q_DFA| ≤ 2^|Q_NFA| &nbsp;|&nbsp; Practical: |Q_reachable| ≪ 2^|Q_NFA|
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Tip: In 95% of exam problems, unreachable subset states are omitted prior to minimization.
                </p>
              </div>

              <div className="formula-card" style={{ borderLeftColor: 'var(--accent-secondary)' }}>
                <span className="formula-tag" style={{ color: 'var(--accent-secondary)' }}>CLOSURE PROPERTIES</span>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Regular languages are closed under: <b>Union, Intersection, Concatenation, Kleene Star, Complement</b>.
                </p>
              </div>

              <button
                onClick={() => setMobileTab('doubts')}
                className="clay-button-primary"
                style={{ width: '100%', marginTop: '8px', fontSize: '0.85rem' }}
              >
                Ask a Doubt About This →
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Floating Bottom Prompt Bar */}
      <div className="floating-mobile-bar hide-desktop">
        <input
          type="text"
          placeholder="Ask any doubt from this lecture..."
          value={mobileFloatingQuery}
          onChange={(e) => setMobileFloatingQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && mobileFloatingQuery.trim()) {
              handleSearch(mobileFloatingQuery.trim());
              setMobileFloatingQuery('');
            }
          }}
          className="floating-mobile-input"
        />
        <button
          onClick={() => {
            if (mobileFloatingQuery.trim()) {
              handleSearch(mobileFloatingQuery.trim());
              setMobileFloatingQuery('');
            }
          }}
          className="floating-send-btn"
          title="Submit doubt"
          aria-label="Submit doubt"
        >
          ↑
        </button>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <span>StudyTube AI • Built with 🧠 Groq + ⚡ Qdrant Vector DB + 🎬 YouTube</span>
        <span>•</span>
        <button onClick={handleAdminToggle} className="admin-link-btn">
          {isAdmin ? '👑 Admin Mode (Logout)' : 'Admin Portal 🔐'}
        </button>
      </footer>

      {/* Modals */}
      <AvailablePlaylistsModal
        isOpen={isAvailableModalOpen}
        onClose={() => setIsAvailableModalOpen(false)}
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onSelectPlaylist={handleSelectPlaylist}
        onRequestPlaylist={handleOpenRequestModal}
      />

      <RequestPlaylistModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        initialSubject={requestModalSubject}
      />

      <style jsx>{`
        .cold-start-banner {
          padding: 10px 18px;
          margin: 10px 0 6px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.82rem;
          color: var(--accent-primary);
          background: var(--accent-primary-surface);
          border-color: var(--accent-primary-border);
          font-weight: 600;
        }

        .admin-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 6px 14px;
          background: var(--accent-primary-surface);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          color: var(--accent-primary);
          font-weight: 800;
        }

        .exit-admin-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.78rem;
          text-decoration: underline;
        }

        .ingest-status-box {
          padding: 12px 18px;
          margin-bottom: 16px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 600;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
        }

        .mobile-player-container {
          margin-top: 10px;
        }

        .mobile-segmented-wrapper {
          margin: 10px 0 4px;
        }

        .stage-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .doubts-view-group {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .notes-container {
          padding: 18px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notes-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 10px;
        }

        .formula-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--accent-primary);
          letter-spacing: 0.05em;
        }

        .site-footer {
          text-align: center;
          padding: 30px 0 16px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .admin-link-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.76rem;
          opacity: 0.6;
        }
        .admin-link-btn:hover {
          opacity: 1;
        }

        .hide-desktop {
          display: none;
        }

        @media (max-width: 1024px) {
          .hide-desktop {
            display: flex;
          }
          .mobile-segmented-wrapper.hide-desktop {
            display: block;
          }
          .hide-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
