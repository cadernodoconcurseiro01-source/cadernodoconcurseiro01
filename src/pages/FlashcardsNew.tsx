import { useState } from 'react';
import { Layers, BookOpen, Clock, Trash2, Pencil, FolderPlus, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FlashcardReviewNew } from '@/components/FlashcardReviewNew';
import { AddFlashcardDialogNew } from '@/components/AddFlashcardDialogNew';
import { useSubjects } from '@/hooks/useSubjects';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useFlashcardDecks } from '@/hooks/useFlashcardDecks';
import { useSessions } from '@/hooks/useSessions';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FlashcardDeck } from '@/types/database';
import { toast } from 'sonner';

const FlashcardsPage = () => {
  const { subjects } = useSubjects();
  const { 
    flashcards, 
    flashcardsDueToday, 
    addFlashcardAsync,
    reviewFlashcard, 
    deleteFlashcard,
    updateFlashcardAsync,
    getByDeck
  } = useFlashcards();
  const { decks, addDeckAsync, deleteDeck, updateDeckAsync } = useFlashcardDecks();
  const { addSession } = useSessions();
  
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [newDeckDialogOpen, setNewDeckDialogOpen] = useState(false);
  const [newDeckSubjectId, setNewDeckSubjectId] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [editingFlashcard, setEditingFlashcard] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Edit deck state
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [editDeckDialogOpen, setEditDeckDialogOpen] = useState(false);
  const [editDeckName, setEditDeckName] = useState('');
  const [editDeckDescription, setEditDeckDescription] = useState('');

  const NO_DECK_VALUE = 'no-deck';
  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const handleReview = (params: { id: string; quality: number }) => {
    try {
      reviewFlashcard(params);
      
      // Track flashcard review time (approximate 1 minute per card)
      const card = flashcards.find(f => f.id === params.id);
      if (card) {
        addSession({ subjectId: card.subject_id, duration: 1, type: 'flashcard' });
      }
    } catch (error) {
      console.error('Error reviewing flashcard:', error);
      toast.error('Erro ao revisar flashcard');
    }
  };

  const handleAddDeck = async () => {
    if (!newDeckSubjectId) {
      toast.error('Selecione uma matéria');
      return;
    }
    if (!newDeckName.trim()) {
      toast.error('Digite um nome para o baralho');
      return;
    }
    
    try {
      await addDeckAsync({
        subjectId: newDeckSubjectId,
        name: newDeckName.trim(),
        description: newDeckDescription.trim() || undefined,
      });
      
      setNewDeckDialogOpen(false);
      setNewDeckName('');
      setNewDeckDescription('');
      setNewDeckSubjectId('');
      toast.success('Baralho criado com sucesso!');
    } catch (error) {
      console.error('Error adding deck:', error);
      toast.error('Erro ao criar baralho');
    }
  };

  const handleEditDeck = (deck: FlashcardDeck) => {
    setEditingDeck(deck);
    setEditDeckName(deck.name);
    setEditDeckDescription(deck.description || '');
    setEditDeckDialogOpen(true);
  };

  const handleSaveEditDeck = async () => {
    if (!editingDeck || !editDeckName.trim()) return;
    
    try {
      await updateDeckAsync({
        id: editingDeck.id,
        name: editDeckName.trim(),
        description: editDeckDescription.trim() || undefined,
      });
      setEditDeckDialogOpen(false);
      setEditingDeck(null);
    } catch (error) {
      console.error('Error updating deck:', error);
      toast.error('Erro ao atualizar baralho');
    }
  };

  const handleEditFlashcard = (flashcard: any) => {
    setEditingFlashcard(flashcard);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFlashcard) return;
    try {
      await updateFlashcardAsync({
        id: editingFlashcard.id,
        front: editingFlashcard.front,
        back: editingFlashcard.back,
        deckId: editingFlashcard.deck_id,
      });
      setEditDialogOpen(false);
      setEditingFlashcard(null);
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast.error('Erro ao atualizar flashcard');
    }
  };

  // Get subjects with their decks and cards
  const subjectsWithContent = subjects.map(subject => {
    const subjectDecks = decks.filter(d => d.subject_id === subject.id);
    const subjectCards = flashcards.filter(f => f.subject_id === subject.id);
    const cardsWithoutDeck = subjectCards.filter(f => !f.deck_id);
    
    return {
      ...subject,
      decks: subjectDecks.map(deck => ({
        ...deck,
        cards: getByDeck(deck.id)
      })),
      cardsWithoutDeck,
      totalCards: subjectCards.length,
    };
  }).filter(s => s.totalCards > 0 || s.decks.length > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <Layers className="w-8 h-8 text-primary" />
              Flashcards
            </h1>
            <p className="text-muted-foreground">
              Revise e memorize com o sistema de repetição espaçada (estilo Anki).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={newDeckDialogOpen} onOpenChange={setNewDeckDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <FolderPlus className="w-4 h-4" />
                  Novo Baralho
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Criar Baralho</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Matéria</Label>
                    <Select value={newDeckSubjectId} onValueChange={setNewDeckSubjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a matéria" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                              {s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Baralho</Label>
                    <Input
                      placeholder="Ex: Princípios Constitucionais"
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      placeholder="Descreva o conteúdo do baralho..."
                      value={newDeckDescription}
                      onChange={(e) => setNewDeckDescription(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddDeck} className="w-full gradient-primary">
                    Criar Baralho
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <AddFlashcardDialogNew subjects={subjects} decks={decks} onAdd={addFlashcardAsync} />
          </div>
        </div>
      </header>

      <Tabs defaultValue="review" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Revisar ({flashcardsDueToday.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Todos ({flashcards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="animate-fade-in">
          <FlashcardReviewNew 
            flashcards={flashcardsDueToday}
            subjects={subjects}
            onReview={handleReview}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-6 animate-fade-in">
          {subjectsWithContent.length === 0 ? (
            <Card className="p-12 text-center shadow-card">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Nenhum flashcard ainda
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Crie flashcards para memorizar o conteúdo das suas matérias.
              </p>
              <AddFlashcardDialogNew subjects={subjects} decks={decks} onAdd={addFlashcardAsync} />
            </Card>
          ) : (
            <div className="space-y-4">
              {subjectsWithContent.map(subject => (
                <Collapsible
                  key={subject.id}
                  open={expandedSubjects.has(subject.id)}
                  onOpenChange={() => toggleSubject(subject.id)}
                >
                  <Card className="shadow-card overflow-hidden">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-semibold">{subject.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({subject.totalCards} cards, {subject.decks.length} baralhos)
                        </span>
                      </div>
                      {expandedSubjects.has(subject.id) ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="p-4 pt-0 space-y-4">
                        {/* Decks */}
                        {subject.decks.map(deck => (
                          <div key={deck.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{deck.name}</h4>
                                {deck.description && (
                                  <p className="text-sm text-muted-foreground">{deck.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {deck.cards.length} cards
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditDeck(deck)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => deleteDeck(deck.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {deck.cards.length > 0 && (
                              <div className="space-y-2">
                                {deck.cards.map(card => (
                                  <div
                                    key={card.id}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded group"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{card.front}</p>
                                      <p className="text-xs text-muted-foreground truncate">{card.back}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleEditFlashcard(card)}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => deleteFlashcard(card.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Cards without deck */}
                        {subject.cardsWithoutDeck.length > 0 && (
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-3">Sem baralho ({subject.cardsWithoutDeck.length})</h4>
                            <div className="space-y-2">
                              {subject.cardsWithoutDeck.map(card => (
                                <div
                                  key={card.id}
                                  className="flex items-center justify-between p-2 bg-muted/50 rounded group"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{card.front}</p>
                                    <p className="text-xs text-muted-foreground truncate">{card.back}</p>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleEditFlashcard(card)}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => deleteFlashcard(card.id)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Flashcard Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar Flashcard</DialogTitle>
          </DialogHeader>
          {editingFlashcard && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Frente (Pergunta)</Label>
                <Textarea
                  value={editingFlashcard.front}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, front: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Verso (Resposta)</Label>
                <Textarea
                  value={editingFlashcard.back}
                  onChange={(e) => setEditingFlashcard({ ...editingFlashcard, back: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Baralho (opcional)</Label>
                <Select
                  value={editingFlashcard.deck_id ?? NO_DECK_VALUE}
                  onValueChange={(v) => setEditingFlashcard({ ...editingFlashcard, deck_id: v === NO_DECK_VALUE ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem baralho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_DECK_VALUE}>Sem baralho</SelectItem>
                    {decks
                      .filter(d => d.subject_id === editingFlashcard.subject_id)
                      .map(deck => (
                        <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveEdit} className="w-full gradient-primary">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Deck Dialog */}
      <Dialog open={editDeckDialogOpen} onOpenChange={setEditDeckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar Baralho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Baralho</Label>
              <Input
                value={editDeckName}
                onChange={(e) => setEditDeckName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={editDeckDescription}
                onChange={(e) => setEditDeckDescription(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveEditDeck} className="w-full gradient-primary">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashcardsPage;