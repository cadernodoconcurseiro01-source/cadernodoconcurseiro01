CREATE TABLE public.study_revisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  revision_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, revision_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_revisions TO authenticated;
GRANT ALL ON public.study_revisions TO service_role;

ALTER TABLE public.study_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study_revisions"
ON public.study_revisions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study_revisions"
ON public.study_revisions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study_revisions"
ON public.study_revisions FOR DELETE TO authenticated
USING (auth.uid() = user_id);