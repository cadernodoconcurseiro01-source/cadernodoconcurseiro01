import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudyCycle, Subject, StudyScheduleItem, DifficultyLevel, StudyPlanType } from '@/types/database';
import { toast } from 'sonner';

const defaultCycle: Omit<StudyCycle, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  subjects_per_day: 4,
  daily_hours: 4,
  current_day: 0,
  cycle_days: 7,
  plan_type: 'cycle',
};

// Algorithm to generate study schedule based on difficulty rules:
// - Never put two high difficulty subjects together
// - Prioritize high difficulty in the morning
// - Mix high + low or high + medium
function generateDailySchedule(
  subjects: Subject[],
  dailyHours: number,
  subjectsPerDay: number
): StudyScheduleItem[] {
  if (subjects.length === 0) return [];

  const highSubjects = subjects.filter(s => s.difficulty === 'high');
  const mediumSubjects = subjects.filter(s => s.difficulty === 'medium');
  const lowSubjects = subjects.filter(s => s.difficulty === 'low');

  const selectedSubjects: Subject[] = [];
  const periods: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening', 'evening'];
  
  // Helper to get random item from array
  const getRandomItem = <T,>(arr: T[]): T | undefined => {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  // Remove item from arrays
  const removeFromAll = (subject: Subject) => {
    const idx1 = highSubjects.findIndex(s => s.id === subject.id);
    if (idx1 > -1) highSubjects.splice(idx1, 1);
    const idx2 = mediumSubjects.findIndex(s => s.id === subject.id);
    if (idx2 > -1) mediumSubjects.splice(idx2, 1);
    const idx3 = lowSubjects.findIndex(s => s.id === subject.id);
    if (idx3 > -1) lowSubjects.splice(idx3, 1);
  };

  // Build schedule respecting rules
  let lastWasHigh = false;
  
  for (let i = 0; i < Math.min(subjectsPerDay, subjects.length); i++) {
    let nextSubject: Subject | undefined;
    
    const isFirstSlot = i === 0;
    
    if (isFirstSlot && highSubjects.length > 0) {
      // Morning: prioritize high difficulty
      nextSubject = getRandomItem(highSubjects);
    } else if (lastWasHigh) {
      // After high, pick low or medium
      if (lowSubjects.length > 0) {
        nextSubject = getRandomItem(lowSubjects);
      } else if (mediumSubjects.length > 0) {
        nextSubject = getRandomItem(mediumSubjects);
      } else if (highSubjects.length > 0) {
        // No choice, pick high
        nextSubject = getRandomItem(highSubjects);
      }
    } else {
      // Can pick high if not last was high
      if (highSubjects.length > 0 && i < 2) {
        // Morning slots can have high
        nextSubject = getRandomItem(highSubjects);
      } else if (mediumSubjects.length > 0) {
        nextSubject = getRandomItem(mediumSubjects);
      } else if (lowSubjects.length > 0) {
        nextSubject = getRandomItem(lowSubjects);
      } else if (highSubjects.length > 0) {
        nextSubject = getRandomItem(highSubjects);
      }
    }
    
    if (nextSubject) {
      selectedSubjects.push(nextSubject);
      removeFromAll(nextSubject);
      lastWasHigh = nextSubject.difficulty === 'high';
    }
  }

  // Calculate duration per subject
  const totalMinutes = dailyHours * 60;
  const minutesPerSubject = Math.floor(totalMinutes / selectedSubjects.length);

  return selectedSubjects.map((subject, index) => ({
    subjectId: subject.id,
    subjectName: subject.name,
    color: subject.color,
    difficulty: subject.difficulty,
    durationMinutes: minutesPerSubject,
    period: periods[index] || 'evening',
  }));
}

export function useStudyCycle(subjects: Subject[]) {
  const queryClient = useQueryClient();

  const { data: cycle, isLoading } = useQuery({
    queryKey: ['study-cycle'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaultCycle;

      const { data, error } = await supabase
        .from('study_cycles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const { data: newCycle, error: insertError } = await supabase
          .from('study_cycles')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return {
          ...newCycle,
          plan_type: (newCycle.plan_type === 'injected' ? 'plan' : newCycle.plan_type) as StudyPlanType
        } as StudyCycle;
      }

      return {
        ...data,
        plan_type: (data.plan_type === 'injected' ? 'plan' : data.plan_type) as StudyPlanType
      } as StudyCycle;
    },
  });

  const updateCycle = useMutation({
    mutationFn: async (updates: Partial<Omit<StudyCycle, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('study_cycles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-cycle'] });
      toast.success('Configurações atualizadas!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar configurações');
      console.error(error);
    },
  });

  const advanceDay = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const currentDay = (cycle?.current_day || 0) + 1;

      const { data, error } = await supabase
        .from('study_cycles')
        .update({ current_day: currentDay })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-cycle'] });
    },
  });

  const getTodaySchedule = (): StudyScheduleItem[] => {
    if (!cycle || subjects.length === 0) return [];
    return generateDailySchedule(subjects, cycle.daily_hours, cycle.subjects_per_day);
  };

  return {
    cycle: cycle || defaultCycle,
    isLoading,
    updateCycle: updateCycle.mutate,
    advanceDay: advanceDay.mutate,
    getTodaySchedule,
  };
}
