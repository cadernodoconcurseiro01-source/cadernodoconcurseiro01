CREATE TABLE public.ai_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  contest_id UUID REFERENCES public.contests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_threads TO authenticated;
GRANT ALL ON public.ai_chat_threads TO service_role;
ALTER TABLE public.ai_chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI threads" ON public.ai_chat_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own AI threads" ON public.ai_chat_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI threads" ON public.ai_chat_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own AI threads" ON public.ai_chat_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ai_chat_threads_user_updated_idx ON public.ai_chat_threads (user_id, updated_at DESC);

CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.ai_chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sdk_message_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (thread_id, sdk_message_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_messages TO authenticated;
GRANT ALL ON public.ai_chat_messages TO service_role;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI messages" ON public.ai_chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.ai_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can create own AI messages" ON public.ai_chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.ai_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can update own AI messages" ON public.ai_chat_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.ai_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.ai_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "Users can delete own AI messages" ON public.ai_chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.ai_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE INDEX ai_chat_messages_thread_created_idx ON public.ai_chat_messages (thread_id, created_at ASC);

CREATE TRIGGER update_ai_chat_threads_updated_at BEFORE UPDATE ON public.ai_chat_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();