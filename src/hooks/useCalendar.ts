import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CalendarNote {
  id: string;
  user_id: string;
  note_date: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  event_date: string;
  title: string;
  description: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export function useCalendarNotes() {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['calendar_notes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('calendar_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CalendarNote[];
    },
  });

  const addNote = useMutation({
    mutationFn: async ({ note_date, title, content }: { note_date: string; title: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('calendar_notes')
        .insert({ user_id: user.id, note_date, title, content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_notes'] });
      toast.success('Anotação salva!');
    },
    onError: (e) => { console.error(e); toast.error('Erro ao salvar anotação'); },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { error } = await supabase
        .from('calendar_notes')
        .update({ title, content })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_notes'] });
      toast.success('Anotação atualizada!');
    },
    onError: (e) => { console.error(e); toast.error('Erro ao atualizar'); },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_notes'] });
      toast.success('Anotação removida');
    },
    onError: (e) => { console.error(e); toast.error('Erro ao remover'); },
  });

  return {
    notes,
    isLoading,
    addNoteAsync: addNote.mutateAsync,
    updateNoteAsync: updateNote.mutateAsync,
    deleteNoteAsync: deleteNote.mutateAsync,
  };
}

export function useCalendarEvents() {
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar_events'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return (data || []) as CalendarEvent[];
    },
  });

  const addEvent = useMutation({
    mutationFn: async ({ event_date, title, description, type }: { event_date: string; title: string; description?: string; type?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ user_id: user.id, event_date, title, description: description || null, type: type || 'exam' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Evento adicionado!');
    },
    onError: (e) => { console.error(e); toast.error('Erro ao adicionar evento'); },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
      toast.success('Evento removido');
    },
    onError: (e) => { console.error(e); toast.error('Erro ao remover'); },
  });

  return {
    events,
    isLoading,
    addEventAsync: addEvent.mutateAsync,
    deleteEventAsync: deleteEvent.mutateAsync,
  };
}
