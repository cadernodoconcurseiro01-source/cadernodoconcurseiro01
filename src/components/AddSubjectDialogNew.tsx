import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Subject, DifficultyLevel } from '@/types/database';

interface AddSubjectDialogNewProps {
  onAdd: (params: { name: string; color: string; goalMinutes: number; difficulty: DifficultyLevel }) => void;
  editingSubject?: Subject | null;
  onUpdate?: (params: { id: string; updates: Partial<Subject> }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PRESET_COLORS = [
  'hsl(199, 89%, 48%)',
  'hsl(150, 40%, 55%)',
  'hsl(38, 92%, 50%)',
  'hsl(330, 80%, 60%)',
  'hsl(270, 70%, 60%)',
  'hsl(180, 60%, 45%)',
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; description: string }[] = [
  { value: 'low', label: 'Baixa', description: 'Matéria mais fácil' },
  { value: 'medium', label: 'Média', description: 'Dificuldade moderada' },
  { value: 'high', label: 'Alta', description: 'Matéria mais desafiadora' },
];

export function AddSubjectDialogNew({ 
  onAdd, 
  editingSubject, 
  onUpdate,
  open,
  onOpenChange 
}: AddSubjectDialogNewProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [goalMinutes, setGoalMinutes] = useState(30);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setColor(editingSubject.color);
      setGoalMinutes(editingSubject.goal_minutes);
      setDifficulty(editingSubject.difficulty);
    } else {
      setName('');
      setColor(PRESET_COLORS[0]);
      setGoalMinutes(30);
      setDifficulty('medium');
    }
  }, [editingSubject, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSubject && onUpdate) {
      onUpdate({ 
        id: editingSubject.id, 
        updates: { 
          name, 
          color, 
          goal_minutes: goalMinutes, 
          difficulty 
        } 
      });
    } else {
      onAdd({ name, color, goalMinutes, difficulty });
    }
    
    setIsOpen(false);
    setName('');
    setColor(PRESET_COLORS[0]);
    setGoalMinutes(30);
    setDifficulty('medium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!editingSubject && (
        <DialogTrigger asChild>
          <Button className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nova Matéria
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editingSubject ? 'Editar Matéria' : 'Adicionar Nova Matéria'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Matéria</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Matemática"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Nível de Dificuldade</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Meta Diária (minutos)</Label>
            <Input
              id="goal"
              type="number"
              min={5}
              max={480}
              value={goalMinutes}
              onChange={(e) => setGoalMinutes(Number(e.target.value))}
            />
          </div>

          <Button type="submit" className="w-full gradient-primary">
            {editingSubject ? 'Salvar Alterações' : 'Adicionar Matéria'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
