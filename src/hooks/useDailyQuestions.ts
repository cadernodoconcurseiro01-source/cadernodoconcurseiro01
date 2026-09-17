 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { DailyQuestion, Subject } from '@/types/database';
 import { toast } from 'sonner';
 import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
 
 export function useDailyQuestions() {
   const queryClient = useQueryClient();
 
   const { data: dailyQuestions = [], isLoading } = useQuery({
     queryKey: ['daily-questions'],
     queryFn: async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return [];
 
       const { data, error } = await supabase
         .from('daily_questions')
         .select('*')
         .eq('user_id', user.id)
         .order('question_date', { ascending: false });
 
       if (error) throw error;
       return data as DailyQuestion[];
     },
   });
 
   const addOrUpdateDailyQuestions = useMutation({
     mutationFn: async (data: { 
        contest_id: string | null;
       subject_id: string; 
       total_questions: number; 
       correct_answers: number; 
       wrong_answers: number;
       question_date?: string;
     }) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('Usuário não autenticado');
 
      const questionDate = data.question_date || format(new Date(), 'yyyy-MM-dd');

      const performUpdate = async () => {
        const { data: existing, error: selErr } = await supabase
          .from('daily_questions')
          .select('*')
          .eq('user_id', user.id)
          .eq('subject_id', data.subject_id)
          .eq('question_date', questionDate)
          .is('contest_id', data.contest_id)
          .maybeSingle();
        if (selErr) throw selErr;
        if (!existing) return null;
        const { data: updated, error } = await supabase
          .from('daily_questions')
          .update({
            total_questions: existing.total_questions + data.total_questions,
            correct_answers: existing.correct_answers + data.correct_answers,
            wrong_answers: existing.wrong_answers + data.wrong_answers,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      };

      const updated = await performUpdate();
      if (updated) return updated;

      // Try insert; if duplicate (concurrent insert), fall back to update
      const { data: inserted, error } = await supabase
        .from('daily_questions')
        .insert({
          user_id: user.id,
           contest_id: data.contest_id,
          subject_id: data.subject_id,
          question_date: questionDate,
          total_questions: data.total_questions,
          correct_answers: data.correct_answers,
          wrong_answers: data.wrong_answers,
        })
        .select()
        .single();

      if (error) {
        if ((error as any).code === '23505') {
          const retried = await performUpdate();
          if (retried) return retried;
        }
        throw error;
      }
      return inserted;
    },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['daily-questions'] });
       toast.success('Questões registradas!');
     },
     onError: (error) => {
       toast.error('Erro ao registrar questões');
       console.error(error);
    },
  });

  const updateDailyQuestion = useMutation({
    mutationFn: async (data: {
      id: string;
      total_questions: number;
      correct_answers: number;
      wrong_answers: number;
    }) => {
      const { data: updated, error } = await supabase
        .from('daily_questions')
        .update({
          total_questions: data.total_questions,
          correct_answers: data.correct_answers,
          wrong_answers: data.wrong_answers,
        })
        .eq('id', data.id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-questions'] });
      toast.success('Questão atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar questão');
    },
  });

  const deleteDailyQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-questions'] });
      toast.success('Questão excluída!');
    },
    onError: () => {
      toast.error('Erro ao excluir questão');
    },
   });
 
   const getWeeklyStats = (subjects: Subject[]) => {
     const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
     const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
 
     return days.map(day => {
       const dateStr = format(day, 'yyyy-MM-dd');
       const dayQuestions = dailyQuestions.filter(q => q.question_date === dateStr);
       const total = dayQuestions.reduce((sum, q) => sum + q.total_questions, 0);
       const correct = dayQuestions.reduce((sum, q) => sum + q.correct_answers, 0);
       
       return {
         date: format(day, 'EEE'),
         total,
         correct,
         wrong: total - correct,
         percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
       };
     });
   };
 
   const getBySubject = (subjects: Subject[]) => {
     return subjects.map(subject => {
       const subjectQuestions = dailyQuestions.filter(q => q.subject_id === subject.id);
       const total = subjectQuestions.reduce((sum, q) => sum + q.total_questions, 0);
       const correct = subjectQuestions.reduce((sum, q) => sum + q.correct_answers, 0);
       
       return {
         name: subject.name,
         color: subject.color,
         total,
         correct,
         wrong: total - correct,
         percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
       };
     }).filter(s => s.total > 0);
   };
 
   const getTotalStats = () => {
     const total = dailyQuestions.reduce((sum, q) => sum + q.total_questions, 0);
     const correct = dailyQuestions.reduce((sum, q) => sum + q.correct_answers, 0);
     const wrong = dailyQuestions.reduce((sum, q) => sum + q.wrong_answers, 0);
     const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
 
     return { total, correct, wrong, percentage };
   };
 
     return {
       dailyQuestions,
       isLoading,
       addOrUpdateDailyQuestions: addOrUpdateDailyQuestions.mutate,
       addOrUpdateDailyQuestionsAsync: addOrUpdateDailyQuestions.mutateAsync,
       updateDailyQuestion: updateDailyQuestion.mutateAsync,
       deleteDailyQuestion: deleteDailyQuestion.mutateAsync,
       getWeeklyStats,
       getBySubject,
       getTotalStats,
     };
 }