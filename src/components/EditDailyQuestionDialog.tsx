import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditDailyQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: {
    id: string;
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
  };
  subjectName: string;
  onSave: (data: { id: string; total_questions: number; correct_answers: number; wrong_answers: number }) => Promise<unknown>;
}

export function EditDailyQuestionDialog({ open, onOpenChange, question, subjectName, onSave }: EditDailyQuestionDialogProps) {
  const [totalQuestions, setTotalQuestions] = useState(question.total_questions);
  const [correctAnswers, setCorrectAnswers] = useState(question.correct_answers);
  const [wrongAnswers, setWrongAnswers] = useState(question.wrong_answers);

  useEffect(() => {
    setTotalQuestions(question.total_questions);
    setCorrectAnswers(question.correct_answers);
    setWrongAnswers(question.wrong_answers);
  }, [question]);

  const handleTotalChange = (value: number) => {
    setTotalQuestions(value);
    if (correctAnswers > 0) {
      setWrongAnswers(Math.max(0, value - correctAnswers));
    }
  };

  const handleCorrectChange = (value: number) => {
    setCorrectAnswers(value);
    setWrongAnswers(Math.max(0, totalQuestions - value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalQuestions <= 0) {
      toast.error('Informe o total de questões');
      return;
    }
    try {
      await onSave({ id: question.id, total_questions: totalQuestions, correct_answers: correctAnswers, wrong_answers: wrongAnswers });
      onOpenChange(false);
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Questões — {subjectName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Total</Label>
              <Input type="number" min={0} value={totalQuestions} onChange={(e) => handleTotalChange(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-accent">Acertos</Label>
              <Input type="number" min={0} max={totalQuestions} value={correctAnswers} onChange={(e) => handleCorrectChange(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-destructive">Erros</Label>
              <Input type="number" min={0} max={totalQuestions} value={wrongAnswers} onChange={(e) => setWrongAnswers(Number(e.target.value))} />
            </div>
          </div>
          {totalQuestions > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <span className="text-2xl font-bold text-primary">{percentage}%</span>
              <p className="text-xs text-muted-foreground">Taxa de acerto</p>
            </div>
          )}
          <Button type="submit" className="w-full gradient-primary" disabled={totalQuestions <= 0}>
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
