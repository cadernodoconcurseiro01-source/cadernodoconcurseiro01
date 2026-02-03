import { useState, useEffect, useCallback } from 'react';
import { Subject, StudySession, Flashcard, StudyStats } from '@/types/study';

const STORAGE_KEYS = {
  subjects: 'study-app-subjects',
  sessions: 'study-app-sessions',
  flashcards: 'study-app-flashcards',
};

const defaultSubjects: Subject[] = [
  { id: '1', name: 'Matemática', color: 'hsl(199, 89%, 48%)', totalMinutes: 120, goalMinutes: 60 },
  { id: '2', name: 'Português', color: 'hsl(150, 40%, 55%)', totalMinutes: 90, goalMinutes: 45 },
  { id: '3', name: 'História', color: 'hsl(38, 92%, 50%)', totalMinutes: 60, goalMinutes: 30 },
];

export function useStudyStore() {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.subjects);
    return stored ? JSON.parse(stored) : defaultSubjects;
  });

  const [sessions, setSessions] = useState<StudySession[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.sessions);
    return stored ? JSON.parse(stored) : [];
  });

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.flashcards);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.flashcards, JSON.stringify(flashcards));
  }, [flashcards]);

  const addSubject = useCallback((name: string, color: string, goalMinutes: number) => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name,
      color,
      totalMinutes: 0,
      goalMinutes,
    };
    setSubjects(prev => [...prev, newSubject]);
  }, []);

  const updateSubject = useCallback((id: string, updates: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setFlashcards(prev => prev.filter(f => f.subjectId !== id));
  }, []);

  const addSession = useCallback((session: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = {
      ...session,
      id: Date.now().toString(),
    };
    setSessions(prev => [...prev, newSession]);
    
    // Update subject total minutes
    setSubjects(prev => prev.map(s => 
      s.id === session.subjectId 
        ? { ...s, totalMinutes: s.totalMinutes + session.duration }
        : s
    ));
  }, []);

  const addFlashcard = useCallback((subjectId: string, front: string, back: string) => {
    const newFlashcard: Flashcard = {
      id: Date.now().toString(),
      subjectId,
      front,
      back,
      nextReview: new Date(),
      interval: 1,
      easeFactor: 2.5,
    };
    setFlashcards(prev => [...prev, newFlashcard]);
  }, []);

  const updateFlashcard = useCallback((id: string, quality: number) => {
    setFlashcards(prev => prev.map(card => {
      if (card.id !== id) return card;
      
      // Simple spaced repetition algorithm
      let newInterval = card.interval;
      let newEaseFactor = card.easeFactor;
      
      if (quality >= 3) {
        if (card.interval === 1) {
          newInterval = 1;
        } else if (card.interval === 2) {
          newInterval = 6;
        } else {
          newInterval = Math.round(card.interval * card.easeFactor);
        }
        newEaseFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      } else {
        newInterval = 1;
      }
      
      newEaseFactor = Math.max(1.3, newEaseFactor);
      
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);
      
      return {
        ...card,
        interval: newInterval,
        easeFactor: newEaseFactor,
        nextReview,
      };
    }));
  }, []);

  const deleteFlashcard = useCallback((id: string) => {
    setFlashcards(prev => prev.filter(f => f.id !== id));
  }, []);

  const getStats = useCallback((): StudyStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    
    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= weekStart;
    });
    
    return {
      todayMinutes: todaySessions.reduce((sum, s) => sum + s.duration, 0),
      weekMinutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
      streak: calculateStreak(sessions),
      totalSessions: sessions.length,
    };
  }, [sessions]);

  const getFlashcardsDueToday = useCallback(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return flashcards.filter(f => new Date(f.nextReview) <= today);
  }, [flashcards]);

  return {
    subjects,
    sessions,
    flashcards,
    addSubject,
    updateSubject,
    deleteSubject,
    addSession,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    getStats,
    getFlashcardsDueToday,
  };
}

function calculateStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const hasSession = sessions.some(s => {
      const sessionDate = new Date(s.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === currentDate.getTime();
    });
    
    if (!hasSession && currentDate.getTime() < today.getTime()) break;
    if (hasSession) streak++;
    
    currentDate.setDate(currentDate.getDate() - 1);
    if (streak === 0 && !hasSession) break;
  }
  
  return streak;
}
