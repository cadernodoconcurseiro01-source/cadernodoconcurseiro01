 import { BarChart3 } from 'lucide-react';
 import { useSubjects } from '@/hooks/useSubjects';
 import { useSessions } from '@/hooks/useSessions';
 import { useSimulados } from '@/hooks/useSimulados';
 import { useDailyQuestions } from '@/hooks/useDailyQuestions';
 import { StudyCharts } from '@/components/StudyCharts';
 import { AddDailyQuestionsDialog } from '@/components/AddDailyQuestionsDialog';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Card } from '@/components/ui/card';
 import { StatsCard } from '@/components/StatsCard';
 import { Clock, HelpCircle, Target, TrendingUp } from 'lucide-react';
 import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
 
 const StatisticsPage = () => {
   const { subjects, isLoading: subjectsLoading } = useSubjects();
   const { sessions, getStats } = useSessions();
   const { simulados } = useSimulados();
   const { 
     dailyQuestions, 
     isLoading: questionsLoading, 
     addOrUpdateDailyQuestions,
     getWeeklyStats,
     getBySubject,
     getTotalStats
   } = useDailyQuestions();
 
   const studyStats = getStats();
   const questionStats = getTotalStats();
 
   // Prepare weekly study data
   const today = new Date();
   const weekStart = startOfWeek(today, { weekStartsOn: 1 });
   const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
   const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
 
   const weeklyStudyData = days.map(day => {
     const dateStr = format(day, 'yyyy-MM-dd');
     const dayMinutes = sessions
       .filter(s => format(new Date(s.start_time), 'yyyy-MM-dd') === dateStr)
       .reduce((sum, s) => sum + s.duration, 0);
     
     return {
       date: format(day, 'EEE'),
       minutes: dayMinutes,
     };
   });
 
   // Prepare subject study data
   const subjectStudyData = subjects.map(subject => {
     const subjectMinutes = sessions
       .filter(s => s.subject_id === subject.id)
       .reduce((sum, s) => sum + s.duration, 0);
     
     return {
       name: subject.name,
       minutes: subjectMinutes,
       color: subject.color,
     };
   });
 
   // Prepare weekly questions data
   const weeklyQuestionsData = getWeeklyStats(subjects);
 
   // Prepare subject questions data
   const subjectQuestionsData = getBySubject(subjects);
 
   // Prepare simulados data
   const simuladosData = simulados.map(s => ({
     name: s.name.length > 15 ? s.name.substring(0, 15) + '...' : s.name,
     percentage: s.total_questions > 0 ? Math.round((s.correct_answers / s.total_questions) * 100) : 0,
     total: s.total_questions,
     correct: s.correct_answers,
   }));
 
   const formatTime = (minutes: number) => {
     const hours = Math.floor(minutes / 60);
     const mins = minutes % 60;
     if (hours > 0) {
       return `${hours}h ${mins}m`;
     }
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
         <div className="flex items-center justify-between">
           <div>
             <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
               <BarChart3 className="w-8 h-8 text-primary" />
               Estatísticas
             </h1>
             <p className="text-muted-foreground">
               Acompanhe seu progresso com gráficos detalhados.
             </p>
           </div>
           <AddDailyQuestionsDialog onAdd={addOrUpdateDailyQuestions} subjects={subjects} />
         </div>
       </header>
 
       {/* Stats Summary */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
         <StatsCard
           title="Esta Semana"
           value={formatTime(studyStats.weekMinutes)}
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
           value={simulados.length}
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
       />
     </div>
   );
 };
 
 export default StatisticsPage;