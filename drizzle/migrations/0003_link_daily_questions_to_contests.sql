ALTER TABLE public.daily_questions
  ADD COLUMN IF NOT EXISTS contest_id uuid REFERENCES public.contests(id) ON DELETE SET NULL;

ALTER TABLE public.daily_questions
  DROP CONSTRAINT IF EXISTS daily_questions_user_id_subject_id_question_date_key;

ALTER TABLE public.daily_questions
  ADD CONSTRAINT daily_questions_user_contest_subject_date_key
  UNIQUE NULLS NOT DISTINCT (user_id, contest_id, subject_id, question_date);

CREATE INDEX IF NOT EXISTS daily_questions_contest_id_idx
  ON public.daily_questions (contest_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_questions TO authenticated;
GRANT ALL ON public.daily_questions TO service_role;