import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { SUBJECTS, coinsForMinutes } from '@/lib/constants';

interface StudyContextValue {
  seconds: number;
  running: boolean;
  subject: string;
  saving: boolean;
  setSubject: (sub: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  endSession: () => Promise<boolean>;
}

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();

  const [subject, setSubject] = useState<string>(() => profile?.main_subject ?? SUBJECTS[0]);
  const [seconds, setSeconds] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Anti-Cheat & Speed-Hack Protection Refs:
  // Tracks physical wall-clock timestamps to prevent interval acceleration or variable spoofing
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastResumeTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update default subject if profile loads
  useEffect(() => {
    if (profile?.main_subject && !subject) {
      setSubject(profile.main_subject);
    }
  }, [profile?.main_subject, subject]);

  // Global Verified Timer Loop
  useEffect(() => {
    if (running) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
      }
      lastResumeTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        // Calculate true elapsed wall-clock milliseconds
        const currentSegmentMs = lastResumeTimeRef.current ? Date.now() - lastResumeTimeRef.current : 0;
        const totalPhysicalMs = accumulatedMsRef.current + currentSegmentMs;
        const verifiedSeconds = Math.floor(totalPhysicalMs / 1000);

        setSeconds(verifiedSeconds);
      }, 1000);
    } else {
      if (lastResumeTimeRef.current) {
        accumulatedMsRef.current += Date.now() - lastResumeTimeRef.current;
        lastResumeTimeRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running]);

  // Dynamic Browser Tab Title across the entire application
  useEffect(() => {
    if (running) {
      const h = Math.floor(seconds / 3600);
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      const timeString = h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
      document.title = `(${timeString}) StudyQuest`;
    } else {
      document.title = 'StudyQuest';
    }

    return () => {
      document.title = 'StudyQuest';
    };
  }, [seconds, running]);

  // Accidental Tab Close / Refresh Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (running && seconds >= 60) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [running, seconds]);

  const startTimer = () => setRunning(true);
  const pauseTimer = () => setRunning(false);
  const toggleTimer = () => setRunning((prev) => !prev);
  const resetTimer = () => {
    setRunning(false);
    setSeconds(0);
    sessionStartTimeRef.current = null;
    lastResumeTimeRef.current = null;
    accumulatedMsRef.current = 0;
  };

  const endSession = async (): Promise<boolean> => {
    // Re-verify against physical wall-clock time
    const currentSegmentMs = lastResumeTimeRef.current ? Date.now() - lastResumeTimeRef.current : 0;
    const totalPhysicalMs = accumulatedMsRef.current + currentSegmentMs;
    const verifiedPhysicalSeconds = Math.floor(totalPhysicalMs / 1000);

    // Anti-Cheat Clamping: Prevent spoofed seconds values
    const finalSeconds = Math.min(seconds, verifiedPhysicalSeconds);

    if (!user || finalSeconds < 60) {
      resetTimer();
      return false;
    }

    setSaving(true);
    setRunning(false);

    const mins = Math.floor(finalSeconds / 60);
    const cleanSubject = subject || (profile?.main_subject ?? SUBJECTS[0]);

    // 1. Primary Secure RPC: Awards coins and creates verified study log on the server
    const { error: rpcError } = await supabase.rpc('log_study_session', {
      p_subject: cleanSubject,
      p_minutes: mins,
    });

    if (rpcError) {
      console.warn('log_study_session RPC fallback:', rpcError.message);

      // Fallback in case RPC migration has not been applied yet
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
    resetTimer();
    setSaving(false);
    return true;
  };

  return (
    <StudyContext.Provider
      value={{
        seconds,
        running,
        subject,
        saving,
        setSubject,
        startTimer,
        pauseTimer,
        toggleTimer,
        resetTimer,
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
