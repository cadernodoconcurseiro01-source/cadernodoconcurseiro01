import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TimerSettings } from '@/types/database';
import { toast } from 'sonner';

const defaultSettings: Omit<TimerSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  focus_duration: 25,
  short_break_duration: 5,
  long_break_duration: 15,
  sessions_until_long_break: 4,
};

export function useTimerSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['timer-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return defaultSettings;

      const { data, error } = await supabase
        .from('timer_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Create default settings if none exist
        const { data: newSettings, error: insertError } = await supabase
          .from('timer_settings')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as TimerSettings;
      }

      return data as TimerSettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<TimerSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('timer_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-settings'] });
      toast.success('Configurações salvas!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    },
  });

  return {
    settings: settings || defaultSettings,
    isLoading,
    updateSettings: updateSettings.mutate,
  };
}
