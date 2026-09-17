import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { slotKey } from '@/lib/studyPlan';

export interface ContestCycleSlot {
  id: string;
  contest_id: string;
  cycle_index: number;
  day_number: number;
  slot_index: number;
  subject_id: string;
}

export function useContestCycleSlots(contestId?: string) {
  const queryClient = useQueryClient();

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['contest-cycle-slots', contestId ?? 'all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as ContestCycleSlot[];

      let query = supabase
        .from('contest_cycle_slots')
        .select('id, contest_id, cycle_index, day_number, slot_index, subject_id')
        .eq('user_id', user.id);

      if (contestId) query = query.eq('contest_id', contestId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContestCycleSlot[];
    },
  });

  const overridesFor = (id: string) => {
    const map = new Map<string, string>();
    slots
      .filter(s => s.contest_id === id)
      .forEach(s => map.set(slotKey(s.cycle_index, s.day_number, s.slot_index), s.subject_id));
    return map;
  };

  const setSlot = useMutation({
    mutationFn: async (params: {
      contestId: string;
      cycle: number;
      day: number;
      slot: number;
      subjectId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('contest_cycle_slots')
        .upsert(
          {
            user_id: user.id,
            contest_id: params.contestId,
            cycle_index: params.cycle,
            day_number: params.day,
            slot_index: params.slot,
            subject_id: params.subjectId,
          },
          { onConflict: 'contest_id,cycle_index,day_number,slot_index' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest-cycle-slots'] });
      toast.success('Matéria alterada!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar a matéria');
      console.error(error);
    },
  });

  const resetCycle = useMutation({
    mutationFn: async (params: { contestId: string; cycle: number }) => {
      const { error } = await supabase
        .from('contest_cycle_slots')
        .delete()
        .eq('contest_id', params.contestId)
        .eq('cycle_index', params.cycle);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest-cycle-slots'] });
      toast.success('Ciclo restaurado ao padrão!');
    },
    onError: (error) => {
      toast.error('Erro ao restaurar o ciclo');
      console.error(error);
    },
  });

  return {
    slots,
    isLoading,
    overridesFor,
    setSlot: setSlot.mutate,
    setSlotAsync: setSlot.mutateAsync,
    resetCycle: resetCycle.mutate,
  };
}
