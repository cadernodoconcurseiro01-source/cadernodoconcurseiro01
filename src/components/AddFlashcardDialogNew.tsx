import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Subject, FlashcardDeck } from '@/types/database';

interface AddFlashcardDialogNewProps {
  subjects: Subject[];
  decks?: FlashcardDeck[];
  onAdd: (params: { subjectId: string; front: string; back: string; deckId?: string }) => void;
}

export function AddFlashcardDialogNew({ subjects, decks = [], onAdd }: AddFlashcardDialogNewProps) {
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [deckId, setDeckId] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const filteredDecks = decks.filter(d => d.subject_id === subjectId);

  const handleSubjectChange = (value: string) => {
    setSubjectId(value);
    setDeckId(''); // Reset deck when subject changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !subjectId) return;

    try {
      await onAdd({ subjectId, front, back, deckId: deckId || undefined });
      setOpen(false);
      setFront('');
      setBack('');
      setDeckId('');
    } catch (error) {
      console.error('Error adding flashcard:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Flashcard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">Criar Flashcard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Matéria</Label>
            <Select value={subjectId} onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a matéria" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredDecks.length > 0 && (
            <div className="space-y-2">
              <Label>Baralho (opcional)</Label>
              <Select value={deckId} onValueChange={setDeckId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um baralho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem baralho</SelectItem>
                  {filteredDecks.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="front">Frente (Pergunta)</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Digite a pergunta ou conceito..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="back">Verso (Resposta)</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Digite a resposta ou explicação..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full gradient-primary">
            Criar Flashcard
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
