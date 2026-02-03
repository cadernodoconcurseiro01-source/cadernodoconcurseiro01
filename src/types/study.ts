export interface Subject {
  id: string;
  name: string;
  color: string;
  totalMinutes: number;
  goalMinutes: number;
}

export interface StudySession {
  id: string;
  subjectId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  type: 'pomodoro' | 'free';
}

export interface DailyGoal {
  id: string;
  date: string;
  targetMinutes: number;
  completedMinutes: number;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  front: string;
  back: string;
  nextReview: Date;
  interval: number; // days until next review
  easeFactor: number;
}

export interface StudyStats {
  todayMinutes: number;
  weekMinutes: number;
  streak: number;
  totalSessions: number;
}
