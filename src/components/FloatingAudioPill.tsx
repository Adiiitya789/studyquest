import { useNavigate, useLocation } from 'react-router-dom';
import { useAudio } from '@/context/AudioContext';
import { Music, Pause, Play, ChevronRight } from 'lucide-react';

export default function FloatingAudioPill() {
  const { isPlaying, currentTrackLabel, mode, activeAmbientTrack, setActiveAmbientTrack } = useAudio();
  const location = useLocation();
  const navigate = useNavigate();

  // Only show the floating pill if we are NOT on the /room page and something is active
  if (location.pathname === '/room' || !isPlaying) {
    return null;
  }

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'ambient') {
      setActiveAmbientTrack(null);
    }
  };

  return (
    <div 
      onClick={() => navigate('/room')}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md cursor-pointer animate-slide-up"
    >
      <div className="glass-card bg-coffee-900/95 border border-primary-500/30 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl shadow-black/40 flex items-center justify-between gap-3 hover:border-primary-500/50 transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-300 flex items-center justify-center shrink-0">
            <Music size={16} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <p className="text-xs font-semibold text-white truncate max-w-[170px] sm:max-w-[220px]">
                {currentTrackLabel || 'Playing Audio'}
              </p>
            </div>
            <p className="text-[10px] text-coffee-400 capitalize">
              {mode === 'ambient' ? 'Ambient Soundscape' : mode === 'spotify' ? 'Spotify Player' : 'YouTube Music'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {mode === 'ambient' && (
            <button
              onClick={handleTogglePlay}
              className="p-1.5 rounded-lg bg-coffee-800/80 hover:bg-coffee-700 text-coffee-300 hover:text-white transition-all"
              title={activeAmbientTrack ? 'Pause Sound' : 'Play Sound'}
            >
              {activeAmbientTrack ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}

          <div className="flex items-center gap-0.5 text-xs font-medium text-primary-300 bg-primary-500/10 px-2 py-1 rounded-lg border border-primary-500/20">
            <span>Room</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>
    </div>
  );
}

