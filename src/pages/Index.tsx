import { Clock, Target, Flame, BookOpen, Layers } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { SubjectProgress } from '@/components/SubjectProgress';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { AddSubjectDialog } from '@/components/AddSubjectDialog';
import { useStudyStore } from '@/hooks/useStudyStore';
import { useState } from 'react';
import { Subject } from '@/types/study';

const Index = () => {
  const { 
    subjects, 
    addSubject, 
    updateSubject, 
    deleteSubject, 
    addSession, 
    getStats,
    getFlashcardsDueToday,
  } = useStudyStore();
  
  const stats = getStats();
  const flashcardsDue = getFlashcardsDueToday();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}min`;
  };

  const handleSessionComplete = (subjectId: string, duration: number) => {
    addSession({
      subjectId,
      startTime: new Date(Date.now() - duration * 60 * 1000),
      endTime: new Date(),
      duration,
      type: 'pomodoro',
    });
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <header className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-bold mb-2">
          Olá! 👋
        </h1>
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
          value={flashcardsDue.length}
          subtitle="flashcards"
          icon={Layers}
        />
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Timer */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Timer Pomodoro
            </h2>
          </div>
          <PomodoroTimer 
            subjects={subjects} 
            onSessionComplete={handleSessionComplete}
          />
        </section>

        {/* Subject Progress */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Matérias
            </h2>
            <AddSubjectDialog onAdd={addSubject} />
          </div>
          <SubjectProgress 
            subjects={subjects}
            onDelete={deleteSubject}
            onEdit={handleEditSubject}
          />
        </section>
      </div>

      {/* Edit Subject Dialog */}
      <AddSubjectDialog
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

export default Index;
