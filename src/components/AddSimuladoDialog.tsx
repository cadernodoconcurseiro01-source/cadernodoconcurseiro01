import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { Simulado, Contest, Subject, SubjectDetail } from '@/types/database';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AddSimuladoDialogProps {
  onAdd: (simulado: Omit<Simulado, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<unknown> | void;
  contests: Contest[];
  subjects: Subject[];
  editingSimulado?: Simulado | null;
  onUpdate?: (simulado: Partial<Simulado> & { id: string }) => Promise<unknown> | void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const NO_CONTEST_VALUE = 'no-contest';

export function AddSimuladoDialog({ onAdd, contests, subjects, editingSimulado, onUpdate, open, onOpenChange }: AddSimuladoDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [contestId, setContestId] = useState('');
  const [examDate, setExamDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [subjectDetails, setSubjectDetails] = useState<SubjectDetail[]>([]);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  useEffect(() => {
    if (editingSimulado) {
      setName(editingSimulado.name);
      setContestId(editingSimulado.contest_id || '');
      setExamDate(editingSimulado.exam_date);
      setSubjectDetails(editingSimulado.subject_details || []);
    }
  }, [editingSimulado]);

  const addSubjectDetail = () => {
    if (subjects.length === 0) return;
    const firstSubject = subjects[0];
    setSubjectDetails([
      ...subjectDetails,
      {
        subject_id: firstSubject.id,
        subject_name: firstSubject.name,
        total_questions: 0,
        correct_answers: 0,
        wrong_answers: 0,
      }
    ]);
  };

  const updateSubjectDetail = (index: number, field: keyof SubjectDetail, value: string | number) => {
    const updated = [...subjectDetails];
    if (field === 'subject_id') {
      const subject = subjects.find(s => s.id === value);
      if (subject) {
        updated[index] = { ...updated[index], subject_id: subject.id, subject_name: subject.name };
      }
    } else if (field === 'total_questions') {
      updated[index] = { 
        ...updated[index], 
        total_questions: Number(value),
        wrong_answers: Math.max(0, Number(value) - updated[index].correct_answers)
      };
    } else if (field === 'correct_answers') {
      updated[index] = { 
        ...updated[index], 
        correct_answers: Number(value),
        wrong_answers: Math.max(0, updated[index].total_questions - Number(value))
      };
    } else {
      (updated[index] as any)[field] = value;
    }
    setSubjectDetails(updated);
  };

  const removeSubjectDetail = (index: number) => {
    setSubjectDetails(subjectDetails.filter((_, i) => i !== index));
  };

  const getTotals = () => {
    const total = subjectDetails.reduce((sum, s) => sum + s.total_questions, 0);
    const correct = subjectDetails.reduce((sum, s) => sum + s.correct_answers, 0);
    const wrong = subjectDetails.reduce((sum, s) => sum + s.wrong_answers, 0);
    return { total, correct, wrong };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do simulado');
      return;
    }

    if (subjectDetails.some((detail) => detail.correct_answers > detail.total_questions)) {
      toast.error('Acertos não podem ser maiores que o total de questões');
      return;
    }

    try {
      const totals = getTotals();
      const simuladoData = {
        name: name.trim(),
        contest_id: contestId || null,
        exam_date: examDate,
        total_questions: totals.total,
        correct_answers: totals.correct,
        wrong_answers: totals.wrong,
        subject_details: subjectDetails.length > 0 ? subjectDetails : null,
      };

      if (editingSimulado && onUpdate) {
        await onUpdate({ id: editingSimulado.id, ...simuladoData });
      } else {
        await onAdd(simuladoData);
      }

      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving simulado:', error);
      toast.error('Erro ao salvar simulado');
    }
  };

  const resetForm = () => {
    if (!editingSimulado) {
      setName('');
      setContestId('');
      setExamDate(format(new Date(), 'yyyy-MM-dd'));
      setSubjectDetails([]);
    }
  };

  const totals = getTotals();
  const percentage = totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!editingSimulado && (
        <DialogTrigger asChild>
          <Button size="sm" className="gradient-primary gap-1">
            <Plus className="w-4 h-4" />
            Novo Simulado
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {editingSimulado ? 'Editar Simulado' : 'Novo Simulado'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Simulado</Label>
            <Input
              id="name"
              placeholder="Ex: Simulado 01 - TRF"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {contests.length > 0 && (
            <div className="space-y-2">
              <Label>Concurso (opcional)</Label>
              <Select
                value={contestId || NO_CONTEST_VALUE}
                onValueChange={(value) => setContestId(value === NO_CONTEST_VALUE ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um concurso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CONTEST_VALUE}>Nenhum</SelectItem>
                  {contests.map(contest => (
                    <SelectItem key={contest.id} value={contest.id}>{contest.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="examDate">Data do Simulado</Label>
            <Input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
            />
          </div>

          {/* Subject Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Matérias do Simulado</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSubjectDetail}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Matéria
              </Button>
            </div>

            {subjectDetails.map((detail, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Select 
                    value={detail.subject_id} 
                    onValueChange={(v) => updateSubjectDetail(index, 'subject_id', v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: subject.color }}
                            />
                            {subject.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeSubjectDetail(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Total</Label>
                    <Input
                      type="number"
                      min={0}
                      value={detail.total_questions}
                      onChange={(e) => updateSubjectDetail(index, 'total_questions', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-accent">Acertos</Label>
                    <Input
                      type="number"
                      min={0}
                      max={detail.total_questions}
                      value={detail.correct_answers}
                      onChange={(e) => updateSubjectDetail(index, 'correct_answers', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-destructive">Erros</Label>
                    <Input
                      type="number"
                      min={0}
                      value={detail.wrong_answers}
                      disabled
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totals.total > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <p className="font-bold text-foreground">{totals.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="font-bold text-accent">{totals.correct}</p>
                  <p className="text-xs text-muted-foreground">Acertos</p>
                </div>
                <div>
                  <p className="font-bold text-destructive">{totals.wrong}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
                <div>
                  <p className="font-bold text-primary text-lg">{percentage}%</p>
                  <p className="text-xs text-muted-foreground">Taxa</p>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full gradient-primary">
            {editingSimulado ? 'Salvar Alterações' : 'Cadastrar Simulado'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
