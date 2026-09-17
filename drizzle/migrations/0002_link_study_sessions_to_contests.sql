ALTER TABLE public.study_sessions
ADD COLUMN contest_id uuid REFERENCES public.contests(id) ON DELETE SET NULL;

CREATE INDEX study_sessions_contest_id_idx
ON public.study_sessions (contest_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;