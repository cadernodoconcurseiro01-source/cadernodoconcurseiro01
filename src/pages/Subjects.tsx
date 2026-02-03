import { useState } from 'react';
import { BookOpen, Plus, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AddSubjectDialog } from '@/components/AddSubjectDialog';
import { useStudyStore } from '@/hooks/useStudyStore';
import { Subject } from '@/types/study';
import { cn } from '@/lib/utils';

const Subjects = () => {
  const { subjects, addSubject, updateSubject, deleteSubject, flashcards } = useStudyStore();
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

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-accent" />
              Minhas Matérias
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas matérias e acompanhe o progresso de cada uma.
            </p>
          </div>
          <AddSubjectDialog onAdd={addSubject} />
        </div>
      </header>

      {subjects.length === 0 ? (
        <Card className="p-12 text-center shadow-card animate-slide-up">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">
            Nenhuma matéria cadastrada
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Adicione sua primeira matéria para começar a estudar.
          </p>
          <AddSubjectDialog onAdd={addSubject} />
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, index) => {
            const progress = Math.min((subject.totalMinutes / subject.goalMinutes) * 100, 100);
            const subjectFlashcards = flashcards.filter(f => f.subjectId === subject.id);
            
            return (
              <Card 
                key={subject.id} 
                className={cn(
                  "p-5 shadow-card hover:shadow-elevated transition-all duration-300",
                  "cursor-pointer group animate-slide-up"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleEditSubject(subject)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {subjectFlashcards.length} flashcards
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSubject(subject.id);
                    }}
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">
                      {formatTime(subject.totalMinutes)} / {formatTime(subject.goalMinutes)}
                    </span>
                  </div>
                  
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: subject.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{Math.round(progress)}% da meta diária</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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

export default Subjects;
