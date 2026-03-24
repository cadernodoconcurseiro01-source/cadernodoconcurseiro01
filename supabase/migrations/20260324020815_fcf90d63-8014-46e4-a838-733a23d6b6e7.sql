
-- Create junction table for many-to-many relationship between contests and subjects
CREATE TABLE public.contest_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(contest_id, subject_id)
);

-- Enable RLS
ALTER TABLE public.contest_subjects ENABLE ROW LEVEL SECURITY;

-- RLS policies (join with contests or subjects to check user_id)
CREATE POLICY "Users can view own contest_subjects"
ON public.contest_subjects FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.contests WHERE contests.id = contest_subjects.contest_id AND contests.user_id = auth.uid())
);

CREATE POLICY "Users can insert own contest_subjects"
ON public.contest_subjects FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.contests WHERE contests.id = contest_subjects.contest_id AND contests.user_id = auth.uid())
);

CREATE POLICY "Users can delete own contest_subjects"
ON public.contest_subjects FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.contests WHERE contests.id = contest_subjects.contest_id AND contests.user_id = auth.uid())
);

-- Migrate existing data from subjects.contest_id to junction table
INSERT INTO public.contest_subjects (contest_id, subject_id)
SELECT contest_id, id FROM public.subjects WHERE contest_id IS NOT NULL
ON CONFLICT DO NOTHING;
