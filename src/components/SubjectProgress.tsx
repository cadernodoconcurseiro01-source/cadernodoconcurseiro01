import { Subject } from '@/types/study';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2 } from 'lucide-react';

interface SubjectProgressProps {
  subjects: Subject[];
  onDelete: (id: string) => void;
  onEdit: (subject: Subject) => void;
}

export function SubjectProgress({ subjects, onDelete, onEdit }: SubjectProgressProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="p-6 shadow-card animate-slide-up">
      <h3 className="font-display text-lg font-semibold mb-4">Progresso por Matéria</h3>
      
      <div className="space-y-4">
        {subjects.map((subject, index) => {
          const progress = Math.min((subject.totalMinutes / subject.goalMinutes) * 100, 100);
          
          return (
            <div 
              key={subject.id} 
              className="space-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="font-medium text-sm">{subject.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(subject.totalMinutes)} / {formatTime(subject.goalMinutes)}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => onEdit(subject)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(subject.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-2" />
                <div 
                  className="absolute top-0 left-0 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: subject.color,
                  }}
                />
              </div>
            </div>
          );
        })}
        
        {subjects.length === 0 && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            Nenhuma matéria cadastrada ainda.
          </p>
        )}
      </div>
    </Card>
  );
}
