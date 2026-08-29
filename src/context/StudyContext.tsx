import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { SUBJECTS, coinsForMinutes } from '@/lib/constants';

export type TimerMode = 'stopwatch' | 'pomodoro';
export type PomoPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface PomoSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

const DEFAULT_POMO_SETTINGS: PomoSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

const POMO_SETTINGS_STORAGE_KEY = 'studyquest_pomo_settings';

// Web Audio API Synthesizer for pleasant, offline interval alerts
function playChime(type: 'focus_end' | 'break_end') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'focus_end') {
      // Ascending major chord chime (C5 -> E5 -> G5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } else {
      // Gentle resumption chime (G4 -> C5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.00, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    }
  } catch {}
}

interface StudyContextValue {
  // Mode
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  subject: string;
  setSubject: (sub: string) => void;
  running: boolean;
  saving: boolean;

  // Stopwatch state
  seconds: number;

  // Pomodoro state
  pomoPhase: PomoPhase;
  pomoTimeLeft: number;
  pomoCycle: number;
  pomoSettings: PomoSettings;
  setPomoSettings: (settings: PomoSettings | ((prev: PomoSettings) => PomoSettings)) => void;
  totalPomoFocusSeconds: number;

  // Derived Coins
  totalCoinsEarned: number;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  skipPomoPhase: () => void;
  selectPomoPhase: (phase: PomoPhase) => void;
  endSession: () => Promise<boolean>;
}

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();

  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [subject, setSubject] = useState<string>(() => profile?.main_subject ?? SUBJECTS[0]);
  const [running, setRunning] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Stopwatch State
  const [seconds, setSeconds] = useState<number>(0);

  // Pomodoro Settings & State
  const [pomoSettings, setPomoSettingsState] = useState<PomoSettings>(() => {
    try {
      const stored = localStorage.getItem(POMO_SETTINGS_STORAGE_KEY);
      if (stored) return { ...DEFAULT_POMO_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_POMO_SETTINGS;
  });

  const [pomoPhase, setPomoPhase] = useState<PomoPhase>('focus');
  const [pomoTimeLeft, setPomoTimeLeft] = useState<number>(() => pomoSettings.focusMinutes * 60);
  const [pomoCycle, setPomoCycle] = useState<number>(1);
  const [totalPomoFocusSeconds, setTotalPomoFocusSeconds] = useState<number>(0);

  // Anti-Cheat & Physical Wall-Clock Timing Refs
  const lastResumeTimeRef = useRef<number | null>(null);
  const accumulatedStopwatchMsRef = useRef<number>(0);
  const accumulatedPomoMsRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist Pomodoro settings
  const setPomoSettings = (updater: PomoSettings | ((prev: PomoSettings) => PomoSettings)) => {
    setPomoSettingsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(POMO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      // If timer is not currently running and we are in the phase being updated, sync the remaining seconds
      if (!running) {
        if (pomoPhase === 'focus') setPomoTimeLeft(next.focusMinutes * 60);
        else if (pomoPhase === 'shortBreak') setPomoTimeLeft(next.shortBreakMinutes * 60);
        else if (pomoPhase === 'longBreak') setPomoTimeLeft(next.longBreakMinutes * 60);
      }
      return next;
    });
  };

  // Sync default subject from profile
  useEffect(() => {
    if (profile?.main_subject && !subject) {
      setSubject(profile.main_subject);
    }
  }, [profile?.main_subject, subject]);

  // Main Timer Loop (handles Stopwatch & Pomodoro)
  useEffect(() => {
    if (running) {
      lastResumeTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const deltaMs = lastResumeTimeRef.current ? now - lastResumeTimeRef.current : 1000;
        lastResumeTimeRef.current = now;

        if (timerMode === 'stopwatch') {
          accumulatedStopwatchMsRef.current += deltaMs;
          setSeconds(Math.floor(accumulatedStopwatchMsRef.current / 1000));
        } else {
          // Pomodoro mode
          accumulatedPomoMsRef.current += deltaMs;

          if (pomoPhase === 'focus') {
            setTotalPomoFocusSeconds((prev) => prev + 1);
          }

          setPomoTimeLeft((prev) => {
            if (prev <= 1) {
              // Phase Completed!
              handlePhaseComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      lastResumeTimeRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, timerMode, pomoPhase, pomoCycle, pomoSettings]);

  // Handle phase completion transition
  const handlePhaseComplete = () => {
    if (pomoPhase === 'focus') {
      playChime('focus_end');
      const isLongBreak = pomoCycle % pomoSettings.longBreakInterval === 0;
      const nextPhase: PomoPhase = isLongBreak ? 'longBreak' : 'shortBreak';
      const durationSeconds = (isLongBreak ? pomoSettings.longBreakMinutes : pomoSettings.shortBreakMinutes) * 60;

      setPomoPhase(nextPhase);
      setPomoTimeLeft(durationSeconds);
      setRunning(pomoSettings.autoStartBreaks);
    } else {
      // Break completed -> Return to Focus
      playChime('break_end');
      setPomoPhase('focus');
      setPomoTimeLeft(pomoSettings.focusMinutes * 60);
      setPomoCycle((prev) => (pomoPhase === 'longBreak' ? 1 : prev + 1));
      setRunning(pomoSettings.autoStartFocus);
    }
  };

  // Dynamic Browser Tab Title across the entire application
  useEffect(() => {
    if (running) {
      if (timerMode === 'stopwatch') {
        const h = Math.floor(seconds / 3600);
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        const timeString = h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
        document.title = `(${timeString}) StudyQuest`;
      } else {
        const m = String(Math.floor(pomoTimeLeft / 60)).padStart(2, '0');
        const s = String(pomoTimeLeft % 60).padStart(2, '0');
        const phaseLabel = pomoPhase === 'focus' ? 'Focus' : 'Break';
        document.title = `(${m}:${s}) ${phaseLabel} • StudyQuest`;
      }
    } else {
      document.title = 'StudyQuest';
    }

    return () => {
      document.title = 'StudyQuest';
    };
  }, [seconds, pomoTimeLeft, running, timerMode, pomoPhase]);

  // Accidental Tab Close / Refresh Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const activeStudyTime = timerMode === 'stopwatch' ? seconds : totalPomoFocusSeconds;
      if (running && activeStudyTime >= 60) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [running, seconds, totalPomoFocusSeconds, timerMode]);

  const startTimer = () => setRunning(true);
  const pauseTimer = () => setRunning(false);
  const toggleTimer = () => setRunning((prev) => !prev);

  const resetTimer = () => {
    setRunning(false);
    if (timerMode === 'stopwatch') {
      setSeconds(0);
      accumulatedStopwatchMsRef.current = 0;
    } else {
      if (pomoPhase === 'focus') setPomoTimeLeft(pomoSettings.focusMinutes * 60);
      else if (pomoPhase === 'shortBreak') setPomoTimeLeft(pomoSettings.shortBreakMinutes * 60);
      else if (pomoPhase === 'longBreak') setPomoTimeLeft(pomoSettings.longBreakMinutes * 60);
    }
  };

  const selectPomoPhase = (phase: PomoPhase) => {
    setRunning(false);
    setPomoPhase(phase);
    if (phase === 'focus') setPomoTimeLeft(pomoSettings.focusMinutes * 60);
    else if (phase === 'shortBreak') setPomoTimeLeft(pomoSettings.shortBreakMinutes * 60);
    else if (phase === 'longBreak') setPomoTimeLeft(pomoSettings.longBreakMinutes * 60);
  };

  const skipPomoPhase = () => {
    setRunning(false);
    handlePhaseComplete();
  };

  // Coins earned calculation (Only focus minutes earn coins!)
  const activeFocusMinutes = timerMode === 'stopwatch'
    ? Math.floor(seconds / 60)
    : Math.floor(totalPomoFocusSeconds / 60);

  const totalCoinsEarned = coinsForMinutes(activeFocusMinutes);

  const endSession = async (): Promise<boolean> => {
    const verifiedFocusSeconds = timerMode === 'stopwatch' ? seconds : totalPomoFocusSeconds;
    const mins = Math.floor(verifiedFocusSeconds / 60);

    if (!user || mins < 1) {
      setRunning(false);
      setSeconds(0);
      setTotalPomoFocusSeconds(0);
      accumulatedStopwatchMsRef.current = 0;
      accumulatedPomoMsRef.current = 0;
      return false;
    }

    setSaving(true);
    setRunning(false);

    const cleanSubject = subject || (profile?.main_subject ?? SUBJECTS[0]);

    // 1. Primary Secure RPC: Awards coins and creates verified study log on the server
    const { error: rpcError } = await supabase.rpc('log_study_session', {
      p_subject: cleanSubject,
      p_minutes: mins,
    });

    if (rpcError) {
      console.warn('log_study_session RPC fallback:', rpcError.message);
      const { error: insertError } = await supabase.from('study_logs').insert({
        user_id: user.id,
        subject: cleanSubject,
        minutes: mins,
        manual: false,
      });

      if (insertError) {
        console.error('Failed to log study session:', insertError.message);
      } else if (profile) {
        const coins = coinsForMinutes(mins);
        if (coins > 0) {
          await supabase
            .from('profiles')
            .update({ coins: profile.coins + coins })
            .eq('id', user.id);
        }
      }
    }

    await refreshProfile();
    setSeconds(0);
    setTotalPomoFocusSeconds(0);
    accumulatedStopwatchMsRef.current = 0;
    accumulatedPomoMsRef.current = 0;
    if (timerMode === 'pomodoro') {
      setPomoPhase('focus');
      setPomoTimeLeft(pomoSettings.focusMinutes * 60);
      setPomoCycle(1);
    }
    setSaving(false);
    return true;
  };

  return (
    <StudyContext.Provider
      value={{
        timerMode,
        setTimerMode,
        subject,
        setSubject,
        running,
        saving,
        seconds,
        pomoPhase,
        pomoTimeLeft,
        pomoCycle,
        pomoSettings,
        setPomoSettings,
        totalPomoFocusSeconds,
        totalCoinsEarned,
        startTimer,
        pauseTimer,
        toggleTimer,
        resetTimer,
        skipPomoPhase,
        selectPomoPhase,
        endSession,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
