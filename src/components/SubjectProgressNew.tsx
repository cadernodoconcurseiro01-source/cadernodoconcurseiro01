import { Subject, DifficultyLevel } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubjectProgressNewProps {
  subjects: Subject[];
  onDelete: (id: string) => void;
  onEdit: (subject: Subject) => void;
}

const difficultyConfig: Record<DifficultyLevel, { icon: typeof ArrowUp; label: string; className: string }> = {
  high: { icon: ArrowUp, label: 'Alta', className: 'text-destructive' },
  medium: { icon: ArrowRight, label: 'Média', className: 'text-warning' },
  low: { icon: ArrowDown, label: 'Baixa', className: 'text-accent' },
};

export function SubjectProgressNew({ subjects, onDelete, onEdit }: SubjectProgressNewProps) {
  if (subjects.length === 0) {
    return (
      <Card className="p-8 text-center shadow-card animate-fade-in">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📚</span>
        </div>
        <h3 className="font-display font-semibold mb-1">Nenhuma matéria ainda</h3>
        <p className="text-sm text-muted-foreground">
          Adicione suas matérias para começar a estudar!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {subjects.map((subject, index) => {
        const progress = Math.min((subject.total_minutes / subject.goal_minutes) * 100, 100);
        const DifficultyIcon = difficultyConfig[subject.difficulty].icon;
        
        return (
          <Card 
            key={subject.id}
            className="p-4 shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="font-medium">{subject.name}</span>
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  difficultyConfig[subject.difficulty].className
                )}>
                  <DifficultyIcon className="w-3 h-3" />
                  <span>{difficultyConfig[subject.difficulty].label}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(subject)}
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(subject.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={progress} 
                className="h-2"
                style={{ 
                  '--progress-background': subject.color 
                } as React.CSSProperties}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{subject.total_minutes} min estudados</span>
                <span>Meta: {subject.goal_minutes} min/dia</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
