import { createClient } from 'npm:@supabase/supabase-js@2';
import { createOpenAI } from 'npm:@ai-sdk/openai@4';
import { convertToModelMessages, streamText, type UIMessage } from 'npm:ai@7';
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from '../_shared/ai-gateway.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id',
};

const mentorInstructions = `Você é o Mentor do Concurseiro, especialista em preparação para concursos públicos de alto nível, especialmente Cebraspe, FGV e Vunesp.
Responda sempre em português do Brasil, com rigor técnico, clareza e aplicação prática.
Ao criar planos e ciclos, faça diagnóstico, priorize conteúdos de maior retorno pela regra 80/20, distribua teoria, questões e revisão, e aplique repetição espaçada.
Ao resolver questões, identifique a banca e o estilo de cobrança, explique cada alternativa ou assertiva, destaque pegadinhas, fundamente a resposta e encerre com uma regra de memorização.
Nunca invente leis, súmulas, editais ou estatísticas. Quando faltarem dados, diga quais premissas adotou e faça perguntas objetivas.
Use títulos, listas e tabelas em Markdown quando isso melhorar a leitura.`;

const safeMessage = (message: UIMessage) => ({
  sdk_message_id: message.id,
  role: message.role,
  parts: message.parts,
  metadata: message.metadata ?? {},
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'POST') return Response.json({ message: 'Método não permitido.' }, { status: 405, headers: corsHeaders });

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return Response.json({ message: 'Acesso não autorizado.' }, { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!supabaseUrl || !publishableKey || !lovableApiKey) {
      return Response.json({ message: 'O mentor não está configurado.' }, { status: 500, headers: corsHeaders });
    }

    const db = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: userError } = await db.auth.getUser();
    if (userError || !user) return Response.json({ message: 'Sua sessão expirou. Entre novamente.' }, { status: 401, headers: corsHeaders });

    const body = await request.json() as { threadId?: string; messages?: UIMessage[]; contestId?: string | null };
    if (!body.threadId || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ message: 'Conversa inválida.' }, { status: 400, headers: corsHeaders });
    }

    const { data: thread, error: threadError } = await db
      .from('ai_chat_threads')
      .select('id, title, contest_id')
      .eq('id', body.threadId)
      .eq('user_id', user.id)
      .single();
    if (threadError || !thread) return Response.json({ message: 'Conversa não encontrada.' }, { status: 404, headers: corsHeaders });

    const contestId = body.contestId ?? thread.contest_id;
    let context = 'Nenhum concurso específico foi selecionado.';
    if (contestId) {
      const [{ data: contest }, { data: linked }] = await Promise.all([
        db.from('contests').select('name, exam_date, study_plan_type, cycle_days, current_day, total_cycles').eq('id', contestId).eq('user_id', user.id).maybeSingle(),
        db.from('contest_subjects').select('subjects(name, difficulty, goal_minutes, total_minutes)').eq('contest_id', contestId),
      ]);
      if (contest) {
        const subjectNames = (linked ?? [])
          .map((item) => {
            const subject = Array.isArray(item.subjects) ? item.subjects[0] : item.subjects;
            return subject ? `${subject.name} (dificuldade: ${subject.difficulty}, meta: ${subject.goal_minutes} min)` : null;
          })
          .filter(Boolean)
          .join('; ');
        context = `Concurso: ${contest.name}. Data da prova: ${contest.exam_date ?? 'não informada'}. Organização: ${contest.study_plan_type}. Dia atual: ${contest.current_day}/${contest.cycle_days}. Matérias vinculadas: ${subjectNames || 'nenhuma'}.`;
      }
    }

    const latestUserMessage = [...body.messages].reverse().find((message) => message.role === 'user');
    if (latestUserMessage) {
      const row = safeMessage(latestUserMessage);
      const { error } = await db.from('ai_chat_messages').upsert({
        ...row,
        thread_id: thread.id,
        user_id: user.id,
      }, { onConflict: 'thread_id,sdk_message_id' });
      if (error) throw error;
    }

    const firstUserText = body.messages
      .find((message) => message.role === 'user')
      ?.parts.filter((part) => part.type === 'text').map((part) => part.text).join(' ').trim();
    const updates: { contest_id?: string | null; title?: string } = { contest_id: contestId ?? null };
    if (thread.title === 'Nova conversa' && firstUserText) updates.title = firstUserText.slice(0, 64);
    await db.from('ai_chat_threads').update(updates).eq('id', thread.id).eq('user_id', user.id);

    const initialRunId = getLovableAiGatewayRunId(request);
    const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
    const lovable = createOpenAI({
      baseURL: 'https://ai.gateway.lovable.dev/v1',
      apiKey: lovableApiKey,
      headers: { 'Lovable-API-Key': lovableApiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
      fetch: runIdFetch.fetch,
    });

    const result = streamText({
      model: lovable.responses('openai/gpt-6-astra'),
      system: `${mentorInstructions}\n\nContexto atual do aluno:\n${context}`,
      messages: await convertToModelMessages(body.messages),
      abortSignal: request.signal,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: 'medium',
          reasoningSummary: 'auto',
          store: false,
          include: ['reasoning.encrypted_content'],
        },
      },
    });

    const response = result.toUIMessageStreamResponse({
      originalMessages: body.messages,
      sendReasoning: true,
      headers: corsHeaders,
      onFinish: async ({ messages }) => {
        const assistant = [...messages].reverse().find((message) => message.role === 'assistant');
        if (!assistant) return;
        const row = safeMessage(assistant);
        const { error } = await db.from('ai_chat_messages').upsert({
          ...row,
          thread_id: thread.id,
          user_id: user.id,
        }, { onConflict: 'thread_id,sdk_message_id' });
        if (error) console.error('Failed to persist assistant message', error.message);
      },
    });
    return withLovableAiGatewayRunIdHeader(response, runIdFetch, corsHeaders);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return Response.json({ message: 'Resposta interrompida.' }, { status: 499, headers: corsHeaders });
    }
    console.error('mentor-chat error', error);
    return Response.json({ message: error instanceof Error ? error.message : 'Não foi possível consultar o mentor.' }, { status: 500, headers: corsHeaders });
  }
});