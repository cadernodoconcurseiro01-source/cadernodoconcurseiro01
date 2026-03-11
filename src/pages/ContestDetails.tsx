import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Plus, BookOpen, CheckCircle, RefreshCw, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useContests } from '@/hooks/useContests';
import { useSubjects } from '@/hooks/useSubjects';
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
  const { subjects, addSubjectWithContest, updateSubject, deleteSubject, linkSubjectsToContestAsync } = useSubjects();
  
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);

  const contest = contests.find(c => c.id === id);
  const contestSubjects = subjects.filter(s => s.contest_id === id);
  const availableSubjects = subjects.filter(s => s.contest_id !== id);

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

  const formatExamDate = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const getDaysUntilExam = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return null;
      return differenceInDays(date, new Date());
    } catch {
      return null;
    }
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
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/contests')}
          className="mb-4"
        >
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
                {contest.study_plan_type === 'cycle' ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Layers className="w-4 h-4" />
                )}
                <span>
                  {contest.cycle_number || 1}º {contest.study_plan_type === 'cycle' ? 'Ciclo' : 'Plano'} • {contest.cycle_days || 7} dias
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Subjects Section */}
      <section className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Matérias do Concurso ({contestSubjects.length})
          </h2>
          <AddSubjectDialogNew 
            onAdd={handleAddSubject}
            open={addSubjectOpen}
            onOpenChange={setAddSubjectOpen}
          />
        </div>

        {contestSubjects.length === 0 ? (
          <Card className="p-8 text-center shadow-card">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold mb-1">Nenhuma matéria vinculada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione matérias para criar sua sequência de estudos.
            </p>
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
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{subject.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Meta: {subject.goal_minutes} min/dia • Dificuldade: {
                        subject.difficulty === 'high' ? 'Alta' : 
                        subject.difficulty === 'medium' ? 'Média' : 'Baixa'
                      }
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

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
          />
        </section>
      )}
    </div>
  );
};

export default ContestDetailsPage;
