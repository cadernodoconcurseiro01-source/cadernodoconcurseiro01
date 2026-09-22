import { useNavigate } from 'react-router-dom';
import { BrainCircuit, MessageSquareText, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMentorThreads } from '@/hooks/useMentorThreads';
import { toast } from 'sonner';

const MentorList = () => {
  const navigate = useNavigate();
  const { threads, isLoading, createThreadAsync, deleteThreadAsync, isCreating } = useMentorThreads();

  const createThread = async () => {
    try {
      const thread = await createThreadAsync({});
      navigate(`/mentor/${thread.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível iniciar a conversa.');
    }
  };

  const removeThread = async (threadId: string) => {
    try {
      await deleteThreadAsync(threadId);
      toast.success('Conversa excluída.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível excluir a conversa.');
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <BrainCircuit className="h-8 w-8 text-primary" />
            Mentor IA
          </h1>
          <p className="mt-2 text-muted-foreground">Estratégia, ciclos e resolução detalhada para sua aprovação.</p>
        </div>
        <Button onClick={() => void createThread()} disabled={isCreating}>
          <Plus className="h-4 w-4" /> Nova conversa
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-20" />)}</div>
      ) : threads.length === 0 ? (
        <div className="border-y py-16 text-center">
          <MessageSquareText className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-xl font-semibold">Comece sua preparação guiada</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Crie uma conversa para montar um plano, organizar revisões ou analisar uma questão.</p>
          <Button className="mt-6" onClick={() => void createThread()} disabled={isCreating}>Iniciar conversa</Button>
        </div>
      ) : (
        <div className="divide-y border-y">
          {threads.map((thread) => (
            <div key={thread.id} className="flex items-center gap-3 py-4">
              <Button
                variant="ghost"
                className="h-auto min-w-0 flex-1 justify-start px-2 py-2 text-left"
                onClick={() => navigate(`/mentor/${thread.id}`)}
              >
                <MessageSquareText className="h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{thread.title}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {format(new Date(thread.updated_at), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                  </span>
                </span>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Excluir conversa" onClick={() => void removeThread(thread.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorList;