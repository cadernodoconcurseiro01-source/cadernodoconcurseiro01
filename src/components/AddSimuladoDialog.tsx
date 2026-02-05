 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Plus, FileText } from 'lucide-react';
 import { Simulado, Contest } from '@/types/database';
 import { format } from 'date-fns';
 
 interface AddSimuladoDialogProps {
   onAdd: (simulado: Omit<Simulado, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
   contests: Contest[];
   editingSimulado?: Simulado | null;
   onUpdate?: (simulado: Partial<Simulado> & { id: string }) => void;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
 }
 
 export function AddSimuladoDialog({ onAdd, contests, editingSimulado, onUpdate, open, onOpenChange }: AddSimuladoDialogProps) {
   const [internalOpen, setInternalOpen] = useState(false);
   const [name, setName] = useState(editingSimulado?.name || '');
   const [contestId, setContestId] = useState(editingSimulado?.contest_id || '');
   const [examDate, setExamDate] = useState(editingSimulado?.exam_date || format(new Date(), 'yyyy-MM-dd'));
   const [totalQuestions, setTotalQuestions] = useState(editingSimulado?.total_questions || 0);
   const [correctAnswers, setCorrectAnswers] = useState(editingSimulado?.correct_answers || 0);
   const [wrongAnswers, setWrongAnswers] = useState(editingSimulado?.wrong_answers || 0);
 
   const isControlled = open !== undefined;
   const isOpen = isControlled ? open : internalOpen;
   const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;
 
   const handleTotalChange = (value: number) => {
     setTotalQuestions(value);
     // Auto-calculate wrong if correct is set
     if (correctAnswers > 0) {
       setWrongAnswers(Math.max(0, value - correctAnswers));
     }
   };
 
   const handleCorrectChange = (value: number) => {
     setCorrectAnswers(value);
     setWrongAnswers(Math.max(0, totalQuestions - value));
   };
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!name.trim()) return;
 
     const simuladoData = {
       name: name.trim(),
       contest_id: contestId || null,
       exam_date: examDate,
       total_questions: totalQuestions,
       correct_answers: correctAnswers,
       wrong_answers: wrongAnswers,
     };
 
     if (editingSimulado && onUpdate) {
       onUpdate({ id: editingSimulado.id, ...simuladoData });
     } else {
       onAdd(simuladoData);
     }
 
     resetForm();
     setIsOpen(false);
   };
 
   const resetForm = () => {
     if (!editingSimulado) {
       setName('');
       setContestId('');
       setExamDate(format(new Date(), 'yyyy-MM-dd'));
       setTotalQuestions(0);
       setCorrectAnswers(0);
       setWrongAnswers(0);
     }
   };
 
   const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
 
   return (
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
       {!editingSimulado && (
         <DialogTrigger asChild>
           <Button size="sm" className="gradient-primary gap-1">
             <Plus className="w-4 h-4" />
             Novo Simulado
           </Button>
         </DialogTrigger>
       )}
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="font-display flex items-center gap-2">
             <FileText className="w-5 h-5 text-primary" />
             {editingSimulado ? 'Editar Simulado' : 'Novo Simulado'}
           </DialogTitle>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="name">Nome do Simulado</Label>
             <Input
               id="name"
               placeholder="Ex: Simulado 01 - TRF"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
             />
           </div>
 
           {contests.length > 0 && (
             <div className="space-y-2">
               <Label>Concurso (opcional)</Label>
               <Select value={contestId} onValueChange={setContestId}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione um concurso" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="">Nenhum</SelectItem>
                   {contests.map(contest => (
                     <SelectItem key={contest.id} value={contest.id}>{contest.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}
 
           <div className="space-y-2">
             <Label htmlFor="examDate">Data do Simulado</Label>
             <Input
               id="examDate"
               type="date"
               value={examDate}
               onChange={(e) => setExamDate(e.target.value)}
               required
             />
           </div>
 
           <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
               <Label htmlFor="total">Total</Label>
               <Input
                 id="total"
                 type="number"
                 min={0}
                 value={totalQuestions}
                 onChange={(e) => handleTotalChange(Number(e.target.value))}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="correct" className="text-accent">Acertos</Label>
               <Input
                 id="correct"
                 type="number"
                 min={0}
                 max={totalQuestions}
                 value={correctAnswers}
                 onChange={(e) => handleCorrectChange(Number(e.target.value))}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="wrong" className="text-destructive">Erros</Label>
               <Input
                 id="wrong"
                 type="number"
                 min={0}
                 max={totalQuestions}
                 value={wrongAnswers}
                 onChange={(e) => setWrongAnswers(Number(e.target.value))}
               />
             </div>
           </div>
 
           {totalQuestions > 0 && (
             <div className="p-3 bg-muted/50 rounded-lg text-center">
               <span className="text-2xl font-bold text-primary">{percentage}%</span>
               <p className="text-xs text-muted-foreground">Taxa de acerto</p>
             </div>
           )}
 
           <Button type="submit" className="w-full gradient-primary">
             {editingSimulado ? 'Salvar Alterações' : 'Cadastrar Simulado'}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }