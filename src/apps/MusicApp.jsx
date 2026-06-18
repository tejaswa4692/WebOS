import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ListMusic, Music, Search, Heart, RefreshCw, BarChart2, Plus, Trash2 } from 'lucide-react';

const TRACKS = [
  {
    id: 'synth',
    title: 'Cosmic Pulse (Web Synthesizer)',
    artist: 'Web Audio Engine',
    album: 'Browser Synthesizer',
    duration: 9999, // Infinite synth play
    url: 'synth',
    cover: '/album_cyber.jpg',
    colors: ['#a855f7', '#0066ff'],
    genre: 'Algorithmic'
  }
];

export default function MusicApp() {
  const [playlist, setPlaylist] = useState(TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([...TRACKS]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQueue, setShowQueue] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // browse, visualizer, library, music-folder
  const [likedSongs, setLikedSongs] = useState([1]);
  const [visualizerMode, setVisualizerMode] = useState('bars'); // bars, wave, particles
  const [localMusicFiles, setLocalMusicFiles] = useState(() => {
    const saved = localStorage.getItem('epic_os_local_music');
    return saved ? JSON.parse(saved) : [];
  });

  const audioRef = useRef(null);
  const synthIntervalRef = useRef(null);
  const synthNodesRef = useRef([]);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Web Audio Analyser setup
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const requestRef = useRef(null);

  const currentTrack = queue[currentTrackIndex] || TRACKS[0];

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = 'anonymous';
    
    const handleTimeUpdate = () => {
      if (currentTrack.url !== 'synth') {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const handleEnded = () => {
      handleNext();
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
      stopSynth();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [queue]);

  // Load music folder on mount
  useEffect(() => {
    const loadMusicFolder = async () => {
      try {
        const response = await fetch('/music/manifest.json');
        if (response.ok) {
          const manifest = await response.json();
          if (manifest.tracks && Array.isArray(manifest.tracks)) {
            setLocalMusicFiles(manifest.tracks);
            localStorage.setItem('epic_os_local_music', JSON.stringify(manifest.tracks));
          }
        }
      } catch (err) {
        console.log('Music folder manifest not found, using empty list');
        setLocalMusicFiles([]);
      }
    };

    loadMusicFolder();
  }, []);

  // Handle source changes
  useEffect(() => {
    if (!audioRef.current) return;

    const wasPlaying = isPlaying;
    stopSynth();
    audioRef.current.pause();

    if (currentTrack.url === 'synth') {
      setCurrentTime(0);
      if (wasPlaying) {
        startSynth();
      }
    } else {
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
      audioRef.current.volume = isMuted ? 0 : volume;
      
      if (wasPlaying) {
        audioRef.current.play().catch(e => console.log('Audio playback block:', e));
      }
    }
  }, [currentTrackIndex]);

  // Volume control
  useEffect(() => {
    if (audioRef.current && currentTrack.url !== 'synth') {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, currentTrackIndex]);

  // Toggle Play
  const togglePlay = () => {
    if (isPlaying) {
      if (currentTrack.url === 'synth') {
        stopSynth();
      } else {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (currentTrack.url === 'synth') {
        startSynth();
      } else {
        // Setup Web Audio nodes on first play interaction
        setupWebAudio();
        audioRef.current.play().catch(e => console.log('Audio playback block:', e));
      }
    }
  };

  const setupWebAudio = () => {
    if (audioCtxRef.current || currentTrack.url === 'synth') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;
    } catch (e) {
      console.warn('Web Audio API setup failed (possibly security restriction or already setup):', e);
    }
  };

  // Procedural Retro Synthesizer
  const startSynth = () => {
    stopSynth();
    
    // Set up context
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      analyser.connect(ctx.destination);

      const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C Major scale
      const chordProgression = [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [349.23, 440.00, 523.25, 329.63], // Fmaj7
        [293.66, 349.23, 440.00, 587.33], // Dmin7
        [392.00, 493.88, 587.33, 659.25]  // G7
      ];
      
      let step = 0;

      const playSynthStep = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        
        const time = audioCtxRef.current.currentTime;
        setCurrentTime((prev) => prev + 0.4);

        // Play chord arp
        const chord = chordProgression[Math.floor(step / 8) % chordProgression.length];
        const note = chord[step % chord.length];

        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        // Wave type shifting
        const types = ['sawtooth', 'triangle', 'sine', 'square'];
        osc.type = types[Math.floor(step / 16) % types.length];
        osc.frequency.setValueAtTime(note, time);

        // Filter Node for warmer retro synth sound
        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600 + Math.sin(time) * 300, time);

        gain.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(analyser);

        osc.start(time);
        osc.stop(time + 0.4);

        // Add to active node queue
        synthNodesRef.current.push({ osc, gain });
        step++;
      };

      // Interval for note triggering
      playSynthStep();
      synthIntervalRef.current = setInterval(playSynthStep, 400);

    } catch (e) {
      console.error('Synthesizer initialization error:', e);
    }
  };

  const stopSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    
    // Stop active synth oscillators
    synthNodesRef.current.forEach(({ osc }) => {
      try { osc.stop(); } catch (e) {}
    });
    synthNodesRef.current = [];
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % queue.length);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + queue.length) % queue.length);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (currentTrack.url !== 'synth') {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleLike = (trackId) => {
    if (likedSongs.includes(trackId)) {
      setLikedSongs(likedSongs.filter(id => id !== trackId));
    } else {
      setLikedSongs([...likedSongs, trackId]);
    }
  };

  // Music Folder handlers - loads from /music directory
  const [newFilename, setNewFilename] = useState('');

  const addMusicFile = () => {
    if (!newFilename.trim()) return;
    
    const filename = newFilename.trim();
    const name = filename.replace(/\.[^/.]+$/, '');
    
    const newTrack = {
      id: `music-${filename}`,
      title: name,
      artist: 'From Music Folder',
      album: 'Local Collection',
      duration: 0,
      url: `/music/${filename}`,
      cover: '/album_cyber.jpg',
      colors: ['#a855f7', '#0066ff'],
      genre: 'Local'
    };
    
    if (!localMusicFiles.find(f => f.id === newTrack.id)) {
      const updated = [...localMusicFiles, newTrack];
      setLocalMusicFiles(updated);
      localStorage.setItem('epic_os_local_music', JSON.stringify(updated));
      setNewFilename('');
    }
  };

  const removeLocalFile = (trackId) => {
    const updated = localMusicFiles.filter(f => f.id !== trackId);
    setLocalMusicFiles(updated);
    localStorage.setItem('epic_os_local_music', JSON.stringify(updated));
  };

  const playLocalFile = (trackId) => {
    const fileIndex = localMusicFiles.findIndex(f => f.id === trackId);
    if (fileIndex !== -1) {
      setQueue(localMusicFiles);
      setCurrentTrackIndex(fileIndex);
      setIsPlaying(true);
    }
  };

  // Canvas visualizer rendering loop
  useEffect(() => {
    if (activeTab !== 'visualizer' || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Resize handler
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId;
    let particles = [];
    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;
      
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Mock visualizer animation if not playing
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = isPlaying 
            ? Math.floor(Math.random() * 50) + 50 
            : Math.max(0, (dataArray[i] || 0) * 0.95 + (Math.sin(Date.now() * 0.003 + i * 0.2) * 5 + 5));
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Gradient background
      const accentColor = currentTrack.colors[0];
      const secondColor = currentTrack.colors[1] || '#000000';

      if (visualizerMode === 'bars') {
        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = percent * height * 0.7;

          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, `${accentColor}11`);
          gradient.addColorStop(0.5, `${accentColor}cc`);
          gradient.addColorStop(1, secondColor);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          x += barWidth;
        }
      } else if (visualizerMode === 'wave') {
        ctx.beginPath();
        ctx.lineWidth = 3;
        
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, accentColor);
        gradient.addColorStop(1, secondColor);
        ctx.strokeStyle = gradient;

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const y = height / 2 + (percent - 0.5) * height * 0.6;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (visualizerMode === 'particles') {
        // Spawn particle based on frequency strength
        const avgFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        if (avgFreq > 40 && particles.length < 150) {
          particles.push({
            x: width / 2,
            y: height / 2,
            vx: (Math.random() - 0.5) * (avgFreq * 0.08),
            vy: (Math.random() - 0.5) * (avgFreq * 0.08),
            size: Math.random() * (avgFreq * 0.15) + 2,
            color: Math.random() > 0.5 ? accentColor : secondColor,
            alpha: 1
          });
        }

        particles.forEach((p, idx) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.01;
          
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.alpha <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            particles.splice(idx, 1);
          }
        });
        ctx.globalAlpha = 1;

        // Draw pulsating center sphere
        const pulse = 50 + (avgFreq * 0.5);
        const grad = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, pulse);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, accentColor);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(width/2, height/2, pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [activeTab, isPlaying, visualizerMode, currentTrackIndex]);

  // Queue Operations
  const addToQueue = (track) => {
    setQueue([...queue, { ...track, id: Date.now() }]);
  };

  const removeFromQueue = (idx) => {
    if (queue.length <= 1) return;
    const newQueue = queue.filter((_, i) => i !== idx);
    setQueue(newQueue);
    if (currentTrackIndex >= newQueue.length) {
      setCurrentTrackIndex(newQueue.length - 1);
    }
  };

  const playNow = (track) => {
    const newQueue = [...queue];
    newQueue.splice(currentTrackIndex + 1, 0, { ...track, id: Date.now() });
    setQueue(newQueue);
    setCurrentTrackIndex(currentTrackIndex + 1);
    setIsPlaying(true);
    setupWebAudio();
  };

  // Formatting helpers
  const formatTime = (secs) => {
    if (secs === 9999) return 'Live';
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Dynamic gradient computed from album cover colors
  const activeGradient = `linear-gradient(135deg, ${currentTrack.colors[0]}44 0%, ${currentTrack.colors[1]}11 100%)`;

  const filteredPlaylist = playlist.filter(track => 
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ ...styles.container, backgroundImage: activeGradient }}>
      {/* Player Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <Music size={20} color="var(--accent)" />
          <span>SoundWave</span>
        </div>

        <div style={styles.menuGroup}>
          <div style={styles.menuHeader}>Menu</div>
          <button 
            onClick={() => setActiveTab('browse')} 
            style={{ ...styles.menuBtn, ...(activeTab === 'browse' ? styles.menuBtnActive : {}) }}
          >
            <Search size={16} /> Browse
          </button>
          <button 
            onClick={() => setActiveTab('library')} 
            style={{ ...styles.menuBtn, ...(activeTab === 'library' ? styles.menuBtnActive : {}) }}
          >
            <Heart size={16} /> Your Library
          </button>
          <button 
            onClick={() => setActiveTab('music-folder')} 
            style={{ ...styles.menuBtn, ...(activeTab === 'music-folder' ? styles.menuBtnActive : {}) }}
          >
            <Music size={16} /> Music Folder
          </button>
          <button 
            onClick={() => setActiveTab('visualizer')} 
            style={{ ...styles.menuBtn, ...(activeTab === 'visualizer' ? styles.menuBtnActive : {}) }}
          >
            <BarChart2 size={16} /> Visualizer
          </button>
        </div>

        {/* Small Active Cover Art */}
        <div style={styles.sidebarCoverCard}>
          <img src={currentTrack.cover} alt={currentTrack.title} style={styles.sidebarCoverImg} />
          <div style={styles.sidebarCoverMeta}>
            <div style={styles.sidebarCoverTitle} className="text-truncate">{currentTrack.title}</div>
            <div style={styles.sidebarCoverArtist} className="text-truncate">{currentTrack.artist}</div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div style={styles.mainPanel}>
        {/* Top Navbar */}
        <div style={styles.navbar}>
          <div style={styles.searchBarContainer}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search tracks, artists, genres..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <button 
            onClick={() => setShowQueue(!showQueue)} 
            style={{ ...styles.queueToggleBtn, ...(showQueue ? styles.queueToggleBtnActive : {}) }}
          >
            <ListMusic size={16} />
            Queue ({queue.length})
          </button>
        </div>

        {/* Dynamic Inner views */}
        <div style={styles.viewContent}>
          {activeTab === 'browse' && (
            <div style={styles.browseTab} className="fade-in">
              <h2 style={styles.sectionTitle}>Discover Sounds</h2>
              
              <div style={styles.trackListHeader}>
                <div style={styles.hdrColIndex}>#</div>
                <div style={styles.hdrColTitle}>Title</div>
                <div style={styles.hdrColAlbum}>Album</div>
                <div style={styles.hdrColDuration}>Time</div>
                <div style={styles.hdrColActions}></div>
              </div>

              <div style={styles.trackList}>
                {filteredPlaylist.map((track, index) => {
                  const isCurrent = currentTrack.title === track.title;
                  return (
                    <div 
                      key={track.id} 
                      className="track-row"
                      style={{ ...styles.trackRow, ...(isCurrent ? styles.trackRowActive : {}) }}
                      onDoubleClick={() => {
                        const newQueue = [...TRACKS];
                        setQueue(newQueue);
                        setCurrentTrackIndex(index);
                        setIsPlaying(true);
                      }}
                    >
                      <div style={styles.colIndex}>
                        {isCurrent && isPlaying ? (
                          <div style={styles.equalizerWaves}>
                            <span style={styles.eqWave1}></span>
                            <span style={styles.eqWave2}></span>
                            <span style={styles.eqWave3}></span>
                          </div>
                        ) : index + 1}
                      </div>
                      
                      <div style={styles.colTitle}>
                        <img src={track.cover} style={styles.trackRowCover} alt="" />
                        <div style={styles.titleMeta}>
                          <div style={styles.trackTitleText}>{track.title}</div>
                          <div style={styles.trackArtistText}>{track.artist}</div>
                        </div>
                      </div>
                      
                      <div style={styles.colAlbum}>{track.album}</div>
                      <div style={styles.colDuration}>{formatTime(track.duration)}</div>
                      
                      <div style={styles.colActions}>
                        <button 
                          onClick={() => toggleLike(track.id)}
                          className="action-icon-btn"
                          style={styles.actionIconBtn}
                        >
                          <Heart size={14} color={likedSongs.includes(track.id) ? 'var(--accent)' : 'var(--text-secondary)'} fill={likedSongs.includes(track.id) ? 'var(--accent)' : 'transparent'} />
                        </button>
                        <button 
                          onClick={() => playNow(track)}
                          className="action-icon-btn"
                          style={styles.actionIconBtn}
                          title="Play Next"
                        >
                          <Play size={14} />
                        </button>
                        <button 
                          onClick={() => addToQueue(track)}
                          className="action-icon-btn"
                          style={styles.actionIconBtn}
                          title="Add to Queue"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div style={styles.libraryTab} className="fade-in">
              <h2 style={styles.sectionTitle}>Your Liked Songs</h2>
              <div style={styles.trackList}>
                {playlist.filter(t => likedSongs.includes(t.id)).map((track, idx) => (
                  <div 
                    key={track.id} 
                    className="track-row"
                    style={styles.trackRow}
                    onDoubleClick={() => playNow(track)}
                  >
                    <div style={styles.colIndex}>{idx + 1}</div>
                    <div style={styles.colTitle}>
                      <img src={track.cover} style={styles.trackRowCover} alt="" />
                      <div style={styles.titleMeta}>
                        <div style={styles.trackTitleText}>{track.title}</div>
                        <div style={styles.trackArtistText}>{track.artist}</div>
                      </div>
                    </div>
                    <div style={styles.colAlbum}>{track.album}</div>
                    <div style={styles.colDuration}>{formatTime(track.duration)}</div>
                    <div style={styles.colActions}>
                      <button 
                        onClick={() => toggleLike(track.id)} 
                        className="action-icon-btn"
                        style={styles.actionIconBtn}
                      >
                        <Heart size={14} color="var(--accent)" fill="var(--accent)" />
                      </button>
                    </div>
                  </div>
                ))}
                {likedSongs.length === 0 && (
                  <div style={styles.emptyState}>
                    <Heart size={32} color="var(--text-muted)" />
                    <div>No liked songs yet. Double click or press Heart to add songs here.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'visualizer' && (
            <div style={styles.visualizerTab} className="fade-in">
              {/* Visualizer Config Top Bar */}
              <div style={styles.visControls}>
                <button 
                  onClick={() => setVisualizerMode('bars')}
                  style={{ ...styles.visBtn, ...(visualizerMode === 'bars' ? styles.visBtnActive : {}) }}
                >
                  Frequency Bars
                </button>
                <button 
                  onClick={() => setVisualizerMode('wave')}
                  style={{ ...styles.visBtn, ...(visualizerMode === 'wave' ? styles.visBtnActive : {}) }}
                >
                  Waveform Osc
                </button>
                <button 
                  onClick={() => setVisualizerMode('particles')}
                  style={{ ...styles.visBtn, ...(visualizerMode === 'particles' ? styles.visBtnActive : {}) }}
                >
                  Quantum Nebula
                </button>
              </div>

              {/* Canvas Visualizer Display */}
              <div style={styles.canvasContainer}>
                <canvas ref={canvasRef} style={styles.canvas}></canvas>
                <div style={styles.canvasOverlay}>
                  <div style={styles.canvasTitle}>{currentTrack.title}</div>
                  <div style={styles.canvasArtist}>{currentTrack.artist}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'music-folder' && (
            <div style={styles.musicFolderTab} className="fade-in">
              <h2 style={styles.sectionTitle}>Your Music Folder (/music)</h2>
              
              <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                <input 
                  type="text"
                  placeholder="filename.mp3 (e.g. song.mp3)"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addMusicFile()}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: '#fff',
                    fontSize: 13,
                    flex: 1,
                    maxWidth: 300,
                  }}
                />
                <button 
                  onClick={addMusicFile}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Plus size={14} />
                  Add Track
                </button>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {localMusicFiles.length} track(s)
                </div>
              </div>

              <div style={styles.trackList}>
                {localMusicFiles.length === 0 ? (
                  <div style={styles.emptyState}>
                    <Music size={32} color="var(--text-muted)" />
                    <div>No tracks added yet. Place MP3 files in /public/music/ folder, then type the filename above to add them.</div>
                  </div>
                ) : (
                  localMusicFiles.map((track, idx) => {
                    const isCurrent = currentTrack.id === track.id;
                    return (
                      <div 
                        key={track.id} 
                        className="track-row"
                        style={{ ...styles.trackRow, ...(isCurrent ? styles.trackRowActive : {}) }}
                        onDoubleClick={() => playLocalFile(track.id)}
                      >
                        <div style={styles.colIndex}>
                          {isCurrent && isPlaying ? (
                            <div style={styles.equalizerWaves}>
                              <span style={styles.eqWave1}></span>
                              <span style={styles.eqWave2}></span>
                              <span style={styles.eqWave3}></span>
                            </div>
                          ) : idx + 1}
                        </div>
                        
                        <div style={styles.colTitle}>
                          <img src={track.cover} style={styles.trackRowCover} alt="" />
                          <div style={styles.titleMeta}>
                            <div style={styles.trackTitleText}>{track.title}</div>
                            <div style={styles.trackArtistText}>{track.artist}</div>
                          </div>
                        </div>
                        
                        <div style={styles.colAlbum}>{track.album}</div>
                        <div style={styles.colDuration}>{formatTime(track.duration)}</div>
                        
                        <div style={styles.colActions}>
                          <button 
                            onClick={() => playLocalFile(track.id)}
                            className="action-icon-btn"
                            style={styles.actionIconBtn}
                            title="Play"
                          >
                            <Play size={14} />
                          </button>
                          <button 
                            onClick={() => removeLocalFile(track.id)}
                            className="action-icon-btn"
                            style={styles.actionIconBtn}
                            title="Remove from folder"
                          >
                            <Trash2 size={14} color="var(--text-secondary)" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Music Control Bar (Bottom) */}
        <div style={styles.playerBar}>
          {/* Timeline slider */}
          <div style={styles.progressContainer}>
            <span style={styles.timeLabel}>{formatTime(currentTime)}</span>
            <input 
              type="range"
              min="0"
              max={currentTrack.duration === 9999 ? 100 : (audioRef.current ? audioRef.current.duration || 100 : 100)}
              value={currentTrack.url === 'synth' ? (currentTime % 100) : currentTime}
              onChange={handleSeek}
              disabled={currentTrack.url === 'synth'}
              className="glass-slider"
              style={styles.progressBar}
            />
            <span style={styles.timeLabel}>
              {currentTrack.url === 'synth' ? '∞' : formatTime(audioRef.current ? audioRef.current.duration : currentTrack.duration)}
            </span>
          </div>

          <div style={styles.controlsRow}>
            {/* Playback Controls */}
            <div style={styles.playbackButtons}>
              <button onClick={handlePrev} className="control-btn" style={styles.controlBtn}>
                <SkipBack size={18} />
              </button>
              
              <button onClick={togglePlay} className="play-btn" style={styles.playBtn}>
                {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" style={{ marginLeft: 3 }} />}
              </button>
              
              <button onClick={handleNext} className="control-btn" style={styles.controlBtn}>
                <SkipForward size={18} />
              </button>
            </div>

            {/* Middle Song details (Desktop layout) */}
            <div style={styles.nowPlayingCenter}>
              <img src={currentTrack.cover} style={styles.nowPlayingThumb} alt="" />
              <div style={styles.nowPlayingMeta}>
                <div style={styles.nowPlayingTitle} className="text-truncate">{currentTrack.title}</div>
                <div style={styles.nowPlayingArtist} className="text-truncate">{currentTrack.artist}</div>
              </div>
            </div>

            {/* Volume control */}
            <div style={styles.volumeContainer}>
              <button onClick={() => setIsMuted(!isMuted)} className="control-btn" style={styles.controlBtn}>
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="glass-slider"
                style={styles.volumeSlider}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Queue Side Panel */}
      {showQueue && (
        <div style={styles.queuePanel} className="fade-in">
          <div style={styles.queueHeader}>
            <span style={styles.queueHeaderTitle}>Play Queue</span>
            <button onClick={() => setQueue([...TRACKS])} style={styles.queueResetBtn} title="Reset Queue">
              <RefreshCw size={14} />
            </button>
          </div>
          
          <div style={styles.queueList}>
            {queue.map((track, index) => {
              const isCurrent = index === currentTrackIndex;
              return (
                <div 
                  key={track.id} 
                  className="queue-item"
                  style={{ ...styles.queueItem, ...(isCurrent ? styles.queueItemActive : {}) }}
                  onDoubleClick={() => setCurrentTrackIndex(index)}
                >
                  <img src={track.cover} style={styles.queueItemCover} alt="" />
                  <div style={styles.queueItemMeta}>
                    <div style={styles.queueItemTitle} className="text-truncate">{track.title}</div>
                    <div style={styles.queueItemArtist} className="text-truncate">{track.artist}</div>
                  </div>
                  <button 
                    onClick={() => removeFromQueue(index)}
                    style={styles.queueRemoveBtn}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0a0a14',
    position: 'relative',
    color: '#e2e8f0',
    transition: 'background-image 0.5s ease',
  },
  sidebar: {
    width: '190px',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    gap: '24px',
    zIndex: 10,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    fontSize: '16px',
    color: '#fff',
    fontFamily: 'var(--font-title)',
  },
  menuGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  menuHeader: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    paddingLeft: '8px',
    marginBottom: '6px',
    letterSpacing: '1px',
  },
  menuBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'var(--font-main)',
    transition: 'all 0.2s',
  },
  menuBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
  },
  sidebarCoverCard: {
    marginTop: 'auto',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 'var(--border-radius-md)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sidebarCoverImg: {
    width: '100%',
    aspectRatio: '1/1',
    borderRadius: 'var(--border-radius-sm)',
    objectFit: 'cover',
    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
  },
  sidebarCoverMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarCoverTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
  },
  sidebarCoverArtist: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  mainPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'linear-gradient(to bottom, rgba(10, 10, 20, 0.2), rgba(10, 10, 20, 0.8))',
    backdropFilter: 'blur(10px)',
  },
  navbar: {
    height: '56px',
    padding: '0 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '6px 14px',
    width: '240px',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: '12px',
    width: '100%',
  },
  queueToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  queueToggleBtnActive: {
    backgroundColor: 'var(--accent)',
    borderColor: 'var(--accent)',
  },
  viewContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
  },
  browseTab: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '20px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '16px',
  },
  trackListHeader: {
    display: 'flex',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '8px',
    paddingLeft: '12px',
    marginBottom: '8px',
  },
  hdrColIndex: { width: '32px' },
  hdrColTitle: { flex: 2 },
  hdrColAlbum: { flex: 1 },
  hdrColDuration: { width: '60px', textAlign: 'right' },
  hdrColActions: { width: '100px' },

  trackList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  trackRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-md)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '13px',
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'var(--accent)',
  },
  colIndex: {
    width: '32px',
    color: 'var(--text-muted)',
  },
  colTitle: {
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  trackRowCover: {
    width: '36px',
    height: '36px',
    borderRadius: '4px',
    objectFit: 'cover',
  },
  titleMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  trackTitleText: {
    fontWeight: '600',
    color: '#fff',
  },
  trackArtistText: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  colAlbum: {
    flex: 1,
    color: 'var(--text-secondary)',
  },
  colDuration: {
    width: '60px',
    textAlign: 'right',
    color: 'var(--text-secondary)',
  },
  colActions: {
    width: '100px',
    display: 'flex',
    gap: '4px',
    justifyContent: 'flex-end',
    opacity: 0.8,
  },
  actionIconBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  equalizerWaves: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px',
    height: '12px',
    width: '12px',
  },
  eqWave1: {
    width: '2px',
    height: '100%',
    backgroundColor: 'var(--accent)',
    animation: 'eq-bounce 0.8s ease-in-out infinite alternate',
  },
  eqWave2: {
    width: '2px',
    height: '60%',
    backgroundColor: 'var(--accent)',
    animation: 'eq-bounce 0.5s ease-in-out infinite alternate 0.1s',
  },
  eqWave3: {
    width: '2px',
    height: '80%',
    backgroundColor: 'var(--accent)',
    animation: 'eq-bounce 0.7s ease-in-out infinite alternate 0.2s',
  },
  libraryTab: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '40px 0',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  visualizerTab: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '16px',
  },
  visControls: {
    display: 'flex',
    gap: '8px',
  },
  visBtn: {
    padding: '6px 12px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  visBtnActive: {
    backgroundColor: 'var(--accent)',
    color: '#fff',
    borderColor: 'var(--accent)',
    boxShadow: 'var(--accent-glow)',
  },
  canvasContainer: {
    flex: 1,
    minHeight: '260px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 'var(--border-radius-lg)',
    position: 'relative',
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  canvasOverlay: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    pointerEvents: 'none',
  },
  canvasTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  },
  canvasArtist: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  playerBar: {
    height: '76px',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 24px',
    gap: '6px',
    zIndex: 10,
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: '4px',
  },
  timeLabel: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    width: '32px',
    textAlign: 'center',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playbackButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  controlBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    transition: 'color 0.2s',
  },
  playBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    border: 'none',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: 'var(--accent-glow)',
    transition: 'transform 0.2s',
  },
  nowPlayingCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '260px',
  },
  nowPlayingThumb: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    objectFit: 'cover',
  },
  nowPlayingMeta: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  nowPlayingTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
  },
  nowPlayingArtist: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  volumeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '120px',
  },
  volumeSlider: {
    width: '80px',
    height: '4px',
  },
  queuePanel: {
    width: '220px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10,
  },
  queueHeader: {
    padding: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueHeaderTitle: {
    fontWeight: '700',
    fontSize: '13px',
    color: '#fff',
  },
  queueResetBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    transition: 'color 0.2s',
  },
  queueList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  queueItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  queueItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--accent)',
  },
  queueItemCover: {
    width: '28px',
    height: '28px',
    borderRadius: '3px',
    marginRight: '8px',
  },
  queueItemMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  queueItemTitle: {
    fontWeight: '600',
    color: '#fff',
  },
  queueItemArtist: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  queueRemoveBtn: {
    background: 'none',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    opacity: 0,
    transition: 'opacity 0.2s, color 0.2s',
  }
};

// Add standard keyframe style to the page for equalizer bouncing
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes eq-bounce {
      0% { height: 2px; }
      100% { height: 100%; }
    }
    .track-row:hover .queueRemoveBtn {
      opacity: 1;
    }
    div[style*="queueItem"]:hover button[style*="queueRemoveBtn"] {
      opacity: 1;
    }
    .track-row:hover {
      background-color: rgba(255, 255, 255, 0.06) !important;
    }
    .action-icon-btn:hover {
      color: #fff !important;
      background-color: rgba(255, 255, 255, 0.1) !important;
    }
    .control-btn:hover {
      color: #fff !important;
    }
    .play-btn:hover {
      transform: scale(1.08) !important;
    }
    .queue-item:hover {
      background-color: rgba(255, 255, 255, 0.04) !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
