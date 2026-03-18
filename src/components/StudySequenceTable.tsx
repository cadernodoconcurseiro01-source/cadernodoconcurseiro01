import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Subject, DifficultyLevel, StudyPlanType } from '@/types/database';
import { cn } from '@/lib/utils';

interface StudySequenceTableProps {
  subjects: Subject[];
  cycleDays: number;
  planType: StudyPlanType;
  subjectsPerDay?: number;
}

interface SequenceItem {
  day: number;
  subject: Subject;
  completed: boolean;
}

// Generate study sequence based on difficulty and plan type
const generateSequence = (subjects: Subject[], cycleDays: number, planType: StudyPlanType): SequenceItem[] => {
  if (subjects.length === 0) return [];

  // Sort subjects by difficulty for morning prioritization
  const sortedByDifficulty = [...subjects].sort((a, b) => {
    const diffOrder: Record<DifficultyLevel, number> = { high: 0, medium: 1, low: 2 };
    return diffOrder[a.difficulty] - diffOrder[b.difficulty];
  });

  const sequence: SequenceItem[] = [];
  
  if (planType === 'cycle') {
    // Cycle: rotate through subjects
    for (let day = 1; day <= cycleDays; day++) {
      const subjectIndex = (day - 1) % subjects.length;
      sequence.push({
        day,
        subject: sortedByDifficulty[subjectIndex],
        completed: false,
      });
    }
  } else {
    // Plan: distribute subjects to avoid consecutive high difficulty
    let lastDifficulty: DifficultyLevel | null = null;
    let subjectPool = [...sortedByDifficulty];
    
    for (let day = 1; day <= cycleDays; day++) {
      if (subjectPool.length === 0) {
        subjectPool = [...sortedByDifficulty];
      }
      
      // Try to avoid consecutive high difficulty subjects
      let selectedIndex = 0;
      if (lastDifficulty === 'high') {
        const nonHighIndex = subjectPool.findIndex(s => s.difficulty !== 'high');
        if (nonHighIndex !== -1) {
          selectedIndex = nonHighIndex;
        }
      }
      
      const selected = subjectPool.splice(selectedIndex, 1)[0];
      sequence.push({
        day,
        subject: selected,
        completed: false,
      });
      lastDifficulty = selected.difficulty;
    }
  }

  return sequence;
};

const STORAGE_KEY_PREFIX = 'study_sequence_completed_';

export function StudySequenceTable({ subjects, cycleDays, planType }: StudySequenceTableProps) {
  const [sequence, setSequence] = useState<SequenceItem[]>([]);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  // Generate sequence on mount or when subjects change
  useEffect(() => {
    const newSequence = generateSequence(subjects, cycleDays, planType);
    setSequence(newSequence);
  }, [subjects, cycleDays, planType]);

  // Load completed state from localStorage
  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${subjects.map(s => s.id).sort().join('_')}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompleted(new Set(parsed));
      } catch (e) {
        console.error('Error loading completed state:', e);
      }
    }
  }, [subjects]);

  // Save completed state to localStorage
  const toggleCompleted = (day: number) => {
    const newCompleted = new Set(completed);
    if (newCompleted.has(day)) {
      newCompleted.delete(day);
    } else {
      newCompleted.add(day);
    }
    setCompleted(newCompleted);
    
    const storageKey = `${STORAGE_KEY_PREFIX}${subjects.map(s => s.id).sort().join('_')}`;
    localStorage.setItem(storageKey, JSON.stringify([...newCompleted]));
  };

  const getDifficultyBadge = (difficulty: DifficultyLevel) => {
    const variants: Record<DifficultyLevel, { label: string; className: string }> = {
      high: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      medium: { label: 'Média', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      low: { label: 'Baixa', className: 'bg-accent/10 text-accent border-accent/20' },
    };
    const variant = variants[difficulty];
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const completedCount = sequence.filter((_, i) => completed.has(i + 1)).length;
  const progress = sequence.length > 0 ? Math.round((completedCount / sequence.length) * 100) : 0;

  if (sequence.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-card overflow-hidden">
      {/* Progress Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso do {planType === 'cycle' ? 'Ciclo' : 'Plano'}</span>
          <span className="text-sm text-muted-foreground">{completedCount}/{sequence.length} concluídos</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">✓</TableHead>
            <TableHead className="w-16">Dia</TableHead>
            <TableHead>Matéria</TableHead>
            <TableHead className="w-24">Dificuldade</TableHead>
            <TableHead className="w-20">Meta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sequence.map((item, index) => {
            const isCompleted = completed.has(index + 1);
            return (
              <TableRow 
                key={`${item.day}-${item.subject.id}`}
                className={cn(isCompleted && "bg-muted/50")}
              >
                <TableCell>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleCompleted(index + 1)}
                  />
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "font-medium",
                    isCompleted && "text-muted-foreground line-through"
                  )}>
                    Dia {item.day}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.subject.color }}
                    />
                    <span className={cn(
                      isCompleted && "text-muted-foreground line-through"
                    )}>
                      {item.subject.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getDifficultyBadge(item.subject.difficulty)}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "text-sm",
                    isCompleted && "text-muted-foreground line-through"
                  )}>
                    {item.subject.goal_minutes} min
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
