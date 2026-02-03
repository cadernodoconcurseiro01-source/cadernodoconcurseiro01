import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Subject } from '@/types/study';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  subjects: Subject[];
  onSessionComplete: (subjectId: string, duration: number) => void;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const TIMER_DURATIONS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function PomodoroTimer({ subjects, onSessionComplete }: PomodoroTimerProps) {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  const resetTimer = useCallback(() => {
    setTimeLeft(TIMER_DURATIONS[mode]);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    setTimeLeft(TIMER_DURATIONS[mode]);
  }, [mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      
      if (mode === 'focus') {
        onSessionComplete(selectedSubject, TIMER_DURATIONS.focus / 60);
        setCompletedPomodoros(prev => prev + 1);
        
        // Auto switch to break
        if ((completedPomodoros + 1) % 4 === 0) {
          setMode('longBreak');
        } else {
          setMode('shortBreak');
        }
      } else {
        setMode('focus');
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, selectedSubject, completedPomodoros, onSessionComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((TIMER_DURATIONS[mode] - timeLeft) / TIMER_DURATIONS[mode]) * 100;

  const getModeLabel = (m: TimerMode) => {
    switch (m) {
      case 'focus': return 'Foco';
      case 'shortBreak': return 'Pausa Curta';
      case 'longBreak': return 'Pausa Longa';
    }
  };

  return (
    <Card className="p-8 shadow-card animate-fade-in">
      <div className="text-center space-y-6">
        {/* Mode Tabs */}
        <div className="flex justify-center gap-2">
          {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setIsRunning(false);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                mode === m 
                  ? "bg-primary text-primary-foreground shadow-soft" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {m === 'focus' ? (
                getModeLabel(m)
              ) : (
                <span className="flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" />
                  {getModeLabel(m)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Subject Selector */}
        {mode === 'focus' && (
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48 mx-auto">
              <SelectValue placeholder="Selecione a matéria" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  <span className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: subject.color }}
                    />
                    {subject.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Timer Display */}
        <div className="relative w-64 h-64 mx-auto">
          {/* Progress Ring */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke={mode === 'focus' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "font-display text-6xl font-bold tracking-tight",
              isRunning && "animate-timer-pulse"
            )}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground mt-2">
              {getModeLabel(mode)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            className="w-12 h-12 rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "w-16 h-16 rounded-full transition-all duration-300",
              isRunning 
                ? "gradient-warm" 
                : "gradient-primary"
            )}
          >
            {isRunning ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </Button>
          
          <div className="w-12 h-12" /> {/* Spacer for symmetry */}
        </div>

        {/* Pomodoro Counter */}
        <div className="flex justify-center gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                i < (completedPomodoros % 4)
                  ? "bg-primary scale-110"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {completedPomodoros} pomodoros completados hoje
        </p>
      </div>
    </Card>
  );
}
