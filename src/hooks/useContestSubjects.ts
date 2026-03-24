import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subject } from '@/types/database';
import { toast } from 'sonner';

interface ContestSubjectMapping {
  id: string;
  contest_id: string;
  subject_id: string;
  created_at: string;
}

export function useContestSubjects() {
  const queryClient = useQueryClient();

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['contest_subjects'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('contest_subjects')
        .select('*');

      if (error) throw error;
      return (data || []) as ContestSubjectMapping[];
    },
  });

  const getSubjectsForContest = (contestId: string, allSubjects: Subject[]): Subject[] => {
    const subjectIds = mappings
      .filter(m => m.contest_id === contestId)
      .map(m => m.subject_id);
    return allSubjects.filter(s => subjectIds.includes(s.id));
  };

  const getAvailableSubjectsForContest = (contestId: string, allSubjects: Subject[]): Subject[] => {
    const linkedIds = mappings
      .filter(m => m.contest_id === contestId)
      .map(m => m.subject_id);
    return allSubjects.filter(s => !linkedIds.includes(s.id));
  };

  const linkSubjects = useMutation({
    mutationFn: async ({ subjectIds, contestId }: { subjectIds: string[]; contestId: string }) => {
      const rows = subjectIds.map(subject_id => ({ contest_id: contestId, subject_id }));
      const { error } = await supabase
        .from('contest_subjects')
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest_subjects'] });
      toast.success('Matérias vinculadas ao concurso!');
    },
    onError: (error) => {
      toast.error('Erro ao vincular matérias');
      console.error(error);
    },
  });

  const unlinkSubject = useMutation({
    mutationFn: async ({ subjectId, contestId }: { subjectId: string; contestId: string }) => {
      const { error } = await supabase
        .from('contest_subjects')
        .delete()
        .eq('contest_id', contestId)
        .eq('subject_id', subjectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest_subjects'] });
      toast.success('Matéria desvinculada!');
    },
    onError: (error) => {
      toast.error('Erro ao desvincular matéria');
      console.error(error);
    },
  });

  return {
    mappings,
    isLoading,
    getSubjectsForContest,
    getAvailableSubjectsForContest,
    linkSubjects: linkSubjects.mutate,
    linkSubjectsAsync: linkSubjects.mutateAsync,
    unlinkSubject: unlinkSubject.mutate,
  };
}
