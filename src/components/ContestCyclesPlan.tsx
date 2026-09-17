import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Layers, Clock, RotateCcw, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contest, Subject, DifficultyLevel } from '@/types/database';
import { generateCyclesPlan, getContestCycleSettings } from '@/lib/studyPlan';
import { useContestCycleSlots } from '@/hooks/useContestCycleSlots';
import { useStudyCompletion } from '@/hooks/useStudyCompletion';

const difficultyLabel: Record<DifficultyLevel, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const difficultyClass: Record<DifficultyLevel, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-accent/10 text-accent border-accent/20',
};

interface ContestCyclesPlanProps {
  contest: Contest;
  subjects: Subject[];
}

export function ContestCyclesPlan({ contest, subjects }: ContestCyclesPlanProps) {
  const { overridesFor, setSlot, resetCycle } = useContestCycleSlots(contest.id);
  const { completedItems, toggleComplete } = useStudyCompletion();

  const { cycleDays, totalCycles, currentCycle, currentDay, subjectsPerDay } = getContestCycleSettings(contest);
  const overrides = useMemo(() => overridesFor(contest.id), [overridesFor, contest.id]);

  const plan = useMemo(
    () => generateCyclesPlan({ subjects, cycleDays, subjectsPerDay, totalCycles, overrides }),
    [subjects, cycleDays, subjectsPerDay, totalCycles, overrides]
  );

  const [openCycle, setOpenCycle] = useState<string>(`cycle-${currentCycle}`);
  const label = contest.study_plan_type === 'cycle' ? 'Ciclo' : 'Plano';
  const PlanIcon = contest.study_plan_type === 'cycle' ? RefreshCw : Layers;

  if (plan.length === 0) return null;

  return (
    <Accordion type="single" collapsible value={openCycle} onValueChange={setOpenCycle} className="space-y-3">
      {plan.map(cycle => {
        const isCurrentCycle = cycle.cycle === currentCycle;
        const totalMinutes = cycle.days.reduce(
          (sum, d) => sum + d.slots.reduce((s, slot) => s + (slot.subject.goal_minutes || 0), 0),
          0
        );

        return (
          <AccordionItem
            key={cycle.cycle}
            value={`cycle-${cycle.cycle}`}
            className={cn(
              'border rounded-lg bg-card shadow-card px-4',
              isCurrentCycle && 'border-primary/60'
            )}
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                <div className="flex items-center gap-2 text-left">
                  <PlanIcon className="w-4 h-4 text-primary" />
                  <span className="font-display font-semibold">
                    {cycle.cycle}º {label}
                  </span>
                  {isCurrentCycle && <Badge className="text-[10px]">Atual</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{cycleDays} dias</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round(totalMinutes / 60)}h
                  </span>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-4">
              <div className="flex justify-end mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => resetCycle({ contestId: contest.id, cycle: cycle.cycle })}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar padrão
                </Button>
              </div>

              <div className="space-y-3">
                {cycle.days.map(day => {
                  const isToday = isCurrentCycle && day.day === currentDay;
                  return (
                    <Card
                      key={day.day}
                      className={cn('p-3', isToday && 'border-l-2 border-l-primary bg-primary/5')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
                          Dia {day.day}
                        </span>
                        {isToday && <Badge variant="secondary" className="text-[10px]">Hoje</Badge>}
                      </div>

                      <div className="space-y-2">
                        {day.slots.map(slot => {
                          const isDone = isToday && completedItems.has(slot.subject.id);
                          return (
                            <div
                              key={slot.slot}
                              className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2"
                            >
                              {isToday && (
                                <Checkbox
                                  checked={isDone}
                                  onCheckedChange={() => toggleComplete(slot.subject.id)}
                                />
                              )}
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: slot.subject.color }}
                              />
                              <span
                                className={cn(
                                  'text-sm font-medium flex-1 min-w-[120px]',
                                  isDone && 'line-through text-muted-foreground'
                                )}
                              >
                                {slot.subject.name}
                              </span>
                              <Badge variant="outline" className={cn('text-[10px]', difficultyClass[slot.subject.difficulty])}>
                                {difficultyLabel[slot.subject.difficulty]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {slot.subject.goal_minutes} min
                              </span>
                              <Select
                                value={slot.subject.id}
                                onValueChange={(value) =>
                                  setSlot({
                                    contestId: contest.id,
                                    cycle: cycle.cycle,
                                    day: day.day,
                                    slot: slot.slot,
                                    subjectId: value,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8 w-[140px] text-xs">
                                  <SelectValue placeholder="Alterar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subjects.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="text-xs">
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
