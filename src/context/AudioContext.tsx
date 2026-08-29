import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { CloudRain, Music, Sunset as SunsetIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PlayerMode = 'ambient' | 'spotify' | 'youtube';

export interface CustomItem {
  id: string;
  name: string;
  url: string;
  platform: 'spotify' | 'youtube';
  embedUrl: string;
}

export interface AmbientTrack {
  id: string;
  label: string;
  icon: LucideIcon;
  src: string;
  defaultVolume: number;
}

export const LOCAL_TRACKS: AmbientTrack[] = [
  { id: 'lofi', label: 'Lofi Beats', icon: Music, src: '/lofi.mp3', defaultVolume: 0.5 },
  { id: 'rain', label: 'Gentle Rain', icon: CloudRain, src: '/rain.mp3', defaultVolume: 0.6 },
  { id: 'sunset', label: 'Sunset Chill', icon: SunsetIcon, src: '/sunset.mp3', defaultVolume: 0.5 },
];

export const SPOTIFY_PRESETS = [
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0',
  },
  {
    id: 'lofi-beats',
    name: 'Lofi Beats',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM?utm_source=generator&theme=0',
  },
  {
    id: 'peaceful-piano',
    name: 'Peaceful Piano',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0',
  },
];

export const YOUTUBE_PRESETS = [
  {
    id: 'lofi-girl',
    name: 'Lofi Girl Live 24/7',
    embedUrl: 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1',
  },
  {
    id: 'synthwave-study',
    name: 'Chillwave & Synthwave',
    embedUrl: 'https://www.youtube-nocookie.com/embed/4xDzrJKXOOY?autoplay=1',
  },
  {
    id: 'classical-focus',
    name: 'Classical Masterpieces',
    embedUrl: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLrAl5Qv53C2pGqZ4Z7E0W3H6kY_rX5O4b&autoplay=1',
  },
];

