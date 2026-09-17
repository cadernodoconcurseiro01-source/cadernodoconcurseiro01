import { Clock, Target, Flame, Layers, BookOpen, Calendar, BarChart3, Trophy, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { PomodoroTimerNew } from '@/components/PomodoroTimerNew';
import { AddSubjectDialogNew } from '@/components/AddSubjectDialogNew';
import { SubjectProgressNew } from '@/components/SubjectProgressNew';
import { DashboardStudySchedule } from '@/components/DashboardStudySchedule';
import { StudyCalendar } from '@/components/StudyCalendar';
import { useSubjects } from '@/hooks/useSubjects';
import { useSessions } from '@/hooks/useSessions';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useTimerSettings } from '@/hooks/useTimerSettings';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useState } from 'react';
import { Subject } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { subjects, isLoading: subjectsLoading, addSubject, updateSubject, deleteSubject } = useSubjects();
  const { getStats } = useSessions();
  const { flashcardsDueToday } = useFlashcards();
  const { settings, updateSettings } = useTimerSettings();
  
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const stats = getStats();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}min`;
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setEditDialogOpen(true);
  };



  const displayName = profile?.display_name || user?.user_metadata?.full_name || '';

  if (subjectsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold mb-2">
            Olá{displayName ? `, ${displayName}` : ''}! 👋
          </h1>
          <div className="flex items-center gap-2">
            <Link to="/contests">
              <Button variant="outline" size="sm" className="gap-2">
                <Trophy className="w-4 h-4" />
                Concursos
              </Button>
            </Link>
            <Link to="/statistics">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Estatísticas
              </Button>
            </Link>
          </div>
        </div>
        <p className="text-muted-foreground">
          Continue focado nos seus estudos. Você está indo muito bem!
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Hoje"
          value={formatTime(stats.todayMinutes)}
          subtitle="tempo estudado"
          icon={Clock}
          variant="primary"
        />
        <StatsCard
          title="Esta Semana"
          value={formatTime(stats.weekMinutes)}
          subtitle="tempo total"
          icon={Target}
          variant="accent"
        />
        <StatsCard
          title="Sequência"
          value={stats.streak}
          subtitle={stats.streak === 1 ? "dia" : "dias seguidos"}
          icon={Flame}
          variant="warning"
        />
        <StatsCard
          title="Para Revisar"
          value={flashcardsDueToday.length}
          subtitle="flashcards"
          icon={Layers}
        />
      </div>

      {/* Main Content - 3 columns */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Timer */}
        <section className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Timer Pomodoro
            </h2>
          </div>
          <PomodoroTimerNew 
            subjects={subjects} 
            settings={settings}
            onSettingsChange={updateSettings}
          />
        </section>

        {/* Study */}
        <section className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-warning" />
              Estudos
            </h2>
          </div>
          <DashboardStudySchedule subjects={subjects} />
        </section>

        {/* Subject Progress */}
        <section className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Matérias
            </h2>
            <AddSubjectDialogNew onAdd={addSubject} />
          </div>
          <SubjectProgressNew 
            subjects={subjects}
            onDelete={deleteSubject}
            onEdit={handleEditSubject}
          />
        </section>
      </div>

      {/* Calendar section */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Calendário
          </h2>
          <Link to="/calendar">
            <Button variant="outline" size="sm">Ver tudo</Button>
          </Link>
        </div>
        <StudyCalendar compact />
      </section>

      {/* Edit Subject Dialog */}
      <AddSubjectDialogNew
        onAdd={addSubject}
        editingSubject={editingSubject}
        onUpdate={updateSubject}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingSubject(null);
        }}
      />
    </div>
  );
};

export default Dashboard;