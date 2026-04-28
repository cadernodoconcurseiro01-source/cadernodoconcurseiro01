import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Flashcard } from '@/types/database';
import { toast } from 'sonner';

// SM-2 Algorithm implementation (Anki-style)
function calculateNextReview(
  quality: number, // 0-5 (0-2 = again, 3 = hard, 4 = good, 5 = easy)
  currentInterval: number,
  currentEaseFactor: number,
  repetitions: number
): { interval: number; easeFactor: number; repetitions: number; nextReview: Date } {
  let newInterval: number;
  let newEaseFactor = currentEaseFactor;
  let newRepetitions = repetitions;

  // Update ease factor
  newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor is 1.3

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newInterval = 1; // 1 day
  } else {
    // Passed
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1; // 1 day
    } else if (newRepetitions === 2) {
      newInterval = 6; // 6 days
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }

    // Bonus for easy
    if (quality === 5) {
      newInterval = Math.round(newInterval * 1.3);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    nextReview,
  };
}

export function useFlashcards() {
  const queryClient = useQueryClient();

  const { data: flashcards = [], isLoading } = useQuery({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Flashcard[];
    },
  });

  const flashcardsDueToday = flashcards.filter(f => {
    const nextReview = new Date(f.next_review);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return nextReview <= today;
  });

  const addFlashcard = useMutation({
    mutationFn: async ({ 
      subjectId, 
      front, 
      back,
      deckId
    }: { 
      subjectId: string; 
      front: string; 
      back: string;
      deckId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          deck_id: deckId || null,
          front,
          back,
          next_review: new Date().toISOString(),
          interval: 1,
          ease_factor: 2.5,
          repetitions: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Flashcard criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar flashcard');
      console.error(error);
    },
  });

  const reviewFlashcard = useMutation({
    mutationFn: async ({ 
      id, 
      quality 
    }: { 
      id: string; 
      quality: number;
    }) => {
      const card = flashcards.find(f => f.id === id);
      if (!card) throw new Error('Flashcard não encontrado');

      const { interval, easeFactor, repetitions, nextReview } = calculateNextReview(
        quality,
        card.interval,
        card.ease_factor,
        card.repetitions
      );

      const { data, error } = await supabase
        .from('flashcards')
        .update({
          interval,
          ease_factor: easeFactor,
          repetitions,
          next_review: nextReview.toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar flashcard');
      console.error(error);
    },
  });

  const deleteFlashcard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Flashcard excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir flashcard');
      console.error(error);
    },
  });

  const updateFlashcard = useMutation({
    mutationFn: async ({ 
      id, 
      front, 
      back,
      deckId
    }: { 
      id: string; 
      front: string; 
      back: string;
      deckId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('flashcards')
        .update({ front, back, deck_id: deckId })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Flashcard atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar flashcard');
      console.error(error);
    },
  });

  const getBySubject = (subjectId: string) => {
    return flashcards.filter(f => f.subject_id === subjectId);
  };

  const getByDeck = (deckId: string) => {
    return flashcards.filter(f => f.deck_id === deckId);
  };

  return {
    flashcards,
    flashcardsDueToday,
    isLoading,
    addFlashcard: addFlashcard.mutate,
    addFlashcardAsync: addFlashcard.mutateAsync,
    reviewFlashcard: reviewFlashcard.mutateAsync,
    deleteFlashcard: deleteFlashcard.mutateAsync,
    updateFlashcard: updateFlashcard.mutateAsync,
    updateFlashcardAsync: updateFlashcard.mutateAsync,
    getBySubject,
    getByDeck,
  };
}
