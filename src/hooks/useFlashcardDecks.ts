import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FlashcardDeck } from '@/types/database';
import { toast } from 'sonner';

export function useFlashcardDecks() {
  const queryClient = useQueryClient();

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ['flashcard-decks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FlashcardDeck[];
    },
  });

  const addDeck = useMutation({
    mutationFn: async ({ 
      subjectId, 
      name,
      description 
    }: { 
      subjectId: string; 
      name: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          name,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success('Baralho criado!');
    },
    onError: (error) => {
      toast.error('Erro ao criar baralho');
      console.error(error);
    },
  });

  const updateDeck = useMutation({
    mutationFn: async ({ 
      id, 
      name,
      description 
    }: { 
      id: string; 
      name: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .update({ name, description: description || null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      toast.success('Baralho atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar baralho');
      console.error(error);
    },
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcard-decks'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Baralho excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir baralho');
      console.error(error);
    },
  });

  return {
    decks,
    isLoading,
    addDeck: addDeck.mutate,
    addDeckAsync: addDeck.mutateAsync,
    updateDeck: updateDeck.mutate,
    updateDeckAsync: updateDeck.mutateAsync,
    deleteDeck: deleteDeck.mutate,
    deleteDeckAsync: deleteDeck.mutateAsync,
  };
}
