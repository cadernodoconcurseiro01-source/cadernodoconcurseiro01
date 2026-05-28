import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudyRevision {
  id: string;
  user_id: string;
  revision_date: string;
  created_at: string;
}

export function useStudyRevisions() {
  const queryClient = useQueryClient();

  const { data: revisions = [], isLoading } = useQuery({
    queryKey: ['study_revisions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('study_revisions')
        .select('*')
        .eq('user_id', user.id)
        .order('revision_date', { ascending: false });
      if (error) throw error;
      return (data || []) as StudyRevision[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ date, marked }: { date: string; marked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      if (marked) {
        const { error } = await supabase
          .from('study_revisions')
          .delete()
          .eq('user_id', user.id)
          .eq('revision_date', date);
        if (error) throw error;
        return { date, marked: false };
      }
      const { error } = await supabase
        .from('study_revisions')
        .insert({ user_id: user.id, revision_date: date });
      if (error) throw error;
      return { date, marked: true };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['study_revisions'] });
      toast.success(res.marked ? 'Revisão marcada!' : 'Revisão removida');
    },
    onError: (e) => { console.error(e); toast.error('Erro ao salvar revisão'); },
  });

  return {
    revisions,
    isLoading,
    toggleRevisionAsync: toggle.mutateAsync,
  };
}