export function parseSpotifyUrl(input: string): { type: string; id: string; embedUrl: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const uriMatch = trimmed.match(/^spotify:(playlist|album|track|artist):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    const type = uriMatch[1].toLowerCase();
    const id = uriMatch[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  const urlMatch = trimmed.match(/open\.spotify\.com\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(playlist|album|track|artist)\/([a-zA-Z0-9]+)/i);
  if (urlMatch) {
    const type = urlMatch[1].toLowerCase();
    const id = urlMatch[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  return null;
}

export function parseYouTubeUrl(input: string): { type: 'playlist' | 'video'; id: string; embedUrl: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    let urlObj: URL | null = null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      urlObj = new URL(trimmed);
    } else if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      urlObj = new URL('https://' + trimmed);
    }

    if (urlObj) {
      const hostname = urlObj.hostname.replace('www.', '').toLowerCase();

      if (hostname === 'youtube.com' || hostname === 'music.youtube.com' || hostname === 'm.youtube.com') {
        const listParam = urlObj.searchParams.get('list');
        const vParam = urlObj.searchParams.get('v');

        if (listParam) {
          return {
            type: 'playlist',
            id: listParam,
            embedUrl: vParam
              ? `https://www.youtube-nocookie.com/embed/${vParam}?list=${listParam}&autoplay=1`
              : `https://www.youtube-nocookie.com/embed/videoseries?list=${listParam}&autoplay=1`,
          };
        }

        if (vParam) {
          return {
            type: 'video',
            id: vParam,
            embedUrl: `https://www.youtube-nocookie.com/embed/${vParam}?autoplay=1`,
          };
        }

        if (urlObj.pathname.startsWith('/embed/')) {
          const id = urlObj.pathname.replace('/embed/', '');
          return {
            type: 'video',
            id,
            embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`,
          };
        }
      } else if (hostname === 'youtu.be') {
        const videoId = urlObj.pathname.slice(1).split('?')[0];
        const listParam = urlObj.searchParams.get('list');
        if (listParam) {
          return {
            type: 'playlist',
            id: listParam,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?list=${listParam}&autoplay=1`,
          };
        }
        if (videoId) {
          return {
            type: 'video',
            id: videoId,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`,
          };
        }
      }
    }
  } catch {}

  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) {
    return {
      type: 'playlist',
      id: listMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${listMatch[1]}&autoplay=1`,
    };
  }

  const videoMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (videoMatch) {
    return {
      type: 'video',
      id: videoMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoMatch[1]}?autoplay=1`,
    };
  }

  return null;
}

export interface TrackLayerState {
  playing: boolean;
  volume: number; // 0.0 to 1.0
}

const STORAGE_PLAYLISTS_KEY = 'studyquest_custom_playlists';
const STORAGE_ACTIVE_MODE_KEY = 'studyquest_player_mode';
const STORAGE_AMBIENT_STATE_KEY = 'studyquest_ambient_mixer_state';

interface AudioContextValue {
  mode: PlayerMode;
  setMode: (mode: PlayerMode) => void;

  // Multi-Track Ambient Mixer State
  ambientTracksState: Record<string, TrackLayerState>;
  toggleAmbientTrack: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  stopAllAmbient: () => void;
  masterAmbientVolume: number;
  setMasterAmbientVolume: (v: number) => void;
  activeAmbientCount: number;

  // Spotify State
  activeSpotifyEmbed: string;
  setActiveSpotifyEmbed: (url: string) => void;
  spotifyEmbedHeight: 'compact' | 'full';
  setSpotifyEmbedHeight: (h: 'compact' | 'full') => void;

  // YouTube State
  activeYouTubeEmbed: string;
  setActiveYouTubeEmbed: (url: string) => void;

  // Playlists
  savedPlaylists: CustomItem[];
  handleImport: (url: string, name?: string) => { success: boolean; error?: string };
  handleDeletePlaylist: (id: string) => void;

  // Overview status
  currentTrackLabel: string;
  isPlaying: boolean;
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PlayerMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_MODE_KEY);
      if (saved === 'ambient' || saved === 'spotify' || saved === 'youtube') return saved;
    } catch {}
    return 'ambient';
  });

  // Multi-Track Ambient Sound State
  const [ambientTracksState, setAmbientTracksState] = useState<Record<string, TrackLayerState>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AMBIENT_STATE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    const initial: Record<string, TrackLayerState> = {};
    LOCAL_TRACKS.forEach((t) => {
      initial[t.id] = { playing: false, volume: t.defaultVolume };
    });
    return initial;
  });

  const [masterAmbientVolume, setMasterAmbientVolume] = useState<number>(0.8);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement | null>>({});

  const [activeSpotifyEmbed, setActiveSpotifyEmbed] = useState<string>(SPOTIFY_PRESETS[0].embedUrl);
  const [spotifyEmbedHeight, setSpotifyEmbedHeight] = useState<'compact' | 'full'>('compact');
  const [activeYouTubeEmbed, setActiveYouTubeEmbed] = useState<string>(YOUTUBE_PRESETS[0].embedUrl);

  const [savedPlaylists, setSavedPlaylists] = useState<CustomItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PLAYLISTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  // Persist mode
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_MODE_KEY, mode);
    } catch {}
  }, [mode]);

  // Persist ambient mixer state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AMBIENT_STATE_KEY, JSON.stringify(ambientTracksState));
    } catch {}
  }, [ambientTracksState]);

  // Persist playlists
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLAYLISTS_KEY, JSON.stringify(savedPlaylists));
    } catch {}
  }, [savedPlaylists]);

  // Sync Audio Elements with Multi-Track State
  useEffect(() => {
    LOCAL_TRACKS.forEach((track) => {
      const el = audioElementsRef.current[track.id];
      if (el) {
        const state = ambientTracksState[track.id] ?? { playing: false, volume: track.defaultVolume };
        el.volume = Math.max(0, Math.min(1, state.volume * masterAmbientVolume));

        if (state.playing) {
          el.play().catch((err) => console.log(`Audio play for ${track.id} blocked:`, err));
        } else {
          el.pause();
        }
      }
    });
  }, [ambientTracksState, masterAmbientVolume]);

  const toggleAmbientTrack = (trackId: string) => {
    setAmbientTracksState((prev) => {
      const current = prev[trackId] ?? { playing: false, volume: 0.5 };
      return {
        ...prev,
        [trackId]: {
          ...current,
          playing: !current.playing,
        },
      };
    });
  };

  const setTrackVolume = (trackId: string, volume: number) => {
    setAmbientTracksState((prev) => {
      const current = prev[trackId] ?? { playing: true, volume: 0.5 };
      return {
        ...prev,
        [trackId]: {
          ...current,
          volume: Math.max(0, Math.min(1, volume)),
        },
      };
    });
  };

  const stopAllAmbient = () => {
    setAmbientTracksState((prev) => {
      const next: Record<string, TrackLayerState> = {};
      Object.keys(prev).forEach((key) => {
        next[key] = { ...prev[key], playing: false };
      });
      return next;
    });
  };

  const handleImport = (rawUrl: string, name?: string): { success: boolean; error?: string } => {
    const spotifyParsed = parseSpotifyUrl(rawUrl);
    if (spotifyParsed) {
      const newItem: CustomItem = {
        id: 'spot_' + Date.now(),
        name: name?.trim() || `Spotify ${spotifyParsed.type.toUpperCase()}`,
        url: rawUrl.trim(),
        platform: 'spotify',
        embedUrl: spotifyParsed.embedUrl,
      };
      setSavedPlaylists((prev) => [newItem, ...prev]);
      setActiveSpotifyEmbed(newItem.embedUrl);
      setMode('spotify');
      return { success: true };
    }

    const ytParsed = parseYouTubeUrl(rawUrl);
    if (ytParsed) {
      const isYtMusic = rawUrl.toLowerCase().includes('music.youtube.com');
      const defaultLabel = isYtMusic
        ? `YouTube Music ${ytParsed.type === 'playlist' ? 'Playlist' : 'Track'}`
        : `YouTube ${ytParsed.type === 'playlist' ? 'Playlist' : 'Video'}`;

      const newItem: CustomItem = {
        id: 'yt_' + Date.now(),
        name: name?.trim() || defaultLabel,
        url: rawUrl.trim(),
        platform: 'youtube',
        embedUrl: ytParsed.embedUrl,
      };
      setSavedPlaylists((prev) => [newItem, ...prev]);
      setActiveYouTubeEmbed(newItem.embedUrl);
      setMode('youtube');
      return { success: true };
    }

    return { success: false, error: 'Please enter a valid Spotify, YouTube, or YouTube Music URL' };
  };

  const handleDeletePlaylist = (id: string) => {
    setSavedPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  // Active ambient count
  const activeAmbientList = LOCAL_TRACKS.filter((t) => ambientTracksState[t.id]?.playing);
  const activeAmbientCount = activeAmbientList.length;

  // Determine current active track label & playback state
  let currentTrackLabel = '';
  let isPlaying = false;

  if (activeAmbientCount > 0) {
    isPlaying = true;
    if (mode === 'ambient') {
      if (activeAmbientCount === 1) {
        currentTrackLabel = activeAmbientList[0].label;
      } else {
        currentTrackLabel = `${activeAmbientList.map((t) => t.label).join(' + ')}`;
      }
    }
  }

  if (mode === 'spotify') {
    const custom = savedPlaylists.find((p) => p.embedUrl === activeSpotifyEmbed);
    const preset = SPOTIFY_PRESETS.find((p) => p.embedUrl === activeSpotifyEmbed);
    const baseName = custom?.name || preset?.name || 'Spotify Stream';
    currentTrackLabel = activeAmbientCount > 0 ? `${baseName} (+${activeAmbientCount} Ambient)` : baseName;
    isPlaying = true;
  } else if (mode === 'youtube') {
    const custom = savedPlaylists.find((p) => p.embedUrl === activeYouTubeEmbed);
    const preset = YOUTUBE_PRESETS.find((p) => p.embedUrl === activeYouTubeEmbed);
    const baseName = custom?.name || preset?.name || 'YouTube Stream';
    currentTrackLabel = activeAmbientCount > 0 ? `${baseName} (+${activeAmbientCount} Ambient)` : baseName;
    isPlaying = true;
  }

  return (
    <AudioContext.Provider
      value={{
        mode,
        setMode,
        ambientTracksState,
        toggleAmbientTrack,
        setTrackVolume,
        stopAllAmbient,
        masterAmbientVolume,
        setMasterAmbientVolume,
        activeAmbientCount,
        activeSpotifyEmbed,
        setActiveSpotifyEmbed,
        spotifyEmbedHeight,
        setSpotifyEmbedHeight,
        activeYouTubeEmbed,
        setActiveYouTubeEmbed,
        savedPlaylists,
        handleImport,
        handleDeletePlaylist,
        currentTrackLabel,
        isPlaying,
      }}
    >
      {/* Persistent Multi-Track Native Audio Elements */}
      {LOCAL_TRACKS.map((track) => (
        <audio
          key={track.id}
          ref={(el) => {
            audioElementsRef.current[track.id] = el;
          }}
          src={track.src}
          loop
          preload="auto"
        />
      ))}
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
