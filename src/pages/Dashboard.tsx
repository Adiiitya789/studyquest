import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { SUBJECTS, coinsForMinutes } from '@/lib/constants';
import { getUnlockedBadges, getNextBadge, getBadgeIcon } from '@/lib/badges';
import type { StudyLog } from '@/lib/types';
import CoinBadge from '@/components/CoinBadge';
import VipBadge from '@/components/VipBadge';
import { Play, Plus, Flame, Clock, X } from 'lucide-react';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // 1. Added a dedicated state for the greeting
  const [greeting, setGreeting] = useState('Good morning');
  
  const [selectedSubject, setSelectedSubject] = useState(profile?.main_subject ?? SUBJECTS[0]);
  const [isCustomSubject, setIsCustomSubject] = useState(false);

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualSubject, setManualSubject] = useState(profile?.main_subject ?? SUBJECTS[0]);
  const [isManualCustom, setIsManualCustom] = useState(false);

  // Alphabetically sorted subject list with custom subjects included
  const availableSubjects = useMemo(() => {
    const set = new Set<string>(SUBJECTS);
    if (profile?.main_subject) set.add(profile.main_subject.trim());
    if (selectedSubject && selectedSubject.trim()) set.add(selectedSubject.trim());
    if (manualSubject && manualSubject.trim()) set.add(manualSubject.trim());
    (logs ?? []).forEach((l) => {
      if (l.subject && l.subject.trim()) set.add(l.subject.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [profile?.main_subject, selectedSubject, manualSubject, logs]);

  // 2. Added a robust time-checker that updates automatically
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    };
    
    updateGreeting(); // Check time immediately on load
    
    // Check the time every minute in case they leave the tab open
    const interval = setInterval(updateGreeting, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: logData } = await supabase
        .from('study_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setLogs(logData as StudyLog[] ?? []);

      const { data: allLogs } = await supabase
        .from('study_logs')
        .select('minutes, created_at')
        .eq('user_id', user.id)
        .eq('manual', false);
      const mins = (allLogs ?? []).reduce((sum, l) => sum + l.minutes, 0);
      setTotalMinutes(mins);

      const dates = new Set<string>();
      (allLogs ?? []).forEach((l) => {
        const d = new Date(l.created_at);
        dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      });
      let s = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (dates.has(key)) s++;
        else if (i > 0) break;
      }
      setStreak(s);
    })();
  }, [user]);

  const totalHours = totalMinutes / 60;
  const unlockedBadges = getUnlockedBadges(totalHours);
  const nextBadge = getNextBadge(totalHours);
  const progress = nextBadge
    ? Math.min(100, ((totalHours - (unlockedBadges.length > 0 ? unlockedBadges[unlockedBadges.length - 1].hours : 0)) / (nextBadge.hours - (unlockedBadges.length > 0 ? unlockedBadges[unlockedBadges.length - 1].hours : 0))) * 100)
    : 100;

  async function handleManualLog() {
    if (!user) return;
    const minutes = parseInt(manualMinutes, 10);
    if (!minutes || minutes <= 0) return;
    await supabase.from('study_logs').insert({
      user_id: user.id,
      subject: manualSubject,
      minutes,
      manual: true,
    });
    setShowManualModal(false);
    setManualMinutes('');
    const { data: logData } = await supabase
      .from('study_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setLogs(logData as StudyLog[] ?? []);
  }

  async function startSession() {
    navigate(`/room?subject=${encodeURIComponent(selectedSubject)}`);
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-coffee-400">{greeting},</p>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{profile?.display_name ?? 'Student'}</span>
            {profile?.is_vip && <VipBadge size="xs" />}
          </h1>
        </div>
        <CoinBadge />
      </div>

      {/* Streak banner */}
      <div className="glass-card p-4 mb-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center">
          <Flame size={22} className="text-orange-400" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-white tabular-nums">{streak}</p>
          <p className="text-xs text-coffee-400">day streak</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white tabular-nums">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-coffee-400">total studied</p>
        </div>
      </div>

      {/* Hero start session */}
      <div className="glass-card p-6 mb-5 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-sm text-coffee-400 mb-2">Start a new session</p>
          
          {isCustomSubject ? (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                autoFocus
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                placeholder="Type new subject..."
                className="flex-1 px-4 py-3 rounded-xl bg-coffee-800/60 border border-white/5 text-white focus:outline-none focus:border-primary-500/50 transition-all"
              />
              <button
                onClick={() => {
                  setIsCustomSubject(false);
                  if (!selectedSubject) setSelectedSubject(profile?.main_subject ?? SUBJECTS[0]);
                }}
                className="px-4 py-3 rounded-xl bg-coffee-800/60 text-coffee-400 hover:text-white border border-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <select
              value={selectedSubject}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM_NEW') {
                  setSelectedSubject('');
                  setIsCustomSubject(true);
                } else {
                  setSelectedSubject(e.target.value);
                }
              }}
              className="w-full mb-4 px-4 py-3 rounded-xl bg-coffee-800/60 border border-white/5 text-white focus:outline-none focus:border-primary-500/50 transition-all"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s} className="bg-coffee-800">{s}</option>
              ))}
              <option value="CUSTOM_NEW" className="bg-coffee-800 font-bold text-primary-400">➕ Create new subject...</option>
            </select>
          )}

          <button
            onClick={startSession}
            className="w-full py-4 rounded-xl bg-[#f1d6b9] text-coffee-900 font-bold text-lg shadow-lg shadow-black/20 hover:brightness-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Play size={22} fill="currentColor" />
            Start Session
          </button>
        </div>
      </div>

      {/* Badge progress */}
      <div className="glass-card p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Next Badge</p>
          {nextBadge && <p className="text-xs text-coffee-400">{totalHours.toFixed(1)}h / {nextBadge.hours}h</p>}
        </div>
        {nextBadge ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-coffee-800 flex items-center justify-center">
                {(() => {
                  const Icon = getBadgeIcon(nextBadge);
                  return <Icon size={20} className="text-coffee-500" />;
                })()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{nextBadge.name}</p>
                <p className="text-xs text-coffee-400">{(nextBadge.hours - totalHours).toFixed(1)}h to go</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-coffee-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-primary-300">All badges unlocked!</p>
        )}
      </div>

      {/* Recent logs */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Recent Activity</p>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1 text-xs font-medium text-primary-300 hover:text-primary-200 transition-colors"
          >
            <Plus size={14} /> Add Manual Log
          </button>
        </div>
        {logs.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Clock size={32} className="mx-auto text-coffee-600 mb-2" />
            <p className="text-sm text-coffee-400">No study sessions yet. Start one above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="glass-card px-4 py-3 flex items-center justify-between animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${log.manual ? 'bg-coffee-700/50' : 'bg-primary-500/10'}`}>
                    <Clock size={16} className={log.manual ? 'text-coffee-400' : 'text-primary-300'} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{log.subject}</p>
                    <p className="text-xs text-coffee-500">
                      {log.manual && 'Manual · '}{log.minutes} min · {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {!log.manual && (
                  <span className="text-xs font-semibold text-amber-400">+{coinsForMinutes(log.minutes)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual log modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowManualModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Manual Log</h3>
              <button onClick={() => setShowManualModal(false)} className="text-coffee-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-coffee-400 mb-1.5 block">Subject</label>
                
                {isManualCustom ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={manualSubject}
                      onChange={(e) => setManualSubject(e.target.value)}
                      placeholder="Type subject..."
                      className="flex-1 px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white focus:outline-none focus:border-primary-500/50 transition-all"
                    />
                    <button
                      onClick={() => {
                        setIsManualCustom(false);
                        if (!manualSubject) setManualSubject(profile?.main_subject ?? SUBJECTS[0]);
                      }}
                      className="px-4 py-3 rounded-xl bg-coffee-800/50 text-coffee-400 hover:text-white border border-white/5"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={manualSubject}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM_NEW') {
                        setManualSubject('');
                        setIsManualCustom(true);
                      } else {
                        setManualSubject(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white focus:outline-none focus:border-primary-500/50 transition-all"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s} value={s} className="bg-coffee-800">{s}</option>
                    ))}
                    <option value="CUSTOM_NEW" className="bg-coffee-800 font-bold text-primary-400">➕ Create new subject...</option>
                  </select>
                )}
                
              </div>
              <div>
                <label className="text-xs font-medium text-coffee-400 mb-1.5 block">Minutes</label>
                <input
                  type="number"
                  min="1"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  placeholder="30"
                  className="w-full px-4 py-3 rounded-xl bg-coffee-800/50 border border-white/5 text-white placeholder-coffee-500 focus:outline-none focus:border-primary-500/50"
                />
                <p className="text-xs text-coffee-500 mt-1.5">Manual logs don't earn coins or badges.</p>
              </div>
              <button
                onClick={handleManualLog}
                className="w-full py-3 rounded-xl bg-[#f1d6b9] text-coffee-900 font-semibold hover:brightness-95 transition-all"
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}