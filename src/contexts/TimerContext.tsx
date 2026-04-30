import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerSettings {
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
}

interface PersistedState {
  mode: TimerMode;
  isRunning: boolean;
  endsAt: number | null;        // epoch ms when current run will hit 0
  remainingMs: number;          // when paused, time left
  selectedSubject: string;
  completedPomodoros: number;
  totalSeconds: number;         // duration of current cycle
  updatedAt: number;
}

interface TimerContextValue {
  mode: TimerMode;
  isRunning: boolean;
  timeLeft: number;             // seconds
  selectedSubject: string;
  completedPomodoros: number;
  totalSeconds: number;
  setMode: (m: TimerMode) => void;
  setSelectedSubject: (id: string) => void;
  toggle: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'pomodoro_timer_state_v1';

const TimerContext = createContext<TimerContextValue | null>(null);

function playBeeps(count = 3) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    let i = 0;
    const tick = () => {
      if (i >= count) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      i++;
      setTimeout(tick, 300);
    };
    tick();
  } catch (e) {
    console.error('beep error', e);
  }
}

interface ProviderProps {
  children: ReactNode;
  settings: TimerSettings;
  onSessionComplete?: (subjectId: string, durationMinutes: number) => void;
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function TimerProvider({ children, settings, onSessionComplete }: ProviderProps) {
  const durations = {
    focus: (settings?.focus_duration || 25) * 60,
    shortBreak: (settings?.short_break_duration || 5) * 60,
    longBreak: (settings?.long_break_duration || 15) * 60,
  };

  const persisted = loadPersisted();

  const [mode, setModeState] = useState<TimerMode>(persisted?.mode ?? 'focus');
  const [isRunning, setIsRunning] = useState<boolean>(persisted?.isRunning ?? false);
  const [endsAt, setEndsAt] = useState<number | null>(persisted?.endsAt ?? null);
  const [remainingMs, setRemainingMs] = useState<number>(
    persisted?.remainingMs ?? durations.focus * 1000
  );
  const [totalSeconds, setTotalSeconds] = useState<number>(
    persisted?.totalSeconds ?? durations.focus
  );
  const [selectedSubject, setSelectedSubjectState] = useState<string>(
    persisted?.selectedSubject ?? ''
  );
  const [completedPomodoros, setCompletedPomodoros] = useState<number>(
    persisted?.completedPomodoros ?? 0
  );
  const [now, setNow] = useState<number>(Date.now());

  const onSessionCompleteRef = useRef(onSessionComplete);
  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);

  const handledZeroRef = useRef(false);

  // Tick every 250ms; uses Date.now diff so it's accurate across tab switches/navigation
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [isRunning]);

  // Compute timeLeft (seconds)
  const timeLeftMs = isRunning && endsAt ? Math.max(0, endsAt - now) : remainingMs;
  const timeLeft = Math.ceil(timeLeftMs / 1000);

  // Persist
  useEffect(() => {
    const state: PersistedState = {
      mode,
      isRunning,
      endsAt,
      remainingMs,
      selectedSubject,
      completedPomodoros,
      totalSeconds,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [mode, isRunning, endsAt, remainingMs, selectedSubject, completedPomodoros, totalSeconds]);

  // Handle completion
  useEffect(() => {
    if (!isRunning || !endsAt) return;
    if (timeLeftMs > 0) {
      handledZeroRef.current = false;
      return;
    }
    if (handledZeroRef.current) return;
    handledZeroRef.current = true;

    setIsRunning(false);
    setEndsAt(null);
    setRemainingMs(0);
    playBeeps(3);

    try {
      if (mode === 'focus') {
        if (selectedSubject) {
          onSessionCompleteRef.current?.(selectedSubject, settings?.focus_duration || 25);
        }
        const next = completedPomodoros + 1;
        setCompletedPomodoros(next);
        toast.success('Pomodoro concluído! Hora de descansar.');
        const nextMode: TimerMode =
          next % (settings?.sessions_until_long_break || 4) === 0 ? 'longBreak' : 'shortBreak';
        const nextDur =
          (nextMode === 'longBreak'
            ? settings?.long_break_duration || 15
            : settings?.short_break_duration || 5) * 60;
        setModeState(nextMode);
        setTotalSeconds(nextDur);
        setRemainingMs(nextDur * 1000);
      } else {
        toast.success('Pausa finalizada! Pronto para focar.');
        const nextDur = (settings?.focus_duration || 25) * 60;
        setModeState('focus');
        setTotalSeconds(nextDur);
        setRemainingMs(nextDur * 1000);
      }
    } catch (e) {
      console.error('Timer completion error:', e);
      toast.error('Ocorreu um erro ao completar o timer');
    }
  }, [timeLeftMs, isRunning, endsAt, mode, selectedSubject, completedPomodoros, settings]);

  const setMode = useCallback(
    (m: TimerMode) => {
      const dur =
        (m === 'focus'
          ? settings?.focus_duration || 25
          : m === 'shortBreak'
          ? settings?.short_break_duration || 5
          : settings?.long_break_duration || 15) * 60;
      setModeState(m);
      setIsRunning(false);
      setEndsAt(null);
      setTotalSeconds(dur);
      setRemainingMs(dur * 1000);
      handledZeroRef.current = false;
    },
    [settings]
  );

  const setSelectedSubject = useCallback((id: string) => {
    setSelectedSubjectState(id);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      // pause
      const remaining = endsAt ? Math.max(0, endsAt - Date.now()) : remainingMs;
      setRemainingMs(remaining);
      setEndsAt(null);
      setIsRunning(false);
    } else {
      // start
      const baseMs = remainingMs > 0 ? remainingMs : totalSeconds * 1000;
      setEndsAt(Date.now() + baseMs);
      setRemainingMs(baseMs);
      setIsRunning(true);
      handledZeroRef.current = false;
    }
  }, [isRunning, endsAt, remainingMs, totalSeconds]);

  const reset = useCallback(() => {
    const dur =
      (mode === 'focus'
        ? settings?.focus_duration || 25
        : mode === 'shortBreak'
        ? settings?.short_break_duration || 5
        : settings?.long_break_duration || 15) * 60;
    setIsRunning(false);
    setEndsAt(null);
    setTotalSeconds(dur);
    setRemainingMs(dur * 1000);
    handledZeroRef.current = false;
  }, [mode, settings]);

  // If settings change AND timer is not running and not started, refresh duration
  useEffect(() => {
    if (isRunning) return;
    if (remainingMs !== totalSeconds * 1000) return; // user paused mid-cycle, keep it
    const dur =
      (mode === 'focus'
        ? settings?.focus_duration || 25
        : mode === 'shortBreak'
        ? settings?.short_break_duration || 5
        : settings?.long_break_duration || 15) * 60;
    if (dur !== totalSeconds) {
      setTotalSeconds(dur);
      setRemainingMs(dur * 1000);
    }
  }, [settings, mode, isRunning, remainingMs, totalSeconds]);

  return (
    <TimerContext.Provider
      value={{
        mode,
        isRunning,
        timeLeft,
        selectedSubject,
        completedPomodoros,
        totalSeconds,
        setMode,
        setSelectedSubject,
        toggle,
        reset,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
