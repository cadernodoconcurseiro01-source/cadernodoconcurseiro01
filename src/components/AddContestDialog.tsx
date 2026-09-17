import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trophy, Sun, Sunset, Moon } from 'lucide-react';
import { Contest, StudyPlanType, StudyPeriod } from '@/types/database';
import { toast } from 'sonner';

interface AddContestDialogProps {
  onAdd: (contest: Omit<Contest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<unknown> | void;
  editingContest?: Contest | null;
  onUpdate?: (contest: Partial<Contest> & { id: string }) => Promise<unknown> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PERIOD_OPTIONS: { value: StudyPeriod; label: string; icon: typeof Sun }[] = [
  { value: 'morning', label: 'Manhã', icon: Sun },
  { value: 'afternoon', label: 'Tarde', icon: Sunset },
  { value: 'evening', label: 'Noite', icon: Moon },
];

export function AddContestDialog({ onAdd, editingContest, onUpdate, open, onOpenChange }: AddContestDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [studyPlanType, setStudyPlanType] = useState<StudyPlanType>('cycle');
  const [cycleDays, setCycleDays] = useState(7);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [totalCycles, setTotalCycles] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [subjectsPerDay, setSubjectsPerDay] = useState(4);
  const [studyPeriods, setStudyPeriods] = useState<StudyPeriod[]>(['morning', 'afternoon', 'evening']);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled
    ? (nextOpen: boolean) => onOpenChange?.(nextOpen)
    : setInternalOpen;

  useEffect(() => {
    if (editingContest) {
      setName(editingContest.name);
      setExamDate(editingContest.exam_date || '');
      setStudyPlanType(editingContest.study_plan_type);
      setCycleDays(editingContest.cycle_days);
      setCycleNumber(editingContest.cycle_number);
      setTotalCycles(editingContest.total_cycles ?? 1);
      setCurrentDay(editingContest.current_day ?? 1);
      setSubjectsPerDay(editingContest.subjects_per_day ?? 4);
      setStudyPeriods(editingContest.study_periods ?? ['morning', 'afternoon', 'evening']);
    }
  }, [editingContest]);

  const togglePeriod = (period: StudyPeriod) => {
    setStudyPeriods(prev => {
      if (prev.includes(period)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter(p => p !== period);
      }
      return [...prev, period];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do concurso');
      return;
    }

    try {
      const safeStudyPlanType: StudyPlanType = studyPlanType === 'plan' ? 'plan' : 'cycle';
      const safeCycleDays = Math.max(1, cycleDays || 7);
      const safeTotalCycles = Math.max(1, totalCycles || 1);
      const contestData = {
        name: name.trim(),
        exam_date: examDate || null,
        study_plan_type: safeStudyPlanType,
        cycle_days: safeCycleDays,
        cycle_number: Math.min(Math.max(1, cycleNumber || 1), safeTotalCycles),
        total_cycles: safeTotalCycles,
        current_day: Math.min(Math.max(1, currentDay || 1), safeCycleDays),
        subjects_per_day: Math.max(1, subjectsPerDay || 4),
        study_periods: studyPeriods,
        is_active: true,
      };

      if (editingContest && onUpdate) {
        await onUpdate({ id: editingContest.id, ...contestData });
      } else {
        await onAdd(contestData);
      }

      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving contest:', error);
      toast.error('Erro ao salvar concurso');
    }
  };

  const resetForm = () => {
    if (!editingContest) {
      setName('');
      setExamDate('');
      setStudyPlanType('cycle');
      setCycleDays(7);
      setCycleNumber(1);
      setTotalCycles(1);
      setCurrentDay(1);
      setSubjectsPerDay(4);
      setStudyPeriods(['morning', 'afternoon', 'evening']);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!editingContest && (
        <DialogTrigger asChild>
          <Button size="sm" className="gradient-primary gap-1">
            <Plus className="w-4 h-4" />
            Novo Concurso
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {editingContest ? 'Editar Concurso' : 'Novo Concurso'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Concurso</Label>
            <Input
              id="name"
              placeholder="Ex: Concurso TRF 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examDate">Data da Prova (opcional)</Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Plano de Estudos</Label>
            <Select value={studyPlanType} onValueChange={(value) => setStudyPlanType(value === 'plan' ? 'plan' : 'cycle')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cycle">Ciclo de Estudos</SelectItem>
                <SelectItem value="plan">Plano de Estudos</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {studyPlanType === 'cycle'
                ? 'O ciclo repete as matérias de forma rotativa.'
                : 'O plano distribui as matérias em dias fixos.'
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectsPerDay">Disciplinas por dia</Label>
            <Input
              id="subjectsPerDay"
              type="number"
              min={1}
              max={20}
              value={subjectsPerDay}
              onChange={(e) => setSubjectsPerDay(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Quantas disciplinas estudar por dia
            </p>
          </div>

          <div className="space-y-2">
            <Label>Períodos de Estudo</Label>
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map(({ value, label, icon: Icon }) => {
                const isSelected = studyPeriods.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => togglePeriod(value)}
                    className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-muted/30 text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione os períodos em que você estuda
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalCycles">Quantos {studyPlanType === 'cycle' ? 'ciclos' : 'planos'} gerar</Label>
              <Input
                id="totalCycles"
                type="number"
                min={1}
                max={24}
                value={totalCycles}
                onChange={(e) => setTotalCycles(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Ex: 2 {studyPlanType === 'cycle' ? 'ciclos' : 'planos'} de {Math.max(1, cycleDays || 7)} dias
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycleDays">Dias de cada {studyPlanType === 'cycle' ? 'ciclo' : 'plano'}</Label>
              <Input
                id="cycleDays"
                type="number"
                min={1}
                max={30}
                value={cycleDays}
                onChange={(e) => setCycleDays(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Quantos dias dura
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycleNumber">{studyPlanType === 'cycle' ? 'Ciclo' : 'Plano'} atual</Label>
              <Input
                id="cycleNumber"
                type="number"
                min={1}
                max={Math.max(1, totalCycles || 1)}
                value={cycleNumber}
                onChange={(e) => setCycleNumber(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Em qual você está agora
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentDay">Dia atual</Label>
              <Input
                id="currentDay"
                type="number"
                min={1}
                max={Math.max(1, cycleDays || 7)}
                value={currentDay}
                onChange={(e) => setCurrentDay(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Dia dentro do {studyPlanType === 'cycle' ? 'ciclo' : 'plano'}
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full gradient-primary">
            {editingContest ? 'Salvar Alterações' : 'Cadastrar Concurso'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
