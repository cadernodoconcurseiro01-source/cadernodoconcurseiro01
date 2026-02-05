 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { Contest } from '@/types/database';
 import { toast } from 'sonner';
 
 export function useContests() {
   const queryClient = useQueryClient();
 
   const { data: contests = [], isLoading } = useQuery({
     queryKey: ['contests'],
     queryFn: async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return [];
 
       const { data, error } = await supabase
         .from('contests')
         .select('*')
         .eq('user_id', user.id)
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       return data as Contest[];
     },
   });
 
   const addContest = useMutation({
     mutationFn: async (contest: Omit<Contest, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) throw new Error('Usuário não autenticado');
 
       const { data, error } = await supabase
         .from('contests')
         .insert({ ...contest, user_id: user.id })
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['contests'] });
       toast.success('Concurso cadastrado!');
     },
     onError: (error) => {
       toast.error('Erro ao cadastrar concurso');
       console.error(error);
     },
   });
 
   const updateContest = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<Contest> & { id: string }) => {
       const { data, error } = await supabase
         .from('contests')
         .update(updates)
         .eq('id', id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['contests'] });
       toast.success('Concurso atualizado!');
     },
     onError: (error) => {
       toast.error('Erro ao atualizar concurso');
       console.error(error);
     },
   });
 
   const deleteContest = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('contests')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['contests'] });
       toast.success('Concurso removido!');
     },
     onError: (error) => {
       toast.error('Erro ao remover concurso');
       console.error(error);
     },
   });
 
   return {
     contests,
     isLoading,
     addContest: addContest.mutate,
     updateContest: updateContest.mutate,
     deleteContest: deleteContest.mutate,
   };
 }