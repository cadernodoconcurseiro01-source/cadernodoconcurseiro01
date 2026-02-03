import { PomodoroTimer } from '@/components/PomodoroTimer';
import { useStudyStore } from '@/hooks/useStudyStore';
import { Card } from '@/components/ui/card';
import { Clock, Zap, Brain } from 'lucide-react';

const Pomodoro = () => {
  const { subjects, addSession, sessions } = useStudyStore();

  const handleSessionComplete = (subjectId: string, duration: number) => {
    addSession({
      subjectId,
      startTime: new Date(Date.now() - duration * 60 * 1000),
      endTime: new Date(),
      duration,
      type: 'pomodoro',
    });
  };

  // Get today's sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.startTime);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  const todayPomodoros = todaySessions.filter(s => s.type === 'pomodoro').length;
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          Timer Pomodoro
        </h1>
        <p className="text-muted-foreground">
          A técnica Pomodoro ajuda a manter o foco com sessões de 25 minutos.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <PomodoroTimer 
            subjects={subjects} 
            onSessionComplete={handleSessionComplete}
          />
        </div>

        {/* Today Stats */}
        <div className="space-y-4">
          <Card className="p-5 shadow-card animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg gradient-primary">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pomodoros Hoje</p>
                <p className="text-2xl font-display font-bold">{todayPomodoros}</p>
              </div>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-primary transition-all duration-500"
                style={{ width: `${Math.min(todayPomodoros * 12.5, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: 8 pomodoros por dia
            </p>
          </Card>

          <Card className="p-5 shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg gradient-accent">
                <Brain className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Hoje</p>
                <p className="text-2xl font-display font-bold">
                  {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
                </p>
              </div>
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-5 shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="font-display font-semibold mb-3">💡 Dica</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A cada 4 pomodoros, faça uma pausa longa de 15-30 minutos. 
              Isso ajuda a consolidar o aprendizado e evita o esgotamento mental.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;
