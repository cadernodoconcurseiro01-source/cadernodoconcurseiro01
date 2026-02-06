import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StudyScheduleItem, StudyCycle, StudyPlanType } from '@/types/database';
import { Settings2, Clock, Sun, Sunset, Moon, ArrowUp, ArrowRight, ArrowDown, Calendar, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type CycleData = Omit<StudyCycle, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

interface StudyCycleCardProps {
  schedule: StudyScheduleItem[];
  cycle: CycleData;
  onUpdateCycle: (updates: Partial<CycleData>) => void;
  onRefreshSchedule: () => void;
}

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

export function StudyCycleCard({ schedule, cycle, onUpdateCycle, onRefreshSchedule }: StudyCycleCardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localCycle, setLocalCycle] = useState(cycle);

  const handleSave = () => {
    onUpdateCycle(localCycle);
    setSettingsOpen(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
  };

  const groupByPeriod = (items: StudyScheduleItem[]) => {
    const groups: Record<string, StudyScheduleItem[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    items.forEach(item => {
      groups[item.period].push(item);
    });
    return groups;
  };

  const grouped = groupByPeriod(schedule);

  if (schedule.length === 0) {
    return (
      <Card className="p-8 text-center shadow-card animate-fade-in">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-display font-semibold mb-1">Configure seu ciclo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione matérias para gerar seu plano de estudos.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">Cronograma de Hoje</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onRefreshSchedule}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Configurar Estudos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de Plano</Label>
                  <Select 
                    value={localCycle.plan_type} 
                    onValueChange={(v: StudyPlanType) => setLocalCycle({ ...localCycle, plan_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cycle">Ciclo de Estudos (Rotativo)</SelectItem>
                      <SelectItem value="plan">Plano de Estudos (Fixo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dias do {localCycle.plan_type === 'cycle' ? 'Ciclo' : 'Plano'}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={localCycle.cycle_days}
                    onChange={(e) => setLocalCycle({ ...localCycle, cycle_days: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Matérias por dia</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={localCycle.subjects_per_day}
                    onChange={(e) => setLocalCycle({ ...localCycle, subjects_per_day: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horas de estudo diárias</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    step={0.5}
                    value={localCycle.daily_hours}
                    onChange={(e) => setLocalCycle({ ...localCycle, daily_hours: Number(e.target.value) })}
                  />
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Matérias difíceis são priorizadas pela manhã</li>
                    <li>Nunca duas matérias difíceis em sequência</li>
                    <li>Alterna entre alta + baixa ou alta + média</li>
                  </ul>
                </div>
                <Button onClick={handleSave} className="w-full gradient-primary">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                  
                  return (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.subjectName}</span>
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
