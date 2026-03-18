import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'study-schedule-completed';

function getTodayKey() {
  return new Date().toDateString();
}

function loadCompleted(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    if (parsed.date === getTodayKey()) {
      return new Set(parsed.items as string[]);
    }
  } catch { /* ignore */ }
  return new Set<string>();
}

function saveCompleted(items: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: getTodayKey(),
    items: Array.from(items),
  }));
}

export function useStudyCompletion() {
  const [completedItems, setCompletedItems] = useState<Set<string>>(loadCompleted);

  // Listen for changes from other components
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setCompletedItems(loadCompleted());
      }
    };
    window.addEventListener('storage', handler);

    // Custom event for same-tab sync
    const customHandler = () => setCompletedItems(loadCompleted());
    window.addEventListener('study-completion-changed', customHandler);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('study-completion-changed', customHandler);
    };
  }, []);

  const toggleComplete = useCallback((subjectId: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      saveCompleted(next);
      window.dispatchEvent(new Event('study-completion-changed'));
      return next;
    });
  }, []);

  const isCompleted = useCallback((subjectId: string) => {
    return completedItems.has(subjectId);
  }, [completedItems]);

  return { completedItems, toggleComplete, isCompleted };
}
