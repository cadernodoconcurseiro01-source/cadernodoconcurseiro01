import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Subject } from '@/types/database';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTimer, TimerMode } from '@/contexts/TimerContext';

interface TimerSettings {
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
}

interface PomodoroTimerProps {
  subjects: Subject[];
  settings: TimerSettings;
  onSessionComplete?: (subjectId: string, duration: number) => void;
  onSettingsChange: (settings: Partial<TimerSettings>) => void;
}

export function PomodoroTimerNew({
  subjects,
  settings,
  onSettingsChange,
}: PomodoroTimerProps) {
  const {
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
  } = useTimer();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Initialize subject from props if none selected
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject, setSelectedSubject]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  const getModeLabel = (m: TimerMode) => {
    switch (m) {
      case 'focus': return 'Foco';
      case 'shortBreak': return 'Pausa Curta';
      case 'longBreak': return 'Pausa Longa';
    }
  };

  const handleSaveSettings = () => {
    try {
      onSettingsChange(localSettings);
      setSettingsOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  return (
    <Card className="p-8 shadow-card animate-fade-in">
      <div className="text-center space-y-6">
        {/* Settings Button */}
        <div className="flex justify-end">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings2 className="w-5 h-5 text-muted-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Configurações do Timer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="focus">Tempo de Foco (minutos)</Label>
                  <Input
                    id="focus"
                    type="number"
                    min={1}
                    max={120}
                    value={localSettings?.focus_duration || 25}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      focus_duration: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortBreak">Pausa Curta (minutos)</Label>
                  <Input
                    id="shortBreak"
                    type="number"
                    min={1}
                    max={30}
                    value={localSettings?.short_break_duration || 5}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      short_break_duration: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longBreak">Pausa Longa (minutos)</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    min={1}
                    max={60}
                    value={localSettings?.long_break_duration || 15}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      long_break_duration: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessions">Sessões até pausa longa</Label>
                  <Input
                    id="sessions"
                    type="number"
                    min={1}
                    max={10}
                    value={localSettings?.sessions_until_long_break || 4}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      sessions_until_long_break: Number(e.target.value)
                    })}
                  />
                </div>
                <Button onClick={handleSaveSettings} className="w-full gradient-primary">
                  Salvar Configurações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Mode Tabs */}
        <div className="flex justify-center gap-2">
          {(['focus', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                mode === m
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
        {mode === 'focus' && subjects.length > 0 && (
          <Select value={selectedSubject || undefined} onValueChange={setSelectedSubject}>
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
            onClick={reset}
            className="w-12 h-12 rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            onClick={toggle}
            className={cn(
              "w-16 h-16 rounded-full transition-all duration-300",
              isRunning ? "gradient-warm" : "gradient-primary"
            )}
          >
            {isRunning ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-1" />
            )}
          </Button>

          <div className="w-12 h-12" />
        </div>

        {/* Pomodoro Counter */}
        <div className="flex justify-center gap-2">
          {[...Array(settings?.sessions_until_long_break || 4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                i < (completedPomodoros % (settings?.sessions_until_long_break || 4))
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
