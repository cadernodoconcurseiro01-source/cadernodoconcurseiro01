ALTER TABLE public.contests DROP CONSTRAINT IF EXISTS contests_study_plan_type_check;
ALTER TABLE public.contests ADD CONSTRAINT contests_study_plan_type_check CHECK (study_plan_type = ANY (ARRAY['cycle'::text, 'plan'::text, 'injected'::text]));

ALTER TABLE public.study_cycles DROP CONSTRAINT IF EXISTS study_cycles_plan_type_check;
ALTER TABLE public.study_cycles ADD CONSTRAINT study_cycles_plan_type_check CHECK (plan_type = ANY (ARRAY['cycle'::text, 'plan'::text, 'injected'::text]));

ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS total_cycles integer NOT NULL DEFAULT 1;
ALTER TABLE public.contests ADD COLUMN IF NOT EXISTS current_day integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.contest_cycle_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  cycle_index integer NOT NULL,
  day_number integer NOT NULL,
  slot_index integer NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, cycle_index, day_number, slot_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contest_cycle_slots TO authenticated;
GRANT ALL ON public.contest_cycle_slots TO service_role;

ALTER TABLE public.contest_cycle_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contest_cycle_slots" ON public.contest_cycle_slots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contest_cycle_slots" ON public.contest_cycle_slots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contest_cycle_slots" ON public.contest_cycle_slots
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contest_cycle_slots" ON public.contest_cycle_slots
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_contest_cycle_slots_updated_at
  BEFORE UPDATE ON public.contest_cycle_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();