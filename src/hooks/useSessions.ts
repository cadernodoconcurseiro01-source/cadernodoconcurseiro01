import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudySession } from '@/types/database';

export interface StudyStats {
  todayMinutes: number;
  weekMinutes: number;
  streak: number;
  totalSessions: number;
}

function calculateStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const hasSession = sessions.some(s => {
      const sessionDate = new Date(s.start_time);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === currentDate.getTime();
    });
    
    if (!hasSession && currentDate.getTime() < today.getTime()) break;
    if (hasSession) streak++;
    
    currentDate.setDate(currentDate.getDate() - 1);
    if (streak === 0 && !hasSession) break;
  }
  
  return streak;
}

export function useSessions() {
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StudySession[];
    },
  });

  const addSession = useMutation({
    mutationFn: async ({ 
      contestId,
      subjectId, 
      duration, 
      type = 'pomodoro' 
    }: { 
      contestId?: string;
      subjectId: string; 
      duration: number; 
      type?: 'pomodoro' | 'free' | 'flashcard';
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const startTime = new Date(Date.now() - duration * 60 * 1000);
      const endTime = new Date();

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          contest_id: contestId ?? null,
          subject_id: subjectId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration,
          type,
        })
        .select()
        .single();

      if (error) throw error;

      // Update subject total minutes
      const { data: subject } = await supabase
        .from('subjects')
        .select('total_minutes')
        .eq('id', subjectId)
        .single();

      if (subject) {
        await supabase
          .from('subjects')
          .update({ total_minutes: subject.total_minutes + duration })
          .eq('id', subjectId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const getStats = (): StudyStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.start_time);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.start_time);
      return sessionDate >= weekStart;
    });
    
    return {
      todayMinutes: todaySessions.reduce((sum, s) => sum + s.duration, 0),
      weekMinutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
      streak: calculateStreak(sessions),
      totalSessions: sessions.length,
    };
  };

  return {
    sessions,
    isLoading,
    addSession: addSession.mutate,
    getStats,
  };
}
