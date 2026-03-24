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
        })
        .select()
        .single();

      if (error) throw error;

      // Also link to contest via junction table
      if (contestId && data) {
        const { error: linkError } = await supabase
          .from('contest_subjects')
          .insert({ contest_id: contestId, subject_id: data.id });
        if (linkError) console.error('Error linking subject to contest:', linkError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['contest_subjects'] });
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

  const linkSubjectsToContest = useMutation({
    mutationFn: async ({ subjectIds, contestId }: { subjectIds: string[]; contestId: string }) => {
      const updates = subjectIds.map(id =>
        supabase
          .from('subjects')
          .update({ contest_id: contestId })
          .eq('id', id)
          .select()
          .single()
      );
      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
      return results.map(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success('Matérias vinculadas ao concurso!');
    },
    onError: (error) => {
      toast.error('Erro ao vincular matérias');
      console.error(error);
    },
  });

  return {
    subjects,
    isLoading,
    addSubject: addSubject.mutate,
    addSubjectAsync: addSubject.mutateAsync,
    addSubjectWithContest: addSubjectWithContest.mutate,
    addSubjectWithContestAsync: addSubjectWithContest.mutateAsync,
    updateSubject: updateSubject.mutate,
    deleteSubject: deleteSubject.mutate,
    linkSubjectsToContest: linkSubjectsToContest.mutate,
    linkSubjectsToContestAsync: linkSubjectsToContest.mutateAsync,
  };
}
