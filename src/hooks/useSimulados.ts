import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Simulado, SubjectDetail } from '@/types/database';
import { toast } from 'sonner';

export function useSimulados() {
  const queryClient = useQueryClient();

  const { data: simulados = [], isLoading } = useQuery({
    queryKey: ['simulados'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('simulados')
        .select('*')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: false });

      if (error) throw error;
      
      // Parse subject_details from JSON
      return (data || []).map(item => ({
        ...item,
        subject_details: (item.subject_details as unknown) as SubjectDetail[] | null
      })) as Simulado[];
    },
  });

  const addSimulado = useMutation({
    mutationFn: async (simulado: Omit<Simulado, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('simulados')
        .insert({ 
          ...simulado, 
          user_id: user.id,
          subject_details: simulado.subject_details as any
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulados'] });
      toast.success('Simulado cadastrado!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar simulado');
      console.error(error);
    },
  });

  const updateSimulado = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Simulado> & { id: string }) => {
      const updateData = {
        ...updates,
        subject_details: updates.subject_details as any
      };
      
      const { data, error } = await supabase
        .from('simulados')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulados'] });
      toast.success('Simulado atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar simulado');
      console.error(error);
    },
  });

  const deleteSimulado = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('simulados')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulados'] });
      toast.success('Simulado removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover simulado');
      console.error(error);
    },
  });

  const getStats = () => {
    const totalSimulados = simulados.length;
    const totalQuestions = simulados.reduce((sum, s) => sum + s.total_questions, 0);
    const totalCorrect = simulados.reduce((sum, s) => sum + s.correct_answers, 0);
    const totalWrong = simulados.reduce((sum, s) => sum + s.wrong_answers, 0);
    const avgPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return { totalSimulados, totalQuestions, totalCorrect, totalWrong, avgPercentage };
  };

  return {
    simulados,
    isLoading,
    addSimulado: addSimulado.mutate,
    addSimuladoAsync: addSimulado.mutateAsync,
    updateSimulado: updateSimulado.mutate,
    updateSimuladoAsync: updateSimulado.mutateAsync,
    deleteSimulado: deleteSimulado.mutate,
    getStats,
  };
}
