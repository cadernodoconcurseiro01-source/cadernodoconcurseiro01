-- Create contests table for storing user exams/contests
CREATE TABLE public.contests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  exam_date DATE,
  study_plan_type TEXT NOT NULL DEFAULT 'cycle' CHECK (study_plan_type IN ('cycle', 'injected')),
  cycle_days INTEGER NOT NULL DEFAULT 7,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contests
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contests
CREATE POLICY "Users can view own contests" ON public.contests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contests" ON public.contests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contests" ON public.contests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contests" ON public.contests FOR DELETE USING (auth.uid() = user_id);

-- Add contest_id to subjects table to link subjects to contests
ALTER TABLE public.subjects ADD COLUMN contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE;

-- Create simulados table for mock exams
CREATE TABLE public.simulados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contest_id UUID REFERENCES public.contests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on simulados
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for simulados
CREATE POLICY "Users can view own simulados" ON public.simulados FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own simulados" ON public.simulados FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own simulados" ON public.simulados FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own simulados" ON public.simulados FOR DELETE USING (auth.uid() = user_id);

-- Create daily_questions table for tracking questions per subject per day
CREATE TABLE public.daily_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  question_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject_id, question_date)
);

-- Enable RLS on daily_questions
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_questions
CREATE POLICY "Users can view own daily_questions" ON public.daily_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily_questions" ON public.daily_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily_questions" ON public.daily_questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own daily_questions" ON public.daily_questions FOR DELETE USING (auth.uid() = user_id);

-- Update study_cycles to support cycle days configuration
ALTER TABLE public.study_cycles ADD COLUMN cycle_days INTEGER NOT NULL DEFAULT 7;
ALTER TABLE public.study_cycles ADD COLUMN plan_type TEXT NOT NULL DEFAULT 'cycle' CHECK (plan_type IN ('cycle', 'injected'));

-- Create triggers for updated_at
CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON public.contests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_simulados_updated_at BEFORE UPDATE ON public.simulados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_questions_updated_at BEFORE UPDATE ON public.daily_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();