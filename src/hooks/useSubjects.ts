import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subject, DifficultyLevel } from '@/types/database';
import { toast } from 'sonner';

export function useSubjects() {
  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Subject[];
    },
  });

  const addSubject = useMutation({
    mutationFn: async ({ 
      name, 
      color, 
      goalMinutes, 
      difficulty 
    }: { 
      name: string; 
      color: string; 
      goalMinutes: number; 
      difficulty: DifficultyLevel;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('subjects')
        .insert({
          user_id: user.id,
          name,
          color,
          goal_minutes: goalMinutes,
          difficulty,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Matéria adicionada!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar matéria');
      console.error(error);
    },
  });

  const addSubjectWithContest = useMutation({
    mutationFn: async ({ 
      name, 
      color, 
      goalMinutes, 
      difficulty,
      contestId
    }: { 
      name: string; 
      color: string; 
      goalMinutes: number; 
      difficulty: DifficultyLevel;
      contestId?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('subjects')
        .insert({
          user_id: user.id,
          name,
          color,
          goal_minutes: goalMinutes,
          difficulty,
          contest_id: contestId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Matéria adicionada!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar matéria');
      console.error(error);
    },
  });

  const updateSubject = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Omit<Subject, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await supabase
        .from('subjects')
        .update({
          name: updates.name,
          color: updates.color,
          goal_minutes: updates.goal_minutes,
          difficulty: updates.difficulty,
          total_minutes: updates.total_minutes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Matéria atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar matéria');
      console.error(error);
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast.success('Matéria excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir matéria');
      console.error(error);
    },
  });

  return {
    subjects,
    isLoading,
    addSubject: addSubject.mutate,
    addSubjectWithContest: addSubjectWithContest.mutate,
    updateSubject: updateSubject.mutate,
    deleteSubject: deleteSubject.mutate,
  };
}
