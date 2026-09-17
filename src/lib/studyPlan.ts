import { Subject, DifficultyLevel, Contest } from '@/types/database';

export interface PlanSlot {
  cycle: number;
  day: number;
  slot: number;
  subject: Subject;
  isOverride: boolean;
}

export interface PlanDay {
  day: number;
  slots: PlanSlot[];
}

export interface PlanCycle {
  cycle: number;
  days: PlanDay[];
}

export const slotKey = (cycle: number, day: number, slot: number) => `${cycle}-${day}-${slot}`;

/**
 * Orders subjects so that two "high" difficulty subjects never sit side by side.
 */
export function orderSubjectsByDifficulty(subjects: Subject[]): Subject[] {
  const order: Record<DifficultyLevel, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...subjects].sort((a, b) => {
    const diff = order[a.difficulty] - order[b.difficulty];
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  const high = sorted.filter(s => s.difficulty === 'high');
  const others = sorted.filter(s => s.difficulty !== 'high');
  const result: Subject[] = [];

  while (high.length > 0 || others.length > 0) {
    if (high.length > 0) {
      const nextHigh = high.shift();
      if (nextHigh) result.push(nextHigh);
      const nextOther = others.shift();
      if (nextOther) result.push(nextOther);
    } else {
      const nextOther = others.shift();
      if (nextOther) result.push(nextOther);
    }
  }

  return result;
}

interface GenerateParams {
  subjects: Subject[];
  cycleDays: number;
  subjectsPerDay: number;
  totalCycles: number;
  /** map of `${cycle}-${day}-${slot}` -> subject_id */
  overrides?: Map<string, string>;
}

export function generateCyclesPlan({
  subjects,
  cycleDays,
  subjectsPerDay,
  totalCycles,
  overrides,
}: GenerateParams): PlanCycle[] {
  if (subjects.length === 0) return [];

  const ordered = orderSubjectsByDifficulty(subjects);
  const days = Math.max(1, cycleDays || 1);
  const perDay = Math.max(1, Math.min(subjectsPerDay || 1, subjects.length));
  const cycles = Math.max(1, totalCycles || 1);
  const byId = new Map(subjects.map(s => [s.id, s]));

  const plan: PlanCycle[] = [];

  for (let cycle = 1; cycle <= cycles; cycle++) {
    const cycleDaysList: PlanDay[] = [];
    for (let day = 1; day <= days; day++) {
      const slots: PlanSlot[] = [];
      for (let slot = 0; slot < perDay; slot++) {
        const globalIndex = ((cycle - 1) * days + (day - 1)) * perDay + slot;
        const fallback = ordered[globalIndex % ordered.length];
        const overrideId = overrides?.get(slotKey(cycle, day, slot));
        const overridden = overrideId ? byId.get(overrideId) : undefined;
        const subject = overridden || fallback;
        if (!subject) continue;
        slots.push({ cycle, day, slot, subject, isOverride: Boolean(overridden) });
      }
      cycleDaysList.push({ day, slots });
    }
    plan.push({ cycle, days: cycleDaysList });
  }

  return plan;
}

export function getPlanDay(plan: PlanCycle[], cycle: number, day: number): PlanDay | null {
  const target = plan.find(c => c.cycle === cycle) || plan[0];
  if (!target) return null;
  return target.days.find(d => d.day === day) || target.days[0] || null;
}

export function getContestCycleSettings(contest: Contest) {
  const cycleDays = Math.max(1, contest.cycle_days || 7);
  const totalCycles = Math.max(1, contest.total_cycles || 1);
  const currentCycle = Math.min(Math.max(1, contest.cycle_number || 1), totalCycles);
  const currentDay = Math.min(Math.max(1, contest.current_day || 1), cycleDays);
  return {
    cycleDays,
    totalCycles,
    currentCycle,
    currentDay,
    subjectsPerDay: Math.max(1, contest.subjects_per_day || 1),
  };
}
