import { useState } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  Sparkles, 
  Play 
} from 'lucide-react';
import { 
  useAudio, 
  LOCAL_TRACKS, 
  SPOTIFY_PRESETS, 
  YOUTUBE_PRESETS 
} from '@/context/AudioContext';

interface SoundPlayerProps {
  isEmbedded?: boolean;
}

export default function SoundPlayer({ isEmbedded = true }: SoundPlayerProps) {
  const {
    mode,
    setMode,
    activeAmbientTrack,
    handleSelectAmbient,
    volume,
    setVolume,
    activeSpotifyEmbed,
    setActiveSpotifyEmbed,
    spotifyEmbedHeight,
    setSpotifyEmbedHeight,
    activeYouTubeEmbed,
    setActiveYouTubeEmbed,
    savedPlaylists,
    handleImport,
    handleDeletePlaylist,
  } = useAudio();

  const [showImportForm, setShowImportForm] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importName, setImportName] = useState('');
  const [importError, setImportError] = useState('');

  const onImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    const result = handleImport(importUrl, importName);
    if (result.success) {
      setImportUrl('');
      setImportName('');
      setShowImportForm(false);
    } else {
      setImportError(result.error || 'Failed to import URL');
    }
  };

  return (
    <div className={`glass-card p-5 rounded-2xl w-full max-w-md mx-auto shadow-2xl transition-all animate-fade-in border border-white/5 ${!isEmbedded ? 'bg-coffee-900/95' : ''}`}>
      {/* Top Header & Import Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-300">
            <Music size={16} />
          </div>
          <p className="text-sm font-semibold text-white">Audio & Music</p>
        </div>
        <button
          onClick={() => {
            setShowImportForm(!showImportForm);
            setImportError('');
          }}
          className="flex items-center gap-1 text-xs font-medium text-primary-300 hover:text-primary-200 bg-primary-500/10 hover:bg-primary-500/20 px-3 py-1.5 rounded-xl border border-primary-500/20 transition-all"
        >
          <Plus size={14} /> Import Link
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-coffee-800/50 rounded-xl mb-4">
        <button
          onClick={() => setMode('ambient')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'ambient'
              ? 'bg-[#f1d6b9] text-coffee-900 shadow-lg shadow-black/20'
              : 'text-coffee-400 hover:text-white'
          }`}
        >
          Ambient
        </button>
        <button
          onClick={() => setMode('spotify')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'spotify'
              ? 'bg-[#f1d6b9] text-coffee-900 shadow-lg shadow-black/20'
              : 'text-coffee-400 hover:text-white'
          }`}
        >
          Spotify
        </button>
        <button
          onClick={() => setMode('youtube')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            mode === 'youtube'
              ? 'bg-[#f1d6b9] text-coffee-900 shadow-lg shadow-black/20'
              : 'text-coffee-400 hover:text-white'
          }`}
        >
          YouTube
        </button>
      </div>

      {/* Import Link Form Modal */}
      {showImportForm && (
        <form onSubmit={onImportSubmit} className="glass p-4 rounded-xl mb-4 border border-primary-500/20 animate-slide-up space-y-3 bg-coffee-900/90">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary-300" /> Import Custom Playlist / Link
            </p>
            <span className="text-[10px] text-coffee-400">Spotify, YT & YT Music</span>
          </div>

          <input
            type="text"
            required
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="Paste Spotify, YouTube, or YouTube Music URL..."
            className="w-full px-3 py-2 text-xs rounded-xl bg-coffee-800/80 border border-white/10 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50"
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              placeholder="Playlist name (optional)"
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-coffee-800/80 border border-white/10 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#f1d6b9] text-coffee-900 text-xs font-semibold hover:brightness-95 active:scale-95 transition-all shadow-md shadow-black/20"
            >
              Add
            </button>
          </div>

          {importError && (
            <p className="text-[11px] text-rose-400 animate-fade-in font-medium">{importError}</p>
          )}
        </form>
      )}

      {/* TAB 1: AMBIENT SOUNDSCAPES */}
      {mode === 'ambient' && (
        <div className="animate-fade-in space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {LOCAL_TRACKS.map(({ id, label, icon: Icon }) => {
              const isActive = activeAmbientTrack === id;
              return (
                <button
                  key={id}
                  onClick={() => handleSelectAmbient(id)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all duration-300 ${
                    isActive
                      ? 'border-primary-500/30 bg-primary-500/15 text-primary-300 shadow-md shadow-primary-500/10'
                      : 'border-white/5 bg-coffee-800/50 text-coffee-400 hover:text-white hover:bg-coffee-700/50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'animate-pulse text-primary-300' : ''} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 pt-1">
            {volume === 0 ? (
              <VolumeX size={18} className="text-coffee-500 shrink-0" />
            ) : (
              <Volume2 size={18} className="text-primary-300 shrink-0" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-coffee-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <span className="text-[10px] text-coffee-400 font-mono w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: SPOTIFY PLAYER */}
      {mode === 'spotify' && (
        <div className="animate-fade-in space-y-3">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] text-coffee-400 font-medium uppercase tracking-wider shrink-0 mr-1">Presets:</span>
            {SPOTIFY_PRESETS.map((preset) => {
              const isActive = activeSpotifyEmbed === preset.embedUrl;
              return (
                <button
                  key={preset.id}
                  onClick={() => setActiveSpotifyEmbed(preset.embedUrl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-primary-500/20 border-primary-500/30 text-primary-300'
                      : 'bg-coffee-800/40 border-white/5 text-coffee-400 hover:text-white'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Custom Saved Playlists */}
          {savedPlaylists.filter((p) => p.platform === 'spotify').length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-coffee-400 font-medium uppercase tracking-wider block">My Playlists:</span>
              <div className="flex flex-wrap gap-1.5">
                {savedPlaylists
                  .filter((p) => p.platform === 'spotify')
                  .map((playlist) => {
                    const isActive = activeSpotifyEmbed === playlist.embedUrl;
                    return (
                      <div
                        key={playlist.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all border ${
                          isActive
                            ? 'bg-primary-500/20 border-primary-500/30 text-primary-300 font-semibold'
                            : 'bg-coffee-800/40 border-white/5 text-coffee-300'
                        }`}
                      >
                        <button
                          onClick={() => setActiveSpotifyEmbed(playlist.embedUrl)}
                          className="hover:underline flex items-center gap-1.5 truncate max-w-[140px]"
                        >
                          <Play size={10} fill="currentColor" /> {playlist.name}
                        </button>
                        <button
                          onClick={() => handleDeletePlaylist(playlist.id)}
                          className="text-coffee-500 hover:text-rose-400 ml-1 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Spotify iFrame Embed */}
          <div className="rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black/40 relative">
            <iframe
              src={activeSpotifyEmbed}
              width="100%"
              height={spotifyEmbedHeight === 'compact' ? '152' : '352'}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Embed Player"
              className="w-full transition-all duration-300"
            />
          </div>

          {/* Size toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setSpotifyEmbedHeight(spotifyEmbedHeight === 'compact' ? 'full' : 'compact')}
              className="text-[11px] text-coffee-400 hover:text-white transition-colors"
            >
              {spotifyEmbedHeight === 'compact' ? 'Expand Player ▾' : 'Collapse Player ▴'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: YOUTUBE & YOUTUBE MUSIC PLAYER */}
      {mode === 'youtube' && (
        <div className="animate-fade-in space-y-3">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] text-coffee-400 font-medium uppercase tracking-wider shrink-0 mr-1">Presets:</span>
            {YOUTUBE_PRESETS.map((preset) => {
              const isActive = activeYouTubeEmbed === preset.embedUrl;
              return (
                <button
                  key={preset.id}
                  onClick={() => setActiveYouTubeEmbed(preset.embedUrl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-primary-500/20 border-primary-500/30 text-primary-300'
                      : 'bg-coffee-800/40 border-white/5 text-coffee-400 hover:text-white'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Custom Saved YouTube / YT Music Playlists */}
          {savedPlaylists.filter((p) => p.platform === 'youtube').length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-coffee-400 font-medium uppercase tracking-wider block">My Saved Links:</span>
              <div className="flex flex-wrap gap-1.5">
                {savedPlaylists
                  .filter((p) => p.platform === 'youtube')
                  .map((item) => {
                    const isActive = activeYouTubeEmbed === item.embedUrl;
                    return (
                      <div
                        key={item.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all border ${
                          isActive
                            ? 'bg-primary-500/20 border-primary-500/30 text-primary-300 font-semibold'
                            : 'bg-coffee-800/40 border-white/5 text-coffee-300'
                        }`}
                      >
                        <button
                          onClick={() => setActiveYouTubeEmbed(item.embedUrl)}
                          className="hover:underline flex items-center gap-1.5 truncate max-w-[140px]"
                        >
                          <Play size={10} fill="currentColor" /> {item.name}
                        </button>
                        <button
                          onClick={() => handleDeletePlaylist(item.id)}
                          className="text-coffee-500 hover:text-rose-400 ml-1 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* YouTube / YT Music Embed */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-white/10 bg-black">
            <iframe
              src={activeYouTubeEmbed}
              title="YouTube / YouTube Music Player"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <p className="text-[10px] text-coffee-500 text-center">
            Supports YouTube videos, livestreams, and YouTube Music playlists.
          </p>
        </div>
      )}
    </div>
  );
}