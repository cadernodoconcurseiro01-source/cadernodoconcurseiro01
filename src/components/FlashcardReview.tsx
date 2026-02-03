import { useState } from 'react';
import { Flashcard, Subject } from '@/types/study';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCw, Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashcardReviewProps {
  flashcards: Flashcard[];
  subjects: Subject[];
  onReview: (id: string, quality: number) => void;
}

export function FlashcardReview({ flashcards, subjects, onReview }: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentCard = flashcards[currentIndex];
  const subject = subjects.find(s => s.id === currentCard?.subjectId);

  const handleReview = (quality: number) => {
    if (!currentCard) return;
    
    setIsAnimating(true);
    onReview(currentCard.id, quality);
    
    setTimeout(() => {
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCurrentIndex(0);
      }
      setIsFlipped(false);
      setIsAnimating(false);
    }, 300);
  };

  if (flashcards.length === 0) {
    return (
      <Card className="p-12 text-center shadow-card animate-slide-up">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h3 className="font-display text-xl font-semibold mb-2">Tudo revisado!</h3>
        <p className="text-muted-foreground text-sm">
          Não há flashcards para revisar agora. Volte mais tarde!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Cartão {currentIndex + 1} de {flashcards.length}
        </span>
        {subject && (
          <span className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: subject.color }}
            />
            <span className="font-medium">{subject.name}</span>
          </span>
        )}
      </div>

      {/* Flashcard */}
      <div 
        className="perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card 
          className={cn(
            "relative min-h-[280px] p-8 shadow-elevated transition-all duration-500",
            "transform-style-preserve-3d",
            isFlipped && "rotate-y-180",
            isAnimating && "scale-95 opacity-50"
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div 
            className={cn(
              "absolute inset-0 p-8 flex flex-col items-center justify-center backface-hidden",
              isFlipped && "opacity-0"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
              Pergunta
            </span>
            <p className="text-xl font-medium text-center leading-relaxed">
              {currentCard.front}
            </p>
            <span className="absolute bottom-4 text-xs text-muted-foreground flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5" />
              Clique para virar
            </span>
          </div>

          {/* Back */}
          <div 
            className={cn(
              "absolute inset-0 p-8 flex flex-col items-center justify-center",
              !isFlipped && "opacity-0"
            )}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <span className="text-xs text-accent uppercase tracking-wider mb-4">
              Resposta
            </span>
            <p className="text-xl font-medium text-center leading-relaxed">
              {currentCard.back}
            </p>
          </div>
        </Card>
      </div>

      {/* Review Buttons */}
      {isFlipped && (
        <div className="flex justify-center gap-3 animate-fade-in">
          <Button 
            variant="outline" 
            onClick={() => handleReview(1)}
            className="flex-1 max-w-[140px] border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Errei
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleReview(3)}
            className="flex-1 max-w-[140px]"
          >
            Difícil
          </Button>
          <Button 
            onClick={() => handleReview(5)}
            className="flex-1 max-w-[140px] gradient-accent"
          >
            <Check className="w-4 h-4 mr-2" />
            Fácil
          </Button>
        </div>
      )}
    </div>
  );
}
