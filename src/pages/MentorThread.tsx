import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { ArrowLeft, BrainCircuit, CalendarRange, CircleHelp, ListChecks, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContests } from '@/hooks/useContests';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const NO_CONTEST = '__none__';
const quickPrompts = [
  { label: 'Plano 80/20', icon: ListChecks, prompt: 'Crie um plano de estudos personalizado usando a regra 80/20. Antes, faça as perguntas essenciais para o diagnóstico.' },
  { label: 'Ciclo eficiente', icon: CalendarRange, prompt: 'Monte um ciclo de estudos eficiente para este concurso, equilibrando teoria, questões e revisões.' },
  { label: 'Revisão espaçada', icon: RefreshCcw, prompt: 'Estruture um calendário de repetição espaçada para as matérias deste concurso.' },
  { label: 'Analisar questão', icon: CircleHelp, prompt: 'Vou enviar uma questão. Analise o estilo da banca, resolva e explique cada alternativa detalhadamente.' },
];

const MentorThread = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { contests } = useContests();
  const queryClient = useQueryClient();

  const threadQuery = useQuery({
    queryKey: ['ai-chat-thread', threadId, user?.id],
    enabled: Boolean(threadId && user),
    queryFn: async () => {
      if (!threadId || !user) throw new Error('Conversa inválida');
      const { data: thread, error: threadError } = await supabase
        .from('ai_chat_threads').select('*').eq('id', threadId).eq('user_id', user.id).single();
      if (threadError) throw threadError;
      const { data: rows, error: messagesError } = await supabase
        .from('ai_chat_messages').select('*').eq('thread_id', threadId).eq('user_id', user.id).order('created_at');
      if (messagesError) throw messagesError;
      const messages = (rows ?? []).map((row) => ({
        id: row.sdk_message_id,
        role: row.role as UIMessage['role'],
        parts: row.parts as UIMessage['parts'],
        metadata: row.metadata,
      })) as UIMessage[];
      return { thread, messages };
    },
  });

  if (threadQuery.isLoading) {
    return <div className="container mx-auto max-w-5xl px-4 py-8"><Skeleton className="h-[70vh]" /></div>;
  }
  if (!threadId || !threadQuery.data || threadQuery.error) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Conversa não encontrada</h1>
        <Button className="mt-6" onClick={() => navigate('/mentor')}>Voltar ao Mentor IA</Button>
      </div>
    );
  }

  return (
    <MentorChat
      key={threadId}
      threadId={threadId}
      initialMessages={threadQuery.data.messages}
      initialContestId={threadQuery.data.thread.contest_id}
      title={threadQuery.data.thread.title}
      contests={contests}
      accessToken={session?.access_token ?? ''}
      onBack={() => navigate('/mentor')}
      onChanged={() => {
        queryClient.invalidateQueries({ queryKey: ['ai-chat-threads', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['ai-chat-thread', threadId, user?.id] });
      }}
    />
  );
};

type MentorChatProps = {
  threadId: string;
  initialMessages: UIMessage[];
  initialContestId: string | null;
  title: string;
  contests: ReturnType<typeof useContests>['contests'];
  accessToken: string;
  onBack: () => void;
  onChanged: () => void;
};

const MentorChat = ({ threadId, initialMessages, initialContestId, title, contests, accessToken, onBack, onChanged }: MentorChatProps) => {
  const [contestId, setContestId] = useState(initialContestId ?? NO_CONTEST);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const focusComposer = () => composerRef.current?.querySelector('textarea')?.focus();
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`;
  const transport = useMemo(() => new DefaultChatTransport({
    api: endpoint,
    headers: { Authorization: `Bearer ${accessToken}` },
    prepareSendMessagesRequest: ({ messages }) => ({
      body: { threadId, contestId: contestId === NO_CONTEST ? null : contestId, messages },
    }),
  }), [accessToken, contestId, endpoint, threadId]);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      onChanged();
      window.setTimeout(focusComposer, 0);
    },
    onError: (chatError) => {
      toast.error(chatError.message || 'Não foi possível obter a resposta do mentor.');
      window.setTimeout(focusComposer, 0);
    },
  });
  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => { focusComposer(); }, []);

  const changeContest = async (value: string) => {
    setContestId(value);
    try {
      const { error: updateError } = await supabase
        .from('ai_chat_threads')
        .update({ contest_id: value === NO_CONTEST ? null : value })
        .eq('id', threadId);
      if (updateError) throw updateError;
      onChanged();
    } catch (updateError) {
      console.error(updateError);
      toast.error('Não foi possível alterar o concurso.');
    }
  };

  const submitText = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || busy) return;
    await sendMessage({ text: cleanText });
    window.setTimeout(focusComposer, 0);
  };

  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] max-w-5xl flex-col px-4 py-4">
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar às conversas"><ArrowLeft /></Button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold">{title}</h1>
            <p className="text-xs text-muted-foreground">Mentoria estratégica para concursos</p>
          </div>
        </div>
        <Select value={contestId} onValueChange={(value) => void changeContest(value)} disabled={busy}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Concurso da conversa"><SelectValue placeholder="Escolha um concurso" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CONTEST}>Sem concurso específico</SelectItem>
            {contests.map((contest) => <SelectItem key={contest.id} value={contest.id}>{contest.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto w-full max-w-3xl px-0 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState className="min-h-[22rem]">
              <img src={logo} alt="Caderno do Concurseiro 01" className="h-14 w-auto" />
              <h2 className="font-display text-2xl font-semibold">Como posso orientar sua preparação?</h2>
              <p className="max-w-lg text-sm text-muted-foreground">Escolha um ponto de partida ou descreva sua dúvida.</p>
              <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                {quickPrompts.map(({ label, icon: Icon, prompt }) => (
                  <Button key={label} variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => void submitText(prompt)}>
                    <Icon className="h-4 w-4 shrink-0 text-primary" /> {label}
                  </Button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  if (part.type === 'text') return <MessageResponse key={index}>{part.text}</MessageResponse>;
                  if (part.type === 'reasoning') {
                    return <details key={index} className="text-xs text-muted-foreground"><summary className="cursor-pointer font-medium">Raciocínio resumido</summary><p className="mt-2 whitespace-pre-wrap">{part.text}</p></details>;
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === 'submitted' && <Shimmer className="text-sm text-muted-foreground">Analisando sua preparação...</Shimmer>}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div ref={composerRef} className="mx-auto w-full max-w-3xl border-t pt-3">
        <PromptInput onSubmit={({ text }) => submitText(text)}>
          <PromptInputTextarea placeholder="Pergunte sobre plano, ciclo, revisão ou envie uma questão..." disabled={busy} />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && status !== 'ready'} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default MentorThread;