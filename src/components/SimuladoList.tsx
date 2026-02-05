 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Simulado, Contest } from '@/types/database';
 import { FileText, Calendar, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
 import { format, parseISO } from 'date-fns';
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
 
 interface SimuladoListProps {
   simulados: Simulado[];
   contests: Contest[];
   onEdit: (simulado: Simulado) => void;
   onDelete: (id: string) => void;
 }
 
 export function SimuladoList({ simulados, contests, onEdit, onDelete }: SimuladoListProps) {
   const getContestName = (contestId: string | null) => {
     if (!contestId) return null;
     const contest = contests.find(c => c.id === contestId);
     return contest?.name;
   };
 
   if (simulados.length === 0) {
     return (
       <Card className="p-8 text-center shadow-card">
         <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
           <FileText className="w-6 h-6 text-muted-foreground" />
         </div>
         <h3 className="font-display font-semibold mb-1">Nenhum simulado cadastrado</h3>
         <p className="text-sm text-muted-foreground">
           Registre seus simulados para acompanhar sua evolução.
         </p>
       </Card>
     );
   }
 
   return (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
       {simulados.map((simulado) => {
         const percentage = simulado.total_questions > 0 
           ? Math.round((simulado.correct_answers / simulado.total_questions) * 100) 
           : 0;
         const contestName = getContestName(simulado.contest_id);
 
         return (
           <Card key={simulado.id} className="p-4 shadow-card hover:shadow-elevated transition-shadow">
             <div className="flex items-start justify-between mb-3">
               <div>
                 <h3 className="font-display font-semibold">{simulado.name}</h3>
                 {contestName && (
                   <Badge variant="secondary" className="mt-1">{contestName}</Badge>
                 )}
               </div>
               <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(simulado)}>
                   <Edit className="w-3.5 h-3.5" />
                 </Button>
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                       <Trash2 className="w-3.5 h-3.5" />
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Excluir simulado?</AlertDialogTitle>
                       <AlertDialogDescription>
                         Esta ação não pode ser desfeita.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                       <AlertDialogAction onClick={() => onDelete(simulado.id)} className="bg-destructive hover:bg-destructive/90">
                         Excluir
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
             </div>
 
             <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
               <Calendar className="w-3.5 h-3.5" />
               <span>{format(parseISO(simulado.exam_date), "dd/MM/yyyy", { locale: ptBR })}</span>
             </div>
 
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-4 text-sm">
                 <div className="flex items-center gap-1 text-accent">
                   <CheckCircle className="w-4 h-4" />
                   <span>{simulado.correct_answers}</span>
                 </div>
                 <div className="flex items-center gap-1 text-destructive">
                   <XCircle className="w-4 h-4" />
                   <span>{simulado.wrong_answers}</span>
                 </div>
               </div>
               <div className="text-right">
                 <span className={`text-2xl font-bold ${
                   percentage >= 70 ? 'text-accent' : 
                   percentage >= 50 ? 'text-warning' : 'text-destructive'
                 }`}>
                   {percentage}%
                 </span>
                 <p className="text-xs text-muted-foreground">{simulado.total_questions} questões</p>
               </div>
             </div>
           </Card>
         );
       })}
     </div>
   );
 }