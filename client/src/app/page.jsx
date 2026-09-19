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
import { getHealth, getPlaylists, getPlaylist, transcribePlaylist, searchPlaylist, searchPlaylistStream } from '@/lib/api';

export default function Home() {
  // App state
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

  // Player state
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [playTime, setPlayTime] = useState(0);

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

  // Check API health and restore cached session on mount
  useEffect(() => {
    let initialTargetPlaylistId = null;

    // 1. Instant Session & URL Query Restore (0ms First Paint)
    if (typeof window !== 'undefined') {
      try {
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
            // Prioritize URL parameter if provided, otherwise use cached session
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

    // 2. Cold-start detector timer (fires if API takes > 2.5s)
    const coldTimer = setTimeout(() => {
      setIsColdStarting(true);
    }, 2500);

    // 3. Network revalidation
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

  const updateRecentPlaylists = (playlist) => {
    if (!playlist || !playlist.playlist_id) return;
    setRecentPlaylists((prev) => {
      const filtered = prev.filter(p => p.playlist_id !== playlist.playlist_id);
      const updated = [
        {
          playlist_id: playlist.playlist_id,
          playlist_title: playlist.playlist_title || playlist.title,
          channel_title: playlist.channel_title || ''
        },
        ...filtered
      ].slice(0, 5);
      if (typeof window !== 'undefined') {
        localStorage.setItem('studytube_recent_playlists', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const loadPlaylists = async (preferredPlaylistId = null) => {
    try {
      const data = await getPlaylists({ page: 1, limit: 20 });
      const fetchedPlaylists = data.playlists || [];
      setPlaylists(fetchedPlaylists);
      setTotalPlaylistsCount(data.total || fetchedPlaylists.length);

      const targetId = preferredPlaylistId || activePlaylistId;

      if (targetId) {
        const found = fetchedPlaylists.find(p => p.playlist_id === targetId);
        if (found) {
          setActivePlaylistTitle(found.playlist_title);
        }
        loadPlaylistVideos(targetId, preferredPlaylistId ? true : false);
      } else if (fetchedPlaylists.length > 0) {
        // Auto-select first playlist if none selected yet
        const first = fetchedPlaylists[0];
        setActivePlaylistId(first.playlist_id);
        setActivePlaylistTitle(first.playlist_title);
        loadPlaylistVideos(first.playlist_id, true);
      }
    } catch {
      // API not ready yet
    }
  };

  const loadPlaylistVideos = async (playlistId, showLoadingSpinner = true) => {
    if (showLoadingSpinner && videos.length === 0) {
      setIsLoadingVideos(true);
    }

    try {
      // Step 1: Progressive Batch 1 - Fetch first 5 lectures instantly
      const firstBatch = await getPlaylist(playlistId, { offset: 0, limit: 5 });
      const initialVideos = firstBatch.videos || [];

      if (initialVideos.length > 0) {
        setVideos(initialVideos);
        if (!selectedVideoId || showLoadingSpinner) {
          setSelectedVideoId(initialVideos[0].video_id);
        }
      }

      setVideoStats({
        loaded: initialVideos.length,
        total: firstBatch.total_videos || initialVideos.length
      });

      setIsLoadingVideos(false);

      // Cache active session
      if (typeof window !== 'undefined') {
        localStorage.setItem('studytube_active_session', JSON.stringify({
          playlist_id: playlistId,
          playlist_title: firstBatch.title,
          selectedVideoId: initialVideos[0]?.video_id,
          total: firstBatch.total_videos,
          videos: initialVideos.slice(0, 5)
        }));
      }

      updateRecentPlaylists({
        playlist_id: playlistId,
        playlist_title: firstBatch.title,
        channel_title: firstBatch.channel_title
      });

      // Step 2: Progressive Batch 2 - Background fetch of remaining lectures
      if (firstBatch.has_more && firstBatch.total_videos > initialVideos.length) {
        setIsLoadingMoreVideos(true);
        const remainingBatch = await getPlaylist(playlistId, {
          offset: initialVideos.length,
          limit: 200
        });
        const allVideos = [...initialVideos, ...(remainingBatch.videos || [])];
        setVideos(allVideos);
        setVideoStats({
          loaded: allVideos.length,
          total: remainingBatch.total_videos || allVideos.length
        });
        setIsLoadingMoreVideos(false);
      }
    } catch (err) {
      console.error('Failed to load playlist videos:', err);
      setIsLoadingVideos(false);
      setIsLoadingMoreVideos(false);
    }
  };

  // Switch playlist handler
  const handleSelectPlaylist = (playlistId) => {
    const pl = playlists.find(p => p.playlist_id === playlistId) || recentPlaylists.find(p => p.playlist_id === playlistId);
    setActivePlaylistId(playlistId);
    if (pl) {
      setActivePlaylistTitle(pl.playlist_title);
    }
    loadPlaylistVideos(playlistId, true);
    setAnswer('');
    setSources([]);
  };

  // Ingest a playlist
  const handleIngest = async (url) => {
    setIsIngesting(true);
    setIngestStatus('Fetching playlist and transcribing videos...');
    setAnswer('');
    setSources([]);

    try {
      const data = await transcribePlaylist(url);

      if (data.success) {
        setActivePlaylistId(data.playlist.playlist_id);
        setActivePlaylistTitle(data.playlist.title);
        setIngestStatus(`✅ Indexed ${data.playlist.video_count} videos (${data.playlist.chunk_count} chunks)`);

        // Reload videos
        await loadPlaylistVideos(data.playlist.playlist_id);
        await loadPlaylists();
        await checkHealth();

        // Set first video
        const vids = data.videos || [];
        if (vids.length > 0) {
          setSelectedVideoId(vids[0].video_id);
        }
      }
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

  // 1-Click Interactive Demo handler from Hero Banner
  const handleTryDemo = async (query, playlistId, playlistTitle) => {
    setActivePlaylistId(playlistId);
    setActivePlaylistTitle(playlistTitle);
    await loadPlaylistVideos(playlistId);
    setAnswer('');
    setSources([]);
    setIsSearching(true);
    setLastQuery(query);
    setActiveSourceIdx(-1);

    let fullAnswerText = '';
    try {
      await searchPlaylistStream(
        query,
        playlistId,
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

    setTimeout(() => {
      const el = document.getElementById('player-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const [playTrigger, setPlayTrigger] = useState(0);

  // Click a source card
  const handleSourceClick = useCallback((source, idx) => {
    setSelectedVideoId(source.video_id);
    setPlayTime(source.timestamp);
    setActiveSourceIdx(idx);
    setPlayTrigger(prev => prev + 1);

    // Auto-scroll up to the video player
    setTimeout(() => {
      const el = document.getElementById('player-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }, []);

  // Click a video in the sidebar
  const handleSelectVideo = useCallback((video) => {
    setSelectedVideoId(video.video_id);
    setPlayTime(0);
    setActiveSourceIdx(-1);
    setPlayTrigger(prev => prev + 1);

    // Auto-scroll up to the video player
    setTimeout(() => {
      const el = document.getElementById('player-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }, []);

  const activePlaylist = playlists.find(p => p.playlist_id === activePlaylistId);
  const activeChannelTitle = activePlaylist?.channel_title || '';

  return (
    <div className="app-container">
      <Header
        vectorCount={vectorCount}
        isConnected={isConnected}
        onRequestPlaylist={() => handleOpenRequestModal('')}
        onOpenAvailablePlaylists={() => setIsAvailableModalOpen(true)}
        playlistCount={totalPlaylistsCount || playlists.length}
      />

      {/* Cloud Server Cold-Start Reassurance Banner */}
      {isColdStarting && (
        <div
          className="clay-card-flat animate-fade-in"
          style={{
            padding: '10px 18px',
            margin: '12px 0 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.84rem',
            color: 'var(--accent-primary)',
            background: 'var(--accent-primary-surface)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            boxShadow: 'var(--clay-shadow-sm)',
            border: '1px solid var(--accent-primary)',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>☕</span>
          <div style={{ flex: 1 }}>
            <strong>Waking up cloud server...</strong>{' '}
            <span style={{ fontWeight: 500, opacity: 0.9 }}>
              Free-tier instances take a few seconds to spin up after inactivity. Your courses will appear in a moment!
            </span>
          </div>
        </div>
      )}

      {/* Hero / Value Proposition Banner */}
      <HeroBanner
        onTryDemo={handleTryDemo}
        onRequestClick={() => handleOpenRequestModal('')}
      />

      {/* Admin-Only Playlist Ingestion Panel */}
      {isAdmin && (
        <div style={{ marginTop: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              padding: '8px 16px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: 'var(--accent-primary)',
              fontWeight: 800,
            }}
          >
            <span>👑 Admin Ingestion Panel (Visible to Admin Only)</span>
            <button
              onClick={handleAdminToggle}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textDecoration: 'underline',
              }}
            >
              Exit Admin
            </button>
          </div>

          <PlaylistInput
            onIngest={handleIngest}
            isLoading={isIngesting}
            onRequestClick={() => handleOpenRequestModal('')}
          />

          {/* Ingestion Status */}
          {ingestStatus && (
            <div
              className="clay-card-flat animate-fade-in"
              style={{
                padding: '14px 22px',
                marginBottom: '20px',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: ingestStatus.startsWith('✅')
                  ? '#1a5e3a'
                  : ingestStatus.startsWith('❌')
                  ? '#c0392b'
                  : 'var(--text-secondary)',
                background: ingestStatus.startsWith('✅')
                  ? 'var(--accent-success-surface)'
                  : ingestStatus.startsWith('❌')
                  ? 'var(--accent-secondary-surface)'
                  : 'var(--bg-card)',
              }}
            >
              {ingestStatus}
            </div>
          )}
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="main-grid" style={{ marginTop: '24px' }}>

        {/* Left: Playlist Sidebar */}
        <aside>
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

        {/* Right: Player + Search + Results */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* YouTube Player */}
          <YouTubePlayer
            videoId={selectedVideoId}
            startTime={playTime}
            videoTitle={
              (videos.find(v => v.video_id === selectedVideoId) || sources.find(s => s.video_id === selectedVideoId))?.title || ''
            }
            playTrigger={playTrigger}
          />

          {/* Search */}
          <SearchBar
            onSearch={handleSearch}
            isLoading={isSearching}
            disabled={!activePlaylistId}
            playlistTitle={activePlaylistTitle}
            channelTitle={activeChannelTitle}
            videos={videos}
          />

          {/* AI Answer */}
          <AnswerView
            answer={answer}
            isLoading={isSearching}
            playlistTitle={activePlaylistTitle}
            channelTitle={activeChannelTitle}
            onRequestPlaylist={handleOpenRequestModal}
            userQuery={lastQuery}
            sources={sources}
            onJumpToCitation={(videoId, timestamp) => {
              if (videoId) setSelectedVideoId(videoId);
              setPlayTime(timestamp);
              setPlayTrigger((prev) => prev + 1);
              setTimeout(() => {
                const el = document.getElementById('player-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 50);
            }}
          />


          {/* Source Cards */}
          <SourceCards
            sources={sources}
            activeSourceIdx={activeSourceIdx}
            onSourceClick={handleSourceClick}
          />
        </main>
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '32px 0 16px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <span>Built with 🧠 Groq + ⚡ Vector Search + 🎬 YouTube</span>
        <span>•</span>
        <button
          onClick={handleAdminToggle}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            opacity: 0.5,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.opacity = 1)}
          onMouseLeave={(e) => (e.target.style.opacity = 0.5)}
        >
          {isAdmin ? '👑 Admin Mode (Logout)' : 'Admin Portal 🔐'}
        </button>
      </footer>


      {/* Available Playlists Modal */}
      <AvailablePlaylistsModal
        isOpen={isAvailableModalOpen}
        onClose={() => setIsAvailableModalOpen(false)}
        playlists={playlists}
        activePlaylistId={activePlaylistId}
        onSelectPlaylist={handleSelectPlaylist}
        onRequestPlaylist={handleOpenRequestModal}
      />

      {/* Request Playlist Modal */}
      <RequestPlaylistModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        initialSubject={requestModalSubject}
      />
    </div>
  );
}

