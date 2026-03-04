import { HelpCircle, Calendar, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubjects } from '@/hooks/useSubjects';
import { useDailyQuestions } from '@/hooks/useDailyQuestions';
import { AddDailyQuestionsDialog } from '@/components/AddDailyQuestionsDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QuestionsPage = () => {
  const { subjects, isLoading: subjectsLoading } = useSubjects();
  const { dailyQuestions, isLoading: questionsLoading, addOrUpdateDailyQuestionsAsync, getTotalStats } = useDailyQuestions();
  
  const totalStats = getTotalStats();
  const isLoading = subjectsLoading || questionsLoading;

  // Group questions by date
  const groupedByDate = dailyQuestions.reduce((acc, q) => {
    const date = q.question_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(q);
    return acc;
  }, {} as Record<string, typeof dailyQuestions>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-primary" />
              Questões Diárias
            </h1>
            <p className="text-muted-foreground">
              Registre as questões resolvidas por matéria para acompanhar seu desempenho.
            </p>
          </div>
          <AddDailyQuestionsDialog subjects={subjects} onAdd={addOrUpdateDailyQuestionsAsync} />
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{totalStats.total}</p>
          <p className="text-sm text-muted-foreground">Total de Questões</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{totalStats.correct}</p>
          <p className="text-sm text-muted-foreground">Acertos</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{totalStats.wrong}</p>
          <p className="text-sm text-muted-foreground">Erros</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-warning">{totalStats.percentage}%</p>
          <p className="text-sm text-muted-foreground">Aproveitamento</p>
        </Card>
      </div>

      {/* Questions by Date */}
      {sortedDates.length === 0 ? (
        <Card className="p-12 text-center shadow-card">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">
            Nenhuma questão registrada
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Comece a registrar suas questões diárias para acompanhar seu progresso.
          </p>
          <AddDailyQuestionsDialog subjects={subjects} onAdd={addOrUpdateDailyQuestionsAsync} />
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const questions = groupedByDate[date];
            const dateTotal = questions.reduce((sum, q) => sum + q.total_questions, 0);
            const dateCorrect = questions.reduce((sum, q) => sum + q.correct_answers, 0);
            const dateWrong = questions.reduce((sum, q) => sum + q.wrong_answers, 0);
            const datePercentage = dateTotal > 0 ? Math.round((dateCorrect / dateTotal) * 100) : 0;
            
            return (
              <Card key={date} className="p-6 shadow-card animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-semibold">
                      {format(new Date(date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dateTotal} questões • {datePercentage}% aproveitamento
                  </div>
                </div>
                
                <div className="space-y-3">
                  {questions.map((q) => {
                    const subject = subjects.find(s => s.id === q.subject_id);
                    const percentage = q.total_questions > 0 
                      ? Math.round((q.correct_answers / q.total_questions) * 100) 
                      : 0;
                    
                    return (
                      <div 
                        key={q.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject?.color || '#888' }}
                          />
                          <span className="font-medium">{subject?.name || 'Matéria'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {q.total_questions} questões
                          </span>
                          <span className="text-accent">
                            {q.correct_answers} ✓
                          </span>
                          <span className="text-destructive">
                            {q.wrong_answers} ✗
                          </span>
                          <span className="font-medium text-warning">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionsPage;