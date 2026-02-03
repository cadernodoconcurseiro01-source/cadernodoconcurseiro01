import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Subject } from '@/types/study';

interface AddSubjectDialogProps {
  onAdd: (name: string, color: string, goalMinutes: number) => void;
  editingSubject?: Subject | null;
  onUpdate?: (id: string, updates: Partial<Subject>) => void;
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

export function AddSubjectDialog({ 
  onAdd, 
  editingSubject, 
  onUpdate,
  open,
  onOpenChange 
}: AddSubjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [goalMinutes, setGoalMinutes] = useState(30);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setColor(editingSubject.color);
      setGoalMinutes(editingSubject.goalMinutes);
    } else {
      setName('');
      setColor(PRESET_COLORS[0]);
      setGoalMinutes(30);
    }
  }, [editingSubject, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSubject && onUpdate) {
      onUpdate(editingSubject.id, { name, color, goalMinutes });
    } else {
      onAdd(name, color, goalMinutes);
    }
    
    setIsOpen(false);
    setName('');
    setColor(PRESET_COLORS[0]);
    setGoalMinutes(30);
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
