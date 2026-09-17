import { Clock } from 'lucide-react';
import { PomodoroTimerNew } from '@/components/PomodoroTimerNew';
import { useSubjects } from '@/hooks/useSubjects';
import { useTimerSettings } from '@/hooks/useTimerSettings';

const PomodoroPage = () => {
  const { subjects } = useSubjects();
  const { settings, updateSettings } = useTimerSettings();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <header className="mb-8 animate-fade-in text-center">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center justify-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          Timer Pomodoro
        </h1>
        <p className="text-muted-foreground">
          Foque no que importa com sessões de estudo cronometradas.
        </p>
      </header>

      <PomodoroTimerNew 
        subjects={subjects}
        settings={settings}
        onSettingsChange={updateSettings}
      />
    </div>
  );
};

export default PomodoroPage;
