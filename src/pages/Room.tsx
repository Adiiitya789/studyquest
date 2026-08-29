import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { coinsForMinutes } from '@/lib/constants';
import { Play, Pause, Square } from 'lucide-react';
import { useStudy } from '@/context/StudyContext';

export default function Room() {
  const {
    seconds,
    running,
    subject,
    saving,
    setSubject,
    toggleTimer,
    endSession,
  } = useStudy();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const urlSubject = searchParams.get('subject');
    if (urlSubject) {
      setSubject(urlSubject);
    }
  }, [searchParams, setSubject]);

  const minutes = Math.floor(seconds / 60);
  const displayHours = Math.floor(seconds / 3600);
  const displayMinutes = Math.floor((seconds % 3600) / 60);
  const displaySeconds = seconds % 60;
  const coinsEarned = coinsForMinutes(minutes);

  const handleEnd = async () => {
    await endSession();
    navigate('/dashboard');
  };

  return (
    <div className="animate-fade-in flex flex-col relative z-10">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-coffee-400">Study Room</p>
          <input 
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject name..."
            className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:outline-none focus:border-primary-500 transition-all w-48 py-1"
          />
        </div>
        
        <div className="px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
          <span className="text-xs font-medium text-primary-300">Live Session</span>
        </div>
      </div>

      {/* Center Timer */}
      <div className="flex-1 flex flex-col items-center justify-center mb-8">
        <div className={`relative w-64 h-64 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${running ? 'animate-pulse-glow' : ''}`}>
          <div className="absolute inset-0 rounded-full border-2 border-coffee-800" />
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
            <circle
              cx="128" cy="128" r="124"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 124}
              strokeDashoffset={2 * Math.PI * 124 * (1 - (seconds % 3600) / 3600)}
              className="transition-all duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <p className="text-5xl font-bold text-white tabular-nums tracking-tight drop-shadow-md">
              {String(displayHours).padStart(2, '0')}:{String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
            </p>
            <p className="text-sm text-coffee-400 mt-2">
              {coinsEarned} coins earned
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={toggleTimer}
            className="w-16 h-16 rounded-full bg-[#f1d6b9] text-coffee-900 flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 active:scale-95 transition-all"
          >
            {running ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          <button
            onClick={handleEnd}
            disabled={saving || seconds < 60}
            className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center hover:bg-rose-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
          >
            <Square size={24} fill="currentColor" />
          </button>
        </div>
        
        {saving && <p className="text-sm text-coffee-400 animate-pulse mb-6">Saving session…</p>}
        {seconds < 60 && !running && (
          <p className="text-xs text-coffee-500 mb-2 drop-shadow-md text-center">
            Press play to start tracking. Sessions under 1 minute won't be saved.
          </p>
        )}
      </div>
    </div>
  );
}