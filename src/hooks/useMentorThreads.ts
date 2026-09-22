import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AIChatThread } from '@/types/database';

export function useMentorThreads() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: ['ai-chat-threads', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ai_chat_threads')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as AIChatThread[];
    },
  });

  const createThread = useMutation({
    mutationFn: async ({ contestId }: { contestId?: string | null } = {}) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('ai_chat_threads')
        .insert({ user_id: user.id, contest_id: contestId ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as AIChatThread;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat-threads', user?.id] }),
  });

  const deleteThread = useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase.from('ai_chat_threads').delete().eq('id', threadId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-chat-threads', user?.id] }),
  });

  return {
    threads: threadsQuery.data ?? [],
    isLoading: threadsQuery.isLoading,
    error: threadsQuery.error,
    createThreadAsync: createThread.mutateAsync,
    isCreating: createThread.isPending,
    deleteThreadAsync: deleteThread.mutateAsync,
  };
}