import { useState } from 'react';
import { Layers, BookOpen, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlashcardReview } from '@/components/FlashcardReview';
import { AddFlashcardDialog } from '@/components/AddFlashcardDialog';
import { useStudyStore } from '@/hooks/useStudyStore';
import { cn } from '@/lib/utils';

const Flashcards = () => {
  const { 
    subjects, 
    flashcards, 
    addFlashcard, 
    updateFlashcard, 
    deleteFlashcard,
    getFlashcardsDueToday 
  } = useStudyStore();
  
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  const flashcardsDue = getFlashcardsDueToday();
  const filteredFlashcards = selectedSubject 
    ? flashcards.filter(f => f.subjectId === selectedSubject)
    : flashcards;

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
              Revise e memorize com o sistema de repetição espaçada.
            </p>
          </div>
          <AddFlashcardDialog subjects={subjects} onAdd={addFlashcard} />
        </div>
      </header>

      <Tabs defaultValue="review" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Revisar ({flashcardsDue.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Todos ({flashcards.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="animate-fade-in">
          <FlashcardReview 
            flashcards={flashcardsDue}
            subjects={subjects}
            onReview={updateFlashcard}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-6 animate-fade-in">
          {/* Subject Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSubject === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(null)}
              className={selectedSubject === null ? "gradient-primary" : ""}
            >
              Todas
            </Button>
            {subjects.map((subject) => (
              <Button
                key={subject.id}
                variant={selectedSubject === subject.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubject(subject.id)}
                style={selectedSubject === subject.id ? { backgroundColor: subject.color } : {}}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: selectedSubject === subject.id ? 'white' : subject.color }}
                />
                {subject.name}
              </Button>
            ))}
          </div>

          {/* Flashcard Grid */}
          {filteredFlashcards.length === 0 ? (
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
              <AddFlashcardDialog subjects={subjects} onAdd={addFlashcard} />
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFlashcards.map((card, index) => {
                const subject = subjects.find(s => s.id === card.subjectId);
                const nextReview = new Date(card.nextReview);
                const isOverdue = nextReview <= new Date();
                
                return (
                  <Card 
                    key={card.id}
                    className={cn(
                      "p-4 shadow-card hover:shadow-elevated transition-all duration-300",
                      "cursor-pointer group animate-slide-up"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      {subject && (
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: `${subject.color}20`,
                            color: subject.color,
                          }}
                        >
                          {subject.name}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFlashcard(card.id);
                        }}
                      >
                        ×
                      </Button>
                    </div>
                    
                    <p className="font-medium text-sm line-clamp-3 mb-2">
                      {card.front}
                    </p>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {card.back}
                    </p>
                    
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className={cn(
                        "w-3 h-3",
                        isOverdue ? "text-warning" : "text-muted-foreground"
                      )} />
                      <span className={isOverdue ? "text-warning font-medium" : "text-muted-foreground"}>
                        {isOverdue ? 'Revisar agora' : `Próxima: ${nextReview.toLocaleDateString('pt-BR')}`}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Flashcards;
