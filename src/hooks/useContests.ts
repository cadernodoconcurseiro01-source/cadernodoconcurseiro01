import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contest, StudyPlanType, StudyPeriod } from '@/types/database';
import { toast } from 'sonner';

export function useContests() {
  const queryClient = useQueryClient();

  const { data: contests = [], isLoading } = useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map study_plan_type from DB to our type
      return (data || []).map(item => ({
        ...item,
        study_plan_type: (item.study_plan_type === 'injected' ? 'plan' : item.study_plan_type) as StudyPlanType,
        study_periods: (item.study_periods || ['morning', 'afternoon', 'evening']) as StudyPeriod[],
      })) as Contest[];
    },
  });

  const addContest = useMutation({
    mutationFn: async (contest: Omit<Contest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const insertData = {
        name: contest.name,
        exam_date: contest.exam_date,
        study_plan_type: contest.study_plan_type as string,
        cycle_days: contest.cycle_days,
        cycle_number: contest.cycle_number,
        total_cycles: contest.total_cycles ?? 1,
        current_day: contest.current_day ?? 1,
        subjects_per_day: contest.subjects_per_day,
        study_periods: contest.study_periods as string[],
        is_active: contest.is_active,
        user_id: user.id,
      };

      console.log('Inserting contest:', insertData);

      const { data, error } = await supabase
        .from('contests')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success('Concurso cadastrado!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar concurso');
      console.error(error);
    },
  });

  const updateContest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contest> & { id: string }) => {
      const { data, error } = await supabase
        .from('contests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success('Concurso atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar concurso');
      console.error(error);
    },
  });

  const deleteContest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      toast.success('Concurso removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover concurso');
      console.error(error);
    },
  });

  return {
    contests,
    isLoading,
    addContest: addContest.mutate,
    addContestAsync: addContest.mutateAsync,
    updateContest: updateContest.mutate,
    updateContestAsync: updateContest.mutateAsync,
    deleteContest: deleteContest.mutate,
  };
}
