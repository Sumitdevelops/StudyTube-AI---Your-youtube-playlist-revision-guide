'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import PlaylistInput from '@/components/PlaylistInput';
import PlaylistSidebar from '@/components/PlaylistSidebar';
import YouTubePlayer from '@/components/YouTubePlayer';
import SearchBar from '@/components/SearchBar';
import AnswerView from '@/components/AnswerView';
import SourceCards from '@/components/SourceCards';
import { getHealth, getPlaylists, getPlaylist, transcribePlaylist, searchPlaylist } from '@/lib/api';

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

  // Check API health on mount
  useEffect(() => {
    checkHealth();
    loadPlaylists();
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

  // Search handler
  const handleSearch = async (query) => {
    if (!activePlaylistId) return;
    setIsSearching(true);
    setAnswer('');
    setSources([]);
    setActiveSourceIdx(-1);

    try {
      const data = await searchPlaylist(query, activePlaylistId);

      setAnswer(data.answer || '');
      setSources(data.sources || []);

      // Auto-seek to the first source ONLY if real sources exist
      if (data.sources && data.sources.length > 0) {
        const first = data.sources[0];
        setSelectedVideoId(first.video_id);
        setPlayTime(first.timestamp);
        setActiveSourceIdx(0);
        setPlayTrigger(prev => prev + 1);
      } else {
        // Nothing found: clear sources, DO NOT play random videos!
        setActiveSourceIdx(-1);
      }
    } catch (err) {
      setAnswer(`Error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
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

  return (
    <div className="app-container">
      <Header vectorCount={vectorCount} isConnected={isConnected} />

      {/* Playlist Input */}
      <div style={{ marginTop: '24px' }}>
        <PlaylistInput onIngest={handleIngest} isLoading={isIngesting} />

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

      {/* Main Layout Grid */}
      <div className="main-grid">
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
          />

          {/* AI Answer */}
          <AnswerView answer={answer} isLoading={isSearching} />

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
        }}
      >
        Built with 🧠 Groq + ⚡ Vector Search + 🎬 YouTube
      </footer>
    </div>
  );
}
