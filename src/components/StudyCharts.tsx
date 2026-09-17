 import { Card } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
 import { BarChart3, PieChart as PieIcon, TrendingUp, Clock, HelpCircle, Target } from 'lucide-react';
 import { Subject } from '@/types/database';
 
 interface StudyChartsProps {
   weeklyStudyData: { date: string; minutes: number }[];
   subjectStudyData: { name: string; minutes: number; color: string }[];
   weeklyQuestionsData: { date: string; total: number; correct: number; wrong: number; percentage: number }[];
   subjectQuestionsData: { name: string; total: number; correct: number; wrong: number; percentage: number; color: string }[];
   simuladosData: { name: string; percentage: number; total: number; correct: number }[];
   simuladoSubjectData: { name: string; total: number; correct: number; wrong: number; percentage: number; color: string }[];
 }
 
 const CustomTooltip = ({ active, payload, label }: any) => {
   if (active && payload && payload.length) {
     return (
       <div className="bg-card border border-border rounded-lg p-3 shadow-elevated">
         <p className="font-medium text-sm">{label}</p>
         {payload.map((entry: any, index: number) => (
           <p key={index} className="text-sm" style={{ color: entry.color }}>
             {entry.name}: {entry.value}{entry.name.includes('minutos') || entry.name === 'Minutos' ? 'min' : ''}
           </p>
         ))}
       </div>
     );
   }
   return null;
 };
 
 export function StudyCharts({ 
   weeklyStudyData, 
   subjectStudyData, 
   weeklyQuestionsData,
   subjectQuestionsData,
    simuladosData,
    simuladoSubjectData,
 }: StudyChartsProps) {
   const formatMinutes = (minutes: number) => {
     const hours = Math.floor(minutes / 60);
     const mins = minutes % 60;
     if (hours > 0) return `${hours}h ${mins}m`;
     return `${mins}m`;
   };
 
   const totalStudyMinutes = weeklyStudyData.reduce((sum, d) => sum + d.minutes, 0);
   const totalQuestions = weeklyQuestionsData.reduce((sum, d) => sum + d.total, 0);
   const totalCorrect = weeklyQuestionsData.reduce((sum, d) => sum + d.correct, 0);
   const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
 
   return (
     <Card className="p-6 shadow-card">
       <Tabs defaultValue="study" className="space-y-4">
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="study" className="gap-2">
             <Clock className="w-4 h-4" />
             Horas
           </TabsTrigger>
           <TabsTrigger value="questions" className="gap-2">
             <HelpCircle className="w-4 h-4" />
             Questões
           </TabsTrigger>
           <TabsTrigger value="simulados" className="gap-2">
             <Target className="w-4 h-4" />
             Simulados
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="study" className="space-y-6">
           {/* Weekly Study Chart */}
           <div>
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-display font-semibold flex items-center gap-2">
                 <BarChart3 className="w-4 h-4 text-primary" />
                 Horas Estudadas na Semana
               </h3>
               <span className="text-sm text-muted-foreground">
                 Total: {formatMinutes(totalStudyMinutes)}
               </span>
             </div>
             {weeklyStudyData.length > 0 && weeklyStudyData.some(d => d.minutes > 0) ? (
               <ResponsiveContainer width="100%" height={200}>
                 <BarChart data={weeklyStudyData}>
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                   <Tooltip content={<CustomTooltip />} />
                   <Bar dataKey="minutes" name="Minutos" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                 Nenhum dado de estudo ainda
               </div>
             )}
           </div>
 
           {/* Subject Distribution */}
           <div>
             <h3 className="font-display font-semibold flex items-center gap-2 mb-4">
               <PieIcon className="w-4 h-4 text-accent" />
               Tempo por Disciplina
             </h3>
             {subjectStudyData.length > 0 && subjectStudyData.some(d => d.minutes > 0) ? (
               <div className="flex items-center gap-6">
                 <ResponsiveContainer width="50%" height={200}>
                   <PieChart>
                     <Pie
                       data={subjectStudyData.filter(d => d.minutes > 0)}
                       dataKey="minutes"
                       nameKey="name"
                       cx="50%"
                       cy="50%"
                       innerRadius={50}
                       outerRadius={80}
                       paddingAngle={2}
                     >
                       {subjectStudyData.filter(d => d.minutes > 0).map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="flex-1 space-y-2">
                   {subjectStudyData.filter(d => d.minutes > 0).map((subject, index) => (
                     <div key={index} className="flex items-center gap-2">
                       <div 
                         className="w-3 h-3 rounded-full" 
                         style={{ backgroundColor: subject.color }}
                       />
                       <span className="text-sm flex-1 truncate">{subject.name}</span>
                       <span className="text-sm text-muted-foreground">{formatMinutes(subject.minutes)}</span>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
               <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                 Nenhum dado de estudo ainda
               </div>
             )}
           </div>
         </TabsContent>
 
         <TabsContent value="questions" className="space-y-6">
           {/* Weekly Questions Chart */}
           <div>
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-display font-semibold flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-primary" />
                 Questões na Semana
               </h3>
               <span className="text-sm text-muted-foreground">
                 {totalQuestions} questões • {overallPercentage}% acerto
               </span>
             </div>
             {weeklyQuestionsData.length > 0 && weeklyQuestionsData.some(d => d.total > 0) ? (
               <ResponsiveContainer width="100%" height={200}>
                 <AreaChart data={weeklyQuestionsData}>
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                   <Tooltip content={<CustomTooltip />} />
                   <Area type="monotone" dataKey="correct" name="Acertos" stackId="1" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.6} />
                   <Area type="monotone" dataKey="wrong" name="Erros" stackId="1" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.6} />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                 Nenhuma questão registrada ainda
               </div>
             )}
           </div>
 
           {/* Questions by Subject */}
           <div>
             <h3 className="font-display font-semibold flex items-center gap-2 mb-4">
               <BarChart3 className="w-4 h-4 text-accent" />
               Desempenho por Disciplina
             </h3>
             {subjectQuestionsData.length > 0 ? (
               <div className="space-y-3">
                 {subjectQuestionsData.map((subject, index) => (
                   <div key={index} className="space-y-1">
                     <div className="flex items-center justify-between text-sm">
                       <div className="flex items-center gap-2">
                         <div 
                           className="w-3 h-3 rounded-full" 
                           style={{ backgroundColor: subject.color }}
                         />
                         <span className="truncate">{subject.name}</span>
                       </div>
                       <span className="text-muted-foreground">
                         {subject.correct}/{subject.total} ({subject.percentage}%)
                       </span>
                     </div>
                     <div className="h-2 bg-muted rounded-full overflow-hidden">
                       <div 
                         className="h-full rounded-full transition-all"
                         style={{ 
                           width: `${subject.percentage}%`,
                           backgroundColor: subject.percentage >= 70 ? 'hsl(142, 71%, 45%)' : 
                                          subject.percentage >= 50 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)'
                         }}
                       />
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                 Nenhuma questão registrada ainda
               </div>
             )}
           </div>
            <div>
              <h3 className="font-display font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-accent" />
                Desempenho por Disciplina nos Simulados
              </h3>
              {simuladoSubjectData.length > 0 ? (
                <div className="space-y-3">
                  {simuladoSubjectData.map(subject => (
                    <div key={subject.name} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                          <span className="truncate">{subject.name}</span>
                        </div>
                        <span className="flex-shrink-0 text-muted-foreground">
                          {subject.correct}/{subject.total} acertos • {subject.wrong} erros • {subject.percentage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${subject.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[100px] items-center justify-center text-muted-foreground">
                  Nenhum desempenho por disciplina registrado
                </div>
              )}
            </div>
         </TabsContent>
 
         <TabsContent value="simulados" className="space-y-6">
           <div>
             <h3 className="font-display font-semibold flex items-center gap-2 mb-4">
               <Target className="w-4 h-4 text-primary" />
               Evolução nos Simulados
             </h3>
             {simuladosData.length > 0 ? (
               <>
                 <ResponsiveContainer width="100%" height={200}>
                   <LineChart data={simuladosData}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                     <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                     <Tooltip content={<CustomTooltip />} />
                     <Line 
                       type="monotone" 
                       dataKey="percentage" 
                       name="Aproveitamento (%)" 
                       stroke="hsl(199, 89%, 48%)" 
                       strokeWidth={2}
                       dot={{ fill: 'hsl(199, 89%, 48%)', r: 4 }}
                     />
                   </LineChart>
                 </ResponsiveContainer>
                 <div className="grid grid-cols-2 gap-4 mt-4">
                   {simuladosData.slice(-4).map((simulado, index) => (
                     <div key={index} className="p-3 bg-muted/50 rounded-lg">
                       <p className="text-xs text-muted-foreground truncate">{simulado.name}</p>
                       <div className="flex items-baseline gap-2">
                         <span className="text-xl font-bold text-primary">{simulado.percentage}%</span>
                         <span className="text-xs text-muted-foreground">{simulado.correct}/{simulado.total}</span>
                       </div>
                     </div>
                   ))}
                 </div>
               </>
             ) : (
               <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                 Nenhum simulado registrado ainda
               </div>
             )}
           </div>
         </TabsContent>
       </Tabs>
     </Card>
   );
 }