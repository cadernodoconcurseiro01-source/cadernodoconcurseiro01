// Database types matching the Supabase schema
export type DifficultyLevel = 'low' | 'medium' | 'high';
export type StudyPlanType = 'cycle' | 'plan';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  daily_study_hours: number;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  difficulty: DifficultyLevel;
  total_minutes: number;
  goal_minutes: number;
  contest_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  type: 'pomodoro' | 'free' | 'flashcard';
  created_at: string;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string;
  deck_id: string | null;
  front: string;
  back: string;
  next_review: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
  updated_at: string;
}

export interface StudyCycle {
  id: string;
  user_id: string;
  subjects_per_day: number;
  daily_hours: number;
  current_day: number;
  cycle_days: number;
  plan_type: StudyPlanType;
  created_at: string;
  updated_at: string;
}

export interface TimerSettings {
  id: string;
  user_id: string;
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_until_long_break: number;
  created_at: string;
  updated_at: string;
}

// Study schedule generated from cycle
export interface StudyScheduleItem {
  subjectId: string;
  subjectName: string;
  color: string;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  period: 'morning' | 'afternoon' | 'evening';
}

export interface Contest {
  id: string;
  user_id: string;
  name: string;
  exam_date: string | null;
  study_plan_type: StudyPlanType;
  cycle_days: number;
  cycle_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectDetail {
  subject_id: string;
  subject_name: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
}

export interface Simulado {
  id: string;
  user_id: string;
  contest_id: string | null;
  name: string;
  exam_date: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  subject_details: SubjectDetail[] | null;
  created_at: string;
  updated_at: string;
}

export interface DailyQuestion {
  id: string;
  user_id: string;
  subject_id: string;
  question_date: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  created_at: string;
  updated_at: string;
}
