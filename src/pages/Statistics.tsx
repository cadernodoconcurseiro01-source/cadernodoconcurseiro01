import { BarChart3 } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useSessions } from '@/hooks/useSessions';
import { useSimulados } from '@/hooks/useSimulados';
import { useDailyQuestions } from '@/hooks/useDailyQuestions';
import { useContests } from '@/hooks/useContests';
import { useContestSubjects } from '@/hooks/useContestSubjects';
import { StudyCharts } from '@/components/StudyCharts';
import { AddDailyQuestionsDialog } from '@/components/AddDailyQuestionsDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/StatsCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, HelpCircle, Target, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useMemo } from 'react';

const ALL_CONTESTS_VALUE = 'all';

const StatisticsPage = () => {
  const { subjects, isLoading: subjectsLoading } = useSubjects();
  const { sessions, getStats } = useSessions();
  const { simulados } = useSimulados();
  const { contests } = useContests();
  const { mappings, getSubjectsForContest } = useContestSubjects();
  const { 
    dailyQuestions, 
    isLoading: questionsLoading, 
    addOrUpdateDailyQuestionsAsync,
    getWeeklyStats,
    getBySubject,
    getTotalStats
  } = useDailyQuestions();

  const [selectedContestId, setSelectedContestId] = useState(ALL_CONTESTS_VALUE);

  // Filter subjects by contest (supports both direct contest_id and M2M contest_subjects)
  const filteredSubjects = useMemo(() => {
    if (selectedContestId === ALL_CONTESTS_VALUE) return subjects;
    const m2mSubjects = getSubjectsForContest(selectedContestId, subjects);
    const directSubjects = subjects.filter(s => s.contest_id === selectedContestId);
    const merged = new Map<string, typeof subjects[number]>();
    [...m2mSubjects, ...directSubjects].forEach(s => merged.set(s.id, s));
    return Array.from(merged.values());
  }, [subjects, selectedContestId, getSubjectsForContest]);

  // Pomodoro sessions carry their contest explicitly so shared subjects are never counted twice.
  const filteredSessions = useMemo(() => {
    if (selectedContestId === ALL_CONTESTS_VALUE) return sessions;
    return sessions.filter(s => s.contest_id === selectedContestId);
  }, [sessions, selectedContestId]);

  // Filter simulados by contest
  const filteredSimulados = useMemo(() => {
    if (selectedContestId === ALL_CONTESTS_VALUE) return simulados;
    return simulados.filter(s => s.contest_id === selectedContestId);
  }, [simulados, selectedContestId]);

  // Daily questions carry their contest explicitly, preventing shared subjects from leaking across contests.
  const filteredDailyQuestions = useMemo(() => {
    if (selectedContestId === ALL_CONTESTS_VALUE) return dailyQuestions;
    return dailyQuestions.filter(q => q.contest_id === selectedContestId);
  }, [dailyQuestions, selectedContestId]);

  // Compute stats based on filtered data
  const weekMinutes = useMemo(() => {
    const wStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const wEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    return filteredSessions
      .filter(s => {
        const d = new Date(s.start_time);
        return d >= wStart && d <= wEnd;
      })
      .reduce((sum, s) => sum + s.duration, 0);
  }, [filteredSessions]);

  const questionStats = useMemo(() => {
    const total = filteredDailyQuestions.reduce((sum, q) => sum + q.total_questions, 0);
    const correct = filteredDailyQuestions.reduce((sum, q) => sum + q.correct_answers, 0);
    return { total, correct, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }, [filteredDailyQuestions]);

  // Prepare weekly study data
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyStudyData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayMinutes = filteredSessions
      .filter(s => format(new Date(s.start_time), 'yyyy-MM-dd') === dateStr)
      .reduce((sum, s) => sum + s.duration, 0);
    return { date: format(day, 'EEE', { locale: ptBR }), minutes: dayMinutes };
  });

  const subjectStudyData = filteredSubjects.map(subject => {
    const subjectMinutes = filteredSessions
      .filter(s => s.subject_id === subject.id)
      .reduce((sum, s) => sum + s.duration, 0);
    return { name: subject.name, minutes: subjectMinutes, color: subject.color };
  });

  // Weekly questions from filtered data
  const weeklyQuestionsData = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayQuestions = filteredDailyQuestions.filter(q => q.question_date === dateStr);
    const total = dayQuestions.reduce((sum, q) => sum + q.total_questions, 0);
    const correct = dayQuestions.reduce((sum, q) => sum + q.correct_answers, 0);
    return {
      date: format(day, 'EEE', { locale: ptBR }),
      total,
      correct,
      wrong: total - correct,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  // Subject questions from filtered data
  const subjectQuestionsData = filteredSubjects.map(subject => {
    const subjectQuestions = filteredDailyQuestions.filter(q => q.subject_id === subject.id);
    const total = subjectQuestions.reduce((sum, q) => sum + q.total_questions, 0);
    const correct = subjectQuestions.reduce((sum, q) => sum + q.correct_answers, 0);
    return {
      name: subject.name,
      color: subject.color,
      total,
      correct,
      wrong: total - correct,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  }).filter(s => s.total > 0);

  const simuladosData = filteredSimulados.map(s => ({
    name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
    percentage: s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0,
    total: s.total_questions,
    correct: s.correct_answers,
  }));

  const simuladoSubjectData = useMemo(() => {
    const totals = new Map<string, { name: string; total: number; correct: number; wrong: number; color: string }>();
    filteredSimulados.forEach(simulado => {
      (simulado.subject_details || []).forEach(detail => {
        const subject = subjects.find(item => item.id === detail.subject_id);
        const current = totals.get(detail.subject_id) || {
          name: detail.subject_name,
          total: 0,
          correct: 0,
          wrong: 0,
          color: subject?.color || 'hsl(var(--primary))',
        };
        current.total += detail.total_questions;
        current.correct += detail.correct_answers;
        current.wrong += detail.wrong_answers;
        totals.set(detail.subject_id, current);
      });
    });
    return Array.from(totals.values()).map(item => ({
      ...item,
      percentage: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
    }));
  }, [filteredSimulados, subjects]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}min`;
  };

  if (subjectsLoading || questionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Estatísticas
            </h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso com gráficos detalhados.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedContestId} onValueChange={setSelectedContestId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por concurso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CONTESTS_VALUE}>Geral (todos)</SelectItem>
                {contests.map(contest => (
                  <SelectItem key={contest.id} value={contest.id}>{contest.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AddDailyQuestionsDialog
              onAdd={addOrUpdateDailyQuestionsAsync}
              subjects={subjects}
              contests={contests}
              contestSubjectMappings={mappings}
            />
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Esta Semana"
          value={formatTime(weekMinutes)}
          subtitle="tempo estudado"
          icon={Clock}
          variant="primary"
        />
        <StatsCard
          title="Questões"
          value={questionStats.total}
          subtitle="resolvidas"
          icon={HelpCircle}
        />
        <StatsCard
          title="Acertos"
          value={`${questionStats.percentage}%`}
          subtitle="média geral"
          icon={Target}
          variant="accent"
        />
        <StatsCard
          title="Simulados"
          value={filteredSimulados.length}
          subtitle="realizados"
          icon={TrendingUp}
          variant="warning"
        />
      </div>

      {/* Charts */}
      <StudyCharts
        weeklyStudyData={weeklyStudyData}
        subjectStudyData={subjectStudyData}
        weeklyQuestionsData={weeklyQuestionsData}
        subjectQuestionsData={subjectQuestionsData}
        simuladosData={simuladosData}
        simuladoSubjectData={simuladoSubjectData}
      />
    </div>
  );
};

export default StatisticsPage;
