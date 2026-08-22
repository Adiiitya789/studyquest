import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { SUBJECTS, coinsForMinutes } from '@/lib/constants';
import { Play, Pause, Square, Users, Circle } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';
import SoundPlayer from '@/components/SoundPlayer';

export default function Room() {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSubject = searchParams.get('subject') ?? profile?.main_subject ?? SUBJECTS[0];
  const [subject, setSubject] = useState(initialSubject);

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<LeaderboardEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_global_leaderboard', { p_timeframe: 'week' });
      setOnlineUsers((data ?? []).slice(0, 8) as LeaderboardEntry[]);
    })();
  }, []);

  // --- NEW FEATURE 1: Dynamic Browser Tab Title ---
  useEffect(() => {
    if (running) {
      const h = Math.floor(seconds / 3600);
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      
      // If over an hour, show H:MM:SS, otherwise just MM:SS
      const timeString = h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
      document.title = `(${timeString}) StudyQuest`;
    } else {
      document.title = 'StudyQuest';
    }

    // Cleanup: Reset title when they leave the room entirely
    return () => {
      document.title = 'StudyQuest';
    };
  }, [seconds, running]);

  // --- NEW FEATURE 2: Accidental Refresh Protection ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only block the refresh if the timer is running AND they have unsaved time (>= 60s)
      if (running && seconds >= 60) {
        e.preventDefault();
        e.returnValue = ''; // This triggers the native browser warning modal
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [running, seconds]);


  const minutes = Math.floor(seconds / 60);
  const displayHours = Math.floor(seconds / 3600);
  const displayMinutes = Math.floor((seconds % 3600) / 60);
  const displaySeconds = seconds % 60;
  const coinsEarned = coinsForMinutes(minutes);

  async function handleEnd() {
    if (!user || seconds < 60) {
      setRunning(false);
      if (seconds < 60) navigate('/dashboard');
      return;
    }
    setSaving(true);
    setRunning(false);
    const mins = Math.floor(seconds / 60);
    const coins = coinsForMinutes(mins);

    // Writes directly to study_logs / profiles.coins (RLS already scopes
    // both to the signed-in user's own row). We previously tried routing
    // this through a log_study_session RPC for server-side anti-cheat, but
    // that function was never actually created in the database, so the
    // coin award was silently failing every time. This direct-write
    // approach is what's confirmed working.
    const { error: insertError } = await supabase.from('study_logs').insert({
      user_id: user.id,
      subject,
      minutes: mins,
      manual: false,
    });

    if (insertError) {
      console.error('Failed to log study session:', insertError.message);
    } else if (coins > 0 && profile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: profile.coins + coins })
        .eq('id', user.id);
      if (updateError) {
        console.error('Failed to credit coins:', updateError.message);
      } else {
        await refreshProfile();
      }
    }
    setSaving(false);
    navigate('/dashboard');
  }

  return (
    <>
      {/* The theme background image + overlay now render once in App.tsx's
          ProtectedLayout, behind every page — not just this one. */}

      {/* Main Content */}
      <div className="animate-fade-in min-h-[calc(100vh-6rem)] flex flex-col relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-coffee-400">Study Room</p>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:outline-none focus:border-primary-500 transition-all w-48 py-1"
            />
          </div>
          
          {/* The theme picker now lives in the top bar on every page (see
              ThemeSwitcher in App.tsx) — no longer duplicated here. */}
          <div className="px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
            <span className="text-xs font-medium text-primary-300">Live Session</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
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
              onClick={() => setRunning(!running)}
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
            <p className="text-xs text-coffee-500 mb-6 drop-shadow-md">Press play to start tracking. Sessions under 1 minute won't be saved.</p>
          )}

          <div className="w-full max-w-sm mb-12">
            <SoundPlayer />
          </div>
        </div>

        <div className="glass-card bg-coffee-900/60 backdrop-blur-md p-4 mb-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-coffee-400" />
            <p className="text-sm font-semibold text-white">Studying Now</p>
            <span className="ml-auto text-xs text-coffee-400">{onlineUsers.length} active this week</span>
          </div>
          <div className="space-y-2">
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-coffee-500 py-2">No one else is active right now.</p>
            ) : (
              onlineUsers.map((u, i) => (
                <div key={u.user_id} className="flex items-center gap-3 py-1">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {u.display_name.charAt(0).toUpperCase()}
                    </div>
                    <Circle size={8} className="absolute -bottom-0.5 -right-0.5 text-green-400 fill-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate drop-shadow-sm">{u.display_name}</p>
                    <p className="text-xs text-coffee-400">{u.main_subject}</p>
                  </div>
                  <span className="text-xs text-coffee-400 tabular-nums">{u.total_hours}h</span>
                  {i < 3 && <span className="text-xs">🏆</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}