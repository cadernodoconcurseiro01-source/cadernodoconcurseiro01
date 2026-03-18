import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Sun, Sunset, Moon, ArrowUp, ArrowRight, ArrowDown, Trophy, HelpCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Subject, Contest, StudyScheduleItem, DifficultyLevel } from '@/types/database';
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AddDailyQuestionsDialog } from '@/components/AddDailyQuestionsDialog';
import { AddSimuladoDialog } from '@/components/AddSimuladoDialog';
import { useContests } from '@/hooks/useContests';
import { useSimulados } from '@/hooks/useSimulados';
import { useDailyQuestions } from '@/hooks/useDailyQuestions';
import { useStudyCompletion } from '@/hooks/useStudyCompletion';

const periodConfig = {
  morning: { icon: Sun, label: 'Manhã', time: '06:00 - 12:00' },
  afternoon: { icon: Sunset, label: 'Tarde', time: '12:00 - 18:00' },
  evening: { icon: Moon, label: 'Noite', time: '18:00 - 22:00' },
};

const difficultyConfig = {
  high: { icon: ArrowUp, label: 'Alta', className: 'text-destructive bg-destructive/10' },
  medium: { icon: ArrowRight, label: 'Média', className: 'text-warning bg-warning/10' },
  low: { icon: ArrowDown, label: 'Baixa', className: 'text-accent bg-accent/10' },
};

function generateScheduleFromContest(
  subjects: Subject[],
  contest: Contest
): StudyScheduleItem[] {
  if (subjects.length === 0) return [];

  const cycleDays = contest.cycle_days || 7;
  const currentDay = contest.cycle_number || 1;
  const dayIndex = (currentDay - 1) % cycleDays;

  // Use the contest's subjects_per_day setting
  const subjectsPerDay = Math.min(contest.subjects_per_day || 1, subjects.length);
  const startIdx = (dayIndex * subjectsPerDay) % subjects.length;

  const todaySubjects: Subject[] = [];
  for (let i = 0; i < Math.min(subjectsPerDay, subjects.length); i++) {
    const idx = (startIdx + i) % subjects.length;
    todaySubjects.push(subjects[idx]);
  }

  // Sort: high difficulty first (morning), then medium, then low
  todaySubjects.sort((a, b) => {
    const order: Record<DifficultyLevel, number> = { high: 0, medium: 1, low: 2 };
    return order[a.difficulty] - order[b.difficulty];
  });

  // Ensure no two high in sequence
  const reordered: Subject[] = [];
  const highQ: Subject[] = todaySubjects.filter(s => s.difficulty === 'high');
  const others: Subject[] = todaySubjects.filter(s => s.difficulty !== 'high');

  while (highQ.length > 0 || others.length > 0) {
    if (highQ.length > 0) {
      reordered.push(highQ.shift()!);
      if (others.length > 0) reordered.push(others.shift()!);
    } else {
      reordered.push(others.shift()!);
    }
  }

  // Use contest's study_periods setting
  const availablePeriods = contest.study_periods && contest.study_periods.length > 0 
    ? contest.study_periods 
    : ['morning', 'afternoon', 'evening'] as const;
  const totalMinutes = 4 * 60; // default 4h
  const minutesPerSubject = Math.floor(totalMinutes / reordered.length);

  return reordered.map((subject, index) => ({
    subjectId: subject.id,
    subjectName: subject.name,
    color: subject.color,
    difficulty: subject.difficulty,
    durationMinutes: subject.goal_minutes || minutesPerSubject,
    period: availablePeriods[index % availablePeriods.length] as 'morning' | 'afternoon' | 'evening',
  }));
}

interface DashboardStudyScheduleProps {
  subjects: Subject[];
}

export function DashboardStudySchedule({ subjects }: DashboardStudyScheduleProps) {
  const { contests } = useContests();
  const { addSimuladoAsync } = useSimulados();
  const { addOrUpdateDailyQuestionsAsync } = useDailyQuestions();

  const [completedItems, setCompletedItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('study-schedule-completed');
      const parsed = saved ? JSON.parse(saved) : {};
      const today = new Date().toDateString();
      if (parsed.date === today) {
        return new Set(parsed.items as string[]);
      }
    } catch { /* ignore */ }
    return new Set<string>();
  });

  // Get last added contest (first in array since ordered by created_at desc)
  const lastContest = useMemo(() => {
    return contests.find(c => c.is_active) || contests[0] || null;
  }, [contests]);

  const contestSubjects = useMemo(() => {
    if (!lastContest) return [];
    return subjects.filter(s => s.contest_id === lastContest.id);
  }, [subjects, lastContest]);

  const schedule = useMemo(() => {
    if (!lastContest || contestSubjects.length === 0) return [];
    return generateScheduleFromContest(contestSubjects, lastContest);
  }, [lastContest, contestSubjects]);

  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('study-schedule-completed', JSON.stringify({
      date: today,
      items: Array.from(completedItems),
    }));
  }, [completedItems]);

  const toggleComplete = (subjectId: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const groupByPeriod = (items: StudyScheduleItem[]) => {
    const groups: Record<string, StudyScheduleItem[]> = { morning: [], afternoon: [], evening: [] };
    items.forEach(item => { groups[item.period].push(item); });
    return groups;
  };

  if (!lastContest) {
    return (
      <Card className="p-8 text-center shadow-card animate-fade-in">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold mb-1">Nenhum concurso cadastrado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Cadastre um concurso para ver seu cronograma de estudos.
        </p>
        <Link to="/contests">
          <Button className="gradient-primary">
            <Trophy className="w-4 h-4 mr-2" />
            Ir para Concursos
          </Button>
        </Link>
      </Card>
    );
  }

  if (contestSubjects.length === 0) {
    return (
      <Card className="p-6 shadow-card animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">{lastContest.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione matérias ao concurso para gerar o cronograma.
        </p>
        <Link to={`/contests/${lastContest.id}`}>
          <Button variant="outline" size="sm">Gerenciar Concurso</Button>
        </Link>
      </Card>
    );
  }

  const grouped = groupByPeriod(schedule);
  const completedCount = schedule.filter(s => completedItems.has(s.subjectId)).length;

  return (
    <Card className="p-6 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold">Cronograma de Hoje</h3>
          </div>
          <Link to={`/contests/${lastContest.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            {lastContest.name} — {lastContest.cycle_number || 1}º Ciclo
          </Link>
        </div>
        <Badge variant={completedCount === schedule.length ? "default" : "secondary"}>
          {completedCount}/{schedule.length}
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <AddDailyQuestionsDialog
          onAdd={addOrUpdateDailyQuestionsAsync}
          subjects={contestSubjects}
        />
        <AddSimuladoDialog
          onAdd={addSimuladoAsync}
          contests={[lastContest]}
          subjects={contestSubjects}
        />
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([period, items]) => {
          if (items.length === 0) return null;
          const config = periodConfig[period as keyof typeof periodConfig];
          const PeriodIcon = config.icon;

          return (
            <div key={period} className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PeriodIcon className="w-4 h-4" />
                <span className="font-medium">{config.label}</span>
                <span className="text-xs">({config.time})</span>
              </div>
              <div className="space-y-2 pl-6">
                {items.map((item, idx) => {
                  const DiffIcon = difficultyConfig[item.difficulty].icon;
                  const isDone = completedItems.has(item.subjectId);

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        isDone ? "bg-accent/10 opacity-70" : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isDone}
                          onCheckedChange={() => toggleComplete(item.subjectId)}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={cn("font-medium", isDone && "line-through text-muted-foreground")}>
                          {item.subjectName}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] px-1.5", difficultyConfig[item.difficulty].className)}
                        >
                          <DiffIcon className="w-3 h-3 mr-0.5" />
                          {difficultyConfig[item.difficulty].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(item.durationMinutes)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
        Total: {formatDuration(schedule.reduce((sum, s) => sum + s.durationMinutes, 0))} de estudo
      </div>
    </Card>
  );
}
