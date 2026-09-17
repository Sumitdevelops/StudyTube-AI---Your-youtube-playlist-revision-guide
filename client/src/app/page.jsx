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

  // Check API health on mount
  useEffect(() => {
    checkHealth();
    loadPlaylists();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || localStorage.getItem('studytube_admin') === 'true') {
        setIsAdmin(true);
      }
    }
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

  const loadPlaylists = async () => {
    try {
      const data = await getPlaylists();
      setPlaylists(data.playlists || []);

      // Auto-select first playlist
      if (data.playlists?.length > 0 && !activePlaylistId) {
        const first = data.playlists[0];
        setActivePlaylistId(first.playlist_id);
        setActivePlaylistTitle(first.playlist_title);
        loadPlaylistVideos(first.playlist_id);
      }
    } catch {
      // API not ready yet
    }
  };

  const loadPlaylistVideos = async (playlistId) => {
    try {
      const data = await getPlaylist(playlistId);
      setVideos(data.videos || []);
      if (data.videos?.length > 0) {
        setSelectedVideoId(data.videos[0].video_id);
      }
    } catch {
      console.error('Failed to load playlist videos');
    }
  };

  // Switch playlist handler
  const handleSelectPlaylist = (playlistId) => {
    const pl = playlists.find(p => p.playlist_id === playlistId);
    if (!pl) return;
    setActivePlaylistId(pl.playlist_id);
    setActivePlaylistTitle(pl.playlist_title);
    loadPlaylistVideos(pl.playlist_id);
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

    try {
      await searchPlaylistStream(
        query,
        activePlaylistId,
        5,
        (token) => {
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

    try {
      await searchPlaylistStream(
        query,
        playlistId,
        5,
        (token) => {
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
        playlistCount={playlists.length}
      />

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

