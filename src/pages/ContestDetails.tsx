import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Plus, BookOpen, CheckCircle, RefreshCw, Layers, HelpCircle, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContests } from '@/hooks/useContests';
import { useSubjects } from '@/hooks/useSubjects';
import { useContestSubjects } from '@/hooks/useContestSubjects';
import { useSimulados } from '@/hooks/useSimulados';
import { useDailyQuestions } from '@/hooks/useDailyQuestions';
import { AddSubjectDialogNew } from '@/components/AddSubjectDialogNew';
import { LinkExistingSubjectDialog } from '@/components/LinkExistingSubjectDialog';
import { StudySequenceTable } from '@/components/StudySequenceTable';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DifficultyLevel } from '@/types/database';

const ContestDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contests, isLoading: contestsLoading } = useContests();
  const { subjects, addSubjectWithContest } = useSubjects();
  const { getSubjectsForContest, getAvailableSubjectsForContest, linkSubjectsAsync } = useContestSubjects();
  const { simulados } = useSimulados();
  const { dailyQuestions } = useDailyQuestions();
  
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);

  const contest = contests.find(c => c.id === id);
  const contestSubjects = id ? getSubjectsForContest(id, subjects) : [];
  const availableSubjects = id ? getAvailableSubjectsForContest(id, subjects) : [];

  // Get simulados linked to this contest
  const contestSimulados = simulados.filter(s => s.contest_id === id);

  // Get questions for subjects linked to this contest
  const contestSubjectIds = contestSubjects.map(s => s.id);
  const contestQuestions = dailyQuestions.filter(q => contestSubjectIds.includes(q.subject_id));

  // Stats
  const questionsTotal = contestQuestions.reduce((sum, q) => sum + q.total_questions, 0);
  const questionsCorrect = contestQuestions.reduce((sum, q) => sum + q.correct_answers, 0);
  const questionsPercentage = questionsTotal > 0 ? Math.round((questionsCorrect / questionsTotal) * 100) : 0;

  const simuladosTotal = contestSimulados.reduce((sum, s) => sum + s.total_questions, 0);
  const simuladosCorrect = contestSimulados.reduce((sum, s) => sum + s.correct_answers, 0);
  const simuladosPercentage = simuladosTotal > 0 ? Math.round((simuladosCorrect / simuladosTotal) * 100) : 0;

  const handleAddSubject = (params: { name: string; color: string; goalMinutes: number; difficulty: DifficultyLevel }) => {
    if (!id) return;
    addSubjectWithContest({
      name: params.name,
      color: params.color,
      goalMinutes: params.goalMinutes,
      difficulty: params.difficulty,
      contestId: id,
    });
    setAddSubjectOpen(false);
  };

  const handleLinkExisting = async (subjectIds: string[]) => {
    if (!id) return;
    await linkSubjectsAsync({ subjectIds, contestId: id });
  };

  const formatExamDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch { return null; }
  };

  const getDaysUntilExam = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return differenceInDays(date, new Date());
    } catch { return null; }
  };

  if (contestsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">Concurso não encontrado</h2>
          <p className="text-muted-foreground mb-4">O concurso que você está procurando não existe.</p>
          <Button onClick={() => navigate('/contests')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Concursos
          </Button>
        </Card>
      </div>
    );
  }

  const formattedDate = formatExamDate(contest.exam_date);
  const daysUntilExam = getDaysUntilExam(contest.exam_date);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <header className="mb-8 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate('/contests')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-primary" />
              <h1 className="font-display text-3xl font-bold">{contest.name}</h1>
              <Badge variant={contest.is_active ? "default" : "secondary"}>
                {contest.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {formattedDate && (
                <div className="flex items-center gap-1">
                  📅 {formattedDate}
                  {daysUntilExam !== null && daysUntilExam >= 0 && (
                    <Badge variant="outline" className="ml-1">
                      {daysUntilExam === 0 ? 'Hoje!' : `Faltam ${daysUntilExam} dias`}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1">
                {contest.study_plan_type === 'cycle' ? <RefreshCw className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                <span>{contest.cycle_number || 1}º {contest.study_plan_type === 'cycle' ? 'Ciclo' : 'Plano'} • {contest.cycle_days || 7} dias</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{contestSubjects.length}</p>
          <p className="text-xs text-muted-foreground">Matérias</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{questionsTotal}</p>
          <p className="text-xs text-muted-foreground">Questões ({questionsPercentage}%)</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{contestSimulados.length}</p>
          <p className="text-xs text-muted-foreground">Simulados</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{simuladosPercentage}%</p>
          <p className="text-xs text-muted-foreground">Média Simulados</p>
        </Card>
      </div>

      {/* Subjects Section */}
      <section className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Matérias ({contestSubjects.length})
          </h2>
          <div className="flex items-center gap-2">
            <LinkExistingSubjectDialog availableSubjects={availableSubjects} onLink={handleLinkExisting} />
            <AddSubjectDialogNew onAdd={handleAddSubject} open={addSubjectOpen} onOpenChange={setAddSubjectOpen} />
          </div>
        </div>

        {contestSubjects.length === 0 ? (
          <Card className="p-8 text-center shadow-card">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold mb-1">Nenhuma matéria vinculada</h3>
            <p className="text-sm text-muted-foreground mb-4">Adicione matérias para criar sua sequência de estudos.</p>
            <Button onClick={() => setAddSubjectOpen(true)} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Matéria
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {contestSubjects.map(subject => (
              <Card key={subject.id} className="p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{subject.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Meta: {subject.goal_minutes} min/dia • Dificuldade: {
                        subject.difficulty === 'high' ? 'Alta' : subject.difficulty === 'medium' ? 'Média' : 'Baixa'
                      }
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Questões do Concurso */}
      {contestQuestions.length > 0 && (
        <section className="mb-8 animate-fade-in">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-primary" />
            Questões ({questionsTotal} total • {questionsPercentage}% aproveitamento)
          </h2>
          <div className="space-y-2">
            {contestSubjects.map(subject => {
              const subjectQuestions = contestQuestions.filter(q => q.subject_id === subject.id);
              if (subjectQuestions.length === 0) return null;
              const total = subjectQuestions.reduce((sum, q) => sum + q.total_questions, 0);
              const correct = subjectQuestions.reduce((sum, q) => sum + q.correct_answers, 0);
              const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

              return (
                <div key={subject.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{total} questões</span>
                    <span className="text-accent">{correct} ✓</span>
                    <span className="text-destructive">{total - correct} ✗</span>
                    <span className="font-medium text-warning">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Simulados do Concurso */}
      {contestSimulados.length > 0 && (
        <section className="mb-8 animate-fade-in">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            Simulados ({contestSimulados.length})
          </h2>
          <div className="space-y-2">
            {contestSimulados.map(sim => {
              const pct = sim.total_questions > 0 ? Math.round((sim.correct_answers / sim.total_questions) * 100) : 0;
              return (
                <div key={sim.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <span className="font-medium">{sim.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {format(parseISO(sim.exam_date), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{sim.total_questions} questões</span>
                    <span className="text-accent">{sim.correct_answers} ✓</span>
                    <span className="text-destructive">{sim.wrong_answers} ✗</span>
                    <span className={`font-bold ${pct >= 70 ? 'text-accent' : pct >= 50 ? 'text-warning' : 'text-destructive'}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Study Sequence Section */}
      {contestSubjects.length > 0 && (
        <section className="animate-fade-in">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-primary" />
            Sequência de Estudos
          </h2>
          <StudySequenceTable 
            subjects={contestSubjects} 
            cycleDays={contest.cycle_days || 7}
            planType={contest.study_plan_type}
            subjectsPerDay={contest.subjects_per_day || 1}
            currentDay={contest.cycle_number || 1}
          />
        </section>
      )}
    </div>
  );
};

export default ContestDetailsPage;
