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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update default subject if user profile loads and subject hasn't been modified
  useEffect(() => {
    if (profile?.main_subject && !subject) {
      setSubject(profile.main_subject);
    }
  }, [profile?.main_subject, subject]);

  // Global Timer Interval
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
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
  };

  const endSession = async (): Promise<boolean> => {
    if (!user || seconds < 60) {
      setRunning(false);
      setSeconds(0);
      return false;
    }

    setSaving(true);
    setRunning(false);

    const mins = Math.floor(seconds / 60);
    const coins = coinsForMinutes(mins);

    const { error: insertError } = await supabase.from('study_logs').insert({
      user_id: user.id,
      subject: subject || (profile?.main_subject ?? SUBJECTS[0]),
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
    setSeconds(0);
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

