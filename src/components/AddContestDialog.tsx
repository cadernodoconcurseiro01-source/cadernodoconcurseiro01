import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trophy } from 'lucide-react';
import { Contest, StudyPlanType } from '@/types/database';
import { toast } from 'sonner';

interface AddContestDialogProps {
  onAdd: (contest: Omit<Contest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<unknown> | void;
  editingContest?: Contest | null;
  onUpdate?: (contest: Partial<Contest> & { id: string }) => Promise<unknown> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddContestDialog({ onAdd, editingContest, onUpdate, open, onOpenChange }: AddContestDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [studyPlanType, setStudyPlanType] = useState<StudyPlanType>('cycle');
  const [cycleDays, setCycleDays] = useState(7);
  const [cycleNumber, setCycleNumber] = useState(1);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  useEffect(() => {
    if (editingContest) {
      setName(editingContest.name);
      setExamDate(editingContest.exam_date || '');
      setStudyPlanType(editingContest.study_plan_type);
      setCycleDays(editingContest.cycle_days);
      setCycleNumber(editingContest.cycle_number);
    }
  }, [editingContest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do concurso');
      return;
    }

    try {
      const safeStudyPlanType: StudyPlanType = studyPlanType === 'plan' ? 'plan' : 'cycle';
      const contestData = {
        name: name.trim(),
        exam_date: examDate || null,
        study_plan_type: safeStudyPlanType,
        cycle_days: Math.max(1, cycleDays || 7),
        cycle_number: Math.max(1, cycleNumber || 1),
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycleNumber">Número do {studyPlanType === 'cycle' ? 'Ciclo' : 'Plano'}</Label>
              <Input
                id="cycleNumber"
                type="number"
                min={1}
                max={99}
                value={cycleNumber}
                onChange={(e) => setCycleNumber(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Ex: 1º {studyPlanType === 'cycle' ? 'Ciclo' : 'Plano'}, 2º {studyPlanType === 'cycle' ? 'Ciclo' : 'Plano'}...
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycleDays">Dias do {studyPlanType === 'cycle' ? 'Ciclo' : 'Plano'}</Label>
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
          </div>

          <Button type="submit" className="w-full gradient-primary">
            {editingContest ? 'Salvar Alterações' : 'Cadastrar Concurso'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
