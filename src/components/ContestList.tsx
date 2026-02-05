 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Contest } from '@/types/database';
 import { Trophy, Calendar, Edit, Trash2, RefreshCw, Layers } from 'lucide-react';
 import { format, differenceInDays, parseISO } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from "@/components/ui/alert-dialog";
 
 interface ContestListProps {
   contests: Contest[];
   onEdit: (contest: Contest) => void;
   onDelete: (id: string) => void;
 }
 
 export function ContestList({ contests, onEdit, onDelete }: ContestListProps) {
   if (contests.length === 0) {
     return (
       <Card className="p-8 text-center shadow-card">
         <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
           <Trophy className="w-6 h-6 text-muted-foreground" />
         </div>
         <h3 className="font-display font-semibold mb-1">Nenhum concurso cadastrado</h3>
         <p className="text-sm text-muted-foreground">
           Cadastre seu primeiro concurso para começar a organizar seus estudos.
         </p>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       {contests.map((contest) => {
         const daysUntilExam = contest.exam_date 
           ? differenceInDays(parseISO(contest.exam_date), new Date())
           : null;
 
         return (
           <Card key={contest.id} className="p-4 shadow-card hover:shadow-elevated transition-shadow">
             <div className="flex items-start justify-between">
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-2">
                   <h3 className="font-display font-semibold">{contest.name}</h3>
                   <Badge variant={contest.is_active ? "default" : "secondary"}>
                     {contest.is_active ? 'Ativo' : 'Inativo'}
                   </Badge>
                 </div>
                 
                 <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                   {contest.exam_date && (
                     <div className="flex items-center gap-1">
                       <Calendar className="w-4 h-4" />
                       <span>
                         {format(parseISO(contest.exam_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                       </span>
                       {daysUntilExam !== null && daysUntilExam >= 0 && (
                         <Badge variant="outline" className="ml-1">
                           {daysUntilExam === 0 ? 'Hoje!' : `${daysUntilExam} dias`}
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
                       {contest.study_plan_type === 'cycle' ? 'Ciclo' : 'Plano Injetado'} • {contest.cycle_days} dias
                     </span>
                   </div>
                 </div>
               </div>
 
               <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={() => onEdit(contest)}>
                   <Edit className="w-4 h-4" />
                 </Button>
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Excluir concurso?</AlertDialogTitle>
                       <AlertDialogDescription>
                         Esta ação não pode ser desfeita. Todas as matérias vinculadas a este concurso também serão removidas.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                       <AlertDialogAction onClick={() => onDelete(contest.id)} className="bg-destructive hover:bg-destructive/90">
                         Excluir
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             </div>
           </Card>
         );
       })}
     </div>
   );
 }