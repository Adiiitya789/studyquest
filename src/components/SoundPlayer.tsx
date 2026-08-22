import { useEffect, useRef, useState } from 'react';
import { CloudRain, Music, Sunset as SunsetIcon, Volume2, VolumeX } from 'lucide-react';

// Using free ambient sound URLs for testing. You can replace these with your own local .mp3 files later!
const TRACKS = [
  { id: 'lofi', label: 'Lofi Beats', icon: Music, src: '/lofi.mp3' },
  { id: 'rain', label: 'Rain', icon: CloudRain, src: '/rain.mp3' },
  { id: 'sunset', label: 'Sunset', icon: SunsetIcon, src: '/sunset.mp3' },
];

export default function SoundPlayer() {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle Play/Pause
  const handleSelect = (trackId: string) => {
    if (activeTrack === trackId) {
      // Turn off if clicking the currently playing track
      audioRef.current?.pause();
      setActiveTrack(null);
    } else {
      // Switch track
      setActiveTrack(trackId);
    }
  };

  // Sync Audio Element with State changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      if (activeTrack) {
        audioRef.current.play().catch(e => console.log("Audio play blocked by browser:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [activeTrack, volume]);

  return (
    <div className="glass-card p-5 rounded-2xl w-full max-w-sm mx-auto">
      <p className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
        Ambient Soundscape
      </p>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        {TRACKS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTrack === id;
          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all duration-300 ${
                isActive
                  ? 'border-primary-500/50 bg-primary-500/20 text-primary-300 shadow-[0_0_15px_rgba(var(--primary-500),0.3)]'
                  : 'border-white/10 bg-coffee-800/50 text-coffee-400 hover:text-white hover:bg-coffee-700/50'
              }`}
            >
              <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Hidden Audio Player */}
      <audio 
        ref={audioRef} 
        src={TRACKS.find(t => t.id === activeTrack)?.src} 
        loop 
      />

      {/* Volume Slider */}
      <div className="flex items-center gap-3">
        {volume === 0 ? <VolumeX size={18} className="text-coffee-500" /> : <Volume2 size={18} className="text-primary-300" />}
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-1.5 bg-coffee-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />
      </div>
    </div>
  );
}