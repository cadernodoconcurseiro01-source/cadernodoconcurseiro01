import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2 } from 'lucide-react';
import { Subject } from '@/types/database';
import { toast } from 'sonner';

interface LinkExistingSubjectDialogProps {
  availableSubjects: Subject[];
  onLink: (subjectIds: string[]) => Promise<void>;
}

export function LinkExistingSubjectDialog({ availableSubjects, onLink }: LinkExistingSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSubject = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma matéria.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onLink(selectedIds);
      setOpen(false);
      setSelectedIds([]);
    } catch (error) {
      console.error('Error linking subjects:', error);
      toast.error('Erro ao vincular matérias.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedIds([]); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="w-4 h-4 mr-2" />
          Vincular Existente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display">Vincular Matérias Existentes</DialogTitle>
        </DialogHeader>

        {availableSubjects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Todas as suas matérias já estão vinculadas a este concurso ou você não tem matérias cadastradas na aba Matérias.
          </p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {availableSubjects.map(subject => (
              <label
                key={subject.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={selectedIds.includes(subject.id)}
                  onCheckedChange={() => toggleSubject(subject.id)}
                />
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block">{subject.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Meta: {subject.goal_minutes} min/dia • {
                      subject.difficulty === 'high' ? 'Alta' :
                      subject.difficulty === 'medium' ? 'Média' : 'Baixa'
                    }
                  </span>
                </div>
              </label>
            ))}
          </div>
        )}

        {availableSubjects.length > 0 && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.length === 0}
            className="w-full gradient-primary"
          >
            {isSubmitting ? 'Vinculando...' : `Vincular ${selectedIds.length} matéria(s)`}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
