import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  SkipForward, 
  Settings, 
  Sparkles, 
  Coffee, 
  Flame, 
  Check, 
  X,
  Plus,
  Minus
} from 'lucide-react';
import { useStudy } from '@/context/StudyContext';
import { SUBJECTS } from '@/lib/constants';

export default function Room() {
  const {
    timerMode,
    setTimerMode,
    seconds,
    running,
    subject,
    saving,
    setSubject,
    toggleTimer,
    resetTimer,
    endSession,
    pomoPhase,
    pomoTimeLeft,
    pomoCycle,
    pomoSettings,
    setPomoSettings,
    selectPomoPhase,
    skipPomoPhase,
    totalCoinsEarned,
  } = useStudy();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isCustomSubject, setIsCustomSubject] = useState(false);

  // Alphabetically sorted subjects including any custom subjects
  const availableSubjects = useMemo(() => {
    const set = new Set<string>(SUBJECTS);
    if (subject && subject.trim()) set.add(subject.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [subject]);

  // Local draft settings for the modal
  const [draftFocus, setDraftFocus] = useState(pomoSettings.focusMinutes);
  const [draftShortBreak, setDraftShortBreak] = useState(pomoSettings.shortBreakMinutes);
  const [draftLongBreak, setDraftLongBreak] = useState(pomoSettings.longBreakMinutes);
  const [draftInterval, setDraftInterval] = useState(pomoSettings.longBreakInterval);
  const [draftAutoBreaks, setDraftAutoBreaks] = useState(pomoSettings.autoStartBreaks);
  const [draftAutoFocus, setDraftAutoFocus] = useState(pomoSettings.autoStartFocus);

  // Sync draft when opening modal
  useEffect(() => {
    if (showSettingsModal) {
      setDraftFocus(pomoSettings.focusMinutes);
      setDraftShortBreak(pomoSettings.shortBreakMinutes);
      setDraftLongBreak(pomoSettings.longBreakMinutes);
      setDraftInterval(pomoSettings.longBreakInterval);
      setDraftAutoBreaks(pomoSettings.autoStartBreaks);
      setDraftAutoFocus(pomoSettings.autoStartFocus);
    }
  }, [showSettingsModal, pomoSettings]);

  useEffect(() => {
    const urlSubject = searchParams.get('subject');
    if (urlSubject) {
      setSubject(urlSubject);
    }
  }, [searchParams, setSubject]);

  // Stopwatch Display Formats
  const swHours = Math.floor(seconds / 3600);
  const swMinutes = Math.floor((seconds % 3600) / 60);
  const swSeconds = seconds % 60;

  // Pomodoro Display Formats
  const pomoMinutes = Math.floor(pomoTimeLeft / 60);
  const pomoSeconds = pomoTimeLeft % 60;

  // Current Phase Total Duration for Progress Ring
  const currentPhaseTotalSeconds = (
    pomoPhase === 'focus'
      ? pomoSettings.focusMinutes
      : pomoPhase === 'shortBreak'
      ? pomoSettings.shortBreakMinutes
      : pomoSettings.longBreakMinutes
  ) * 60;

  const pomoProgressRatio = currentPhaseTotalSeconds > 0
    ? (currentPhaseTotalSeconds - pomoTimeLeft) / currentPhaseTotalSeconds
    : 0;

  const handleEnd = async () => {
    await endSession();
    navigate('/dashboard');
  };

  const handleSaveSettings = () => {
    const nextSettings = {
      focusMinutes: Math.max(1, Math.min(180, draftFocus || 25)),
      shortBreakMinutes: Math.max(1, Math.min(60, draftShortBreak || 5)),
      longBreakMinutes: Math.max(1, Math.min(90, draftLongBreak || 15)),
      longBreakInterval: Math.max(1, Math.min(12, draftInterval || 4)),
      autoStartBreaks: draftAutoBreaks,
      autoStartFocus: draftAutoFocus,
    };
    setPomoSettings(nextSettings);
    setShowSettingsModal(false);
  };

  const applyPreset = (focus: number, sBreak: number, lBreak: number) => {
    setDraftFocus(focus);
    setDraftShortBreak(sBreak);
    setDraftLongBreak(lBreak);
  };

  return (
    <div className="animate-fade-in flex flex-col relative z-10">
      {/* Top Bar: Subject Selector & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="flex-1 max-w-xs">
          <p className="text-xs text-coffee-400 font-medium tracking-wide uppercase mb-1">Subject</p>
          
          {isCustomSubject ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Type new subject..."
                className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl bg-coffee-800/80 border border-primary-500/50 text-white focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomSubject(false);
                  if (!subject) setSubject('General');
                }}
                className="p-2 rounded-xl bg-coffee-800 text-coffee-400 hover:text-white border border-white/5 transition-colors"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <select
              value={subject || 'General'}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM_NEW') {
                  setSubject('');
                  setIsCustomSubject(true);
                } else {
                  setSubject(e.target.value);
                }
              }}
              className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl bg-coffee-950/80 border border-white/10 text-white focus:outline-none focus:border-primary-500/50 cursor-pointer transition-all shadow-inner"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s} className="bg-coffee-900 text-white font-medium">
                  {s}
                </option>
              ))}
              <option value="CUSTOM_NEW" className="bg-coffee-900 font-bold text-primary-400">
                ➕ Create new subject...
              </option>
            </select>
          )}
        </div>
        
        {/* Stopwatch vs Pomodoro Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-coffee-950/80 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => setTimerMode('stopwatch')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                timerMode === 'stopwatch'
                  ? 'bg-[#f1d6b9] text-coffee-950 shadow'
                  : 'text-coffee-400 hover:text-white'
              }`}
            >
              <span>⏱️</span>
              <span>Stopwatch</span>
            </button>
            <button
              onClick={() => setTimerMode('pomodoro')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                timerMode === 'pomodoro'
                  ? 'bg-[#f1d6b9] text-coffee-950 shadow'
                  : 'text-coffee-400 hover:text-white'
              }`}
            >
              <span>🍅</span>
              <span>Pomodoro</span>
            </button>
          </div>

          {timerMode === 'pomodoro' && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-coffee-900/80 hover:bg-coffee-800 text-coffee-400 hover:text-white border border-white/10 transition-all"
              title="Custom Pomodoro Settings"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Pomodoro Phase Selector & Cycle Status (Only in Pomodoro Mode) */}
      {timerMode === 'pomodoro' && (
        <div className="flex flex-col items-center gap-3 mb-6 animate-fade-in">
          {/* Phase Tabs */}
          <div className="flex items-center gap-1.5 bg-coffee-950/70 p-1 rounded-2xl border border-white/5 shadow-inner">
            <button
              onClick={() => selectPomoPhase('focus')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                pomoPhase === 'focus'
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'text-coffee-400 hover:text-white border border-transparent'
              }`}
            >
              <Flame size={14} className={pomoPhase === 'focus' ? 'text-primary-300' : ''} />
              <span>Focus ({pomoSettings.focusMinutes}m)</span>
            </button>
            <button
              onClick={() => selectPomoPhase('shortBreak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                pomoPhase === 'shortBreak'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-coffee-400 hover:text-white border border-transparent'
              }`}
            >
              <Coffee size={14} className={pomoPhase === 'shortBreak' ? 'text-emerald-300' : ''} />
              <span>Short Break ({pomoSettings.shortBreakMinutes}m)</span>
            </button>
            <button
              onClick={() => selectPomoPhase('longBreak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                pomoPhase === 'longBreak'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-coffee-400 hover:text-white border border-transparent'
              }`}
            >
              <Sparkles size={14} className={pomoPhase === 'longBreak' ? 'text-blue-300' : ''} />
              <span>Long Break ({pomoSettings.longBreakMinutes}m)</span>
            </button>
          </div>

          {/* Cycle Dots */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-coffee-400 font-medium">Cycle {pomoCycle} of {pomoSettings.longBreakInterval}</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: pomoSettings.longBreakInterval }).map((_, idx) => {
                const isCurrent = idx + 1 === pomoCycle;
                const isPassed = idx + 1 < pomoCycle;
                return (
                  <span
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isCurrent
                        ? 'bg-primary-400 scale-125 ring-2 ring-primary-400/40'
                        : isPassed
                        ? 'bg-primary-500/50'
                        : 'bg-coffee-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Center Circular Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6">
        <div className={`relative w-64 h-64 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${running ? 'animate-pulse-glow' : ''}`}>
          <div className="absolute inset-0 rounded-full border-2 border-coffee-800/80" />
          
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 256 256">
            <circle
              cx="128" cy="128" r="122"
              fill="none"
              stroke={
                timerMode === 'pomodoro' && pomoPhase !== 'focus'
                  ? 'url(#breakGrad)'
                  : 'url(#grad)'
              }
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 122}
              strokeDashoffset={
                timerMode === 'stopwatch'
                  ? 2 * Math.PI * 122 * (1 - (seconds % 3600) / 3600)
                  : 2 * Math.PI * 122 * (1 - pomoProgressRatio)
              }
              className="transition-all duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="breakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          <div className="text-center select-none">
            {timerMode === 'stopwatch' ? (
              <>
                <p className="text-5xl font-bold text-white tabular-nums tracking-tight drop-shadow-md">
                  {String(swHours).padStart(2, '0')}:{String(swMinutes).padStart(2, '0')}:{String(swSeconds).padStart(2, '0')}
                </p>
                <p className="text-sm text-coffee-400 mt-2 font-medium">
                  {totalCoinsEarned} coin{totalCoinsEarned !== 1 ? 's' : ''} earned
                </p>
              </>
            ) : (
              <>
                <p className="text-5xl font-bold text-white tabular-nums tracking-tight drop-shadow-md">
                  {String(pomoMinutes).padStart(2, '0')}:{String(pomoSeconds).padStart(2, '0')}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider mt-1 text-primary-300">
                  {pomoPhase === 'focus' ? '🎯 Focus Session' : pomoPhase === 'shortBreak' ? '☕ Short Break' : '🌴 Long Break'}
                </p>
                <p className="text-xs text-coffee-400 mt-1">
                  {pomoPhase === 'focus' 
                    ? `${totalCoinsEarned} coin${totalCoinsEarned !== 1 ? 's' : ''} earned` 
                    : 'Break time (no coins)'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-4 mb-4">
          {/* Reset / Restart Phase button */}
          <button
            onClick={resetTimer}
            className="w-12 h-12 rounded-full bg-coffee-800/80 hover:bg-coffee-700 text-coffee-300 hover:text-white border border-white/5 flex items-center justify-center transition-all active:scale-95"
            title="Reset timer"
          >
            <RotateCcw size={18} />
          </button>

          {/* Primary Play / Pause Button */}
          <button
            onClick={toggleTimer}
            className="w-16 h-16 rounded-full bg-[#f1d6b9] text-coffee-950 flex items-center justify-center shadow-xl shadow-black/30 hover:scale-105 active:scale-95 transition-all"
            title={running ? 'Pause timer' : 'Start timer'}
          >
            {running ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>

          {/* In Pomodoro: Skip Phase; In Stopwatch: End Session */}
          {timerMode === 'pomodoro' ? (
            <button
              onClick={skipPomoPhase}
              className="w-12 h-12 rounded-full bg-coffee-800/80 hover:bg-coffee-700 text-coffee-300 hover:text-white border border-white/5 flex items-center justify-center transition-all active:scale-95"
              title="Skip to next phase"
            >
              <SkipForward size={18} />
            </button>
          ) : (
            <button
              onClick={handleEnd}
              disabled={saving || seconds < 60}
              className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center hover:bg-rose-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
              title="End session & claim coins"
            >
              <Square size={20} fill="currentColor" />
            </button>
          )}
        </div>

        {/* Pomodoro End Session / Save Button */}
        {timerMode === 'pomodoro' && (
          <button
            onClick={handleEnd}
            disabled={saving || totalCoinsEarned < 1}
            className="mt-2 px-5 py-2 rounded-xl bg-coffee-900/80 hover:bg-rose-500/20 text-coffee-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Square size={14} fill="currentColor" />
            <span>End Session & Save ({totalCoinsEarned} coins)</span>
          </button>
        )}

        {saving && <p className="text-sm text-coffee-400 animate-pulse mt-4">Saving study session…</p>}
      </div>

      {/* Custom Pomodoro Settings Modal */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="glass-card bg-coffee-950/95 border border-primary-500/30 w-full max-w-md p-6 rounded-3xl shadow-2xl animate-slide-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-500/20 text-primary-300 flex items-center justify-center">
                  <Settings size={18} />
                </div>
                <h3 className="text-lg font-bold text-white">Pomodoro Settings</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-coffee-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-5">
              <p className="text-xs font-medium text-coffee-400 mb-2">Quick Presets</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(25, 5, 15)}
                  className="py-2 px-2.5 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-xs font-medium text-coffee-200 border border-white/5 hover:border-primary-500/30 transition-all text-center"
                >
                  <p className="font-bold text-white">Classic</p>
                  <p className="text-[10px] text-coffee-400">25 / 5 / 15m</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(50, 10, 30)}
                  className="py-2 px-2.5 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-xs font-medium text-coffee-200 border border-white/5 hover:border-primary-500/30 transition-all text-center"
                >
                  <p className="font-bold text-white">Deep Work</p>
                  <p className="text-[10px] text-coffee-400">50 / 10 / 30m</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(15, 3, 10)}
                  className="py-2 px-2.5 rounded-xl bg-coffee-900 hover:bg-coffee-800 text-xs font-medium text-coffee-200 border border-white/5 hover:border-primary-500/30 transition-all text-center"
                >
                  <p className="font-bold text-white">Sprint</p>
                  <p className="text-[10px] text-coffee-400">15 / 3 / 10m</p>
                </button>
              </div>
            </div>

            {/* Custom Interval Steppers */}
            <div className="space-y-4 mb-6">
              {/* Focus Duration */}
              <div className="flex items-center justify-between bg-coffee-900/60 p-3 rounded-2xl border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Focus Duration</p>
                  <p className="text-xs text-coffee-400">Time spent in deep study</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftFocus((prev) => Math.max(1, prev - 5))}
                    className="w-8 h-8 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-white flex items-center justify-center transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-white tabular-nums text-sm">
                    {draftFocus}m
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftFocus((prev) => Math.min(180, prev + 5))}
                    className="w-8 h-8 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-white flex items-center justify-center transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Short Break */}
              <div className="flex items-center justify-between bg-coffee-900/60 p-3 rounded-2xl border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Short Break</p>
                  <p className="text-xs text-coffee-400">Quick rest between cycles</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftShortBreak((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-white flex items-center justify-center transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-white tabular-nums text-sm">
                    {draftShortBreak}m
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftShortBreak((prev) => Math.min(60, prev + 1))}
                    className="w-8 h-8 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-white flex items-center justify-center transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Long Break */}
              <div className="flex items-center justify-between bg-coffee-900/60 p-3 rounded-2xl border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Long Break</p>
                  <p className="text-xs text-coffee-400">Extended rest interval</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftLongBreak((prev) => Math.max(1, prev - 5))}
                    className="w-8 h-8 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-white flex items-center justify-center transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-white tabular-nums text-sm">
                    {draftLongBreak}m
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftLongBreak((prev) => Math.min(90, prev + 5))}
                    className="w-8 h-8 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-white flex items-center justify-center transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Long Break Interval */}
              <div className="flex items-center justify-between bg-coffee-900/60 p-3 rounded-2xl border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">Long Break Every</p>
                  <p className="text-xs text-coffee-400">Number of focus sessions</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftInterval((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-white flex items-center justify-center transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-bold text-white tabular-nums text-sm">
                    {draftInterval}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftInterval((prev) => Math.min(12, prev + 1))}
                    className="w-8 h-8 rounded-lg bg-coffee-800 hover:bg-coffee-700 text-white flex items-center justify-center transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Auto Start Toggles */}
            <div className="space-y-2 mb-6">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-coffee-300">Auto-start Breaks</span>
                <input
                  type="checkbox"
                  checked={draftAutoBreaks}
                  onChange={(e) => setDraftAutoBreaks(e.target.checked)}
                  className="rounded bg-coffee-800 border-white/10 text-primary-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-coffee-300">Auto-start Focus sessions</span>
                <input
                  type="checkbox"
                  checked={draftAutoFocus}
                  onChange={(e) => setDraftAutoFocus(e.target.checked)}
                  className="rounded bg-coffee-800 border-white/10 text-primary-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              className="w-full py-3.5 rounded-2xl bg-[#f1d6b9] text-coffee-950 font-bold hover:brightness-95 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Check size={18} />
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}