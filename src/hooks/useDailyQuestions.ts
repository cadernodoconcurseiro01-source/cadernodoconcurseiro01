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
       subject_id: string; 
       total_questions: number; 
       correct_answers: number; 
       wrong_answers: number;
       question_date?: string;
     }) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('Usuário não autenticado');
 
       const questionDate = data.question_date || format(new Date(), 'yyyy-MM-dd');
 
       // Check if entry exists for this date and subject
       const { data: existing } = await supabase
         .from('daily_questions')
         .select('*')
         .eq('user_id', user.id)
         .eq('subject_id', data.subject_id)
         .eq('question_date', questionDate)
         .maybeSingle();
 
       if (existing) {
         // Update existing
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
       } else {
         // Insert new
         const { data: inserted, error } = await supabase
           .from('daily_questions')
           .insert({
             user_id: user.id,
             subject_id: data.subject_id,
             question_date: questionDate,
             total_questions: data.total_questions,
             correct_answers: data.correct_answers,
             wrong_answers: data.wrong_answers,
           })
           .select()
           .single();
 
         if (error) throw error;
         return inserted;
       }
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
 
   const getWeeklyStats = (subjects: Subject[]) => {
     const today = new Date();
     const weekStart = startOfWeek(today, { weekStartsOn: 1 });
     const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
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
      getWeeklyStats,
      getBySubject,
      getTotalStats,
    };
 }