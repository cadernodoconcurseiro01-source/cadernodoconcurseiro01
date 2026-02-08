 import { useState } from 'react';
 import { Button } from '@/components/ui/button';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Plus, HelpCircle } from 'lucide-react';
 import { Subject } from '@/types/database';
 import { format } from 'date-fns';
 
 interface AddDailyQuestionsDialogProps {
   onAdd: (data: { 
     subject_id: string; 
     total_questions: number; 
     correct_answers: number; 
     wrong_answers: number;
     question_date?: string;
   }) => void;
   subjects: Subject[];
 }
 
 export function AddDailyQuestionsDialog({ onAdd, subjects }: AddDailyQuestionsDialogProps) {
   const [open, setOpen] = useState(false);
   const [subjectId, setSubjectId] = useState('');
   const [questionDate, setQuestionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
   const [totalQuestions, setTotalQuestions] = useState(0);
   const [correctAnswers, setCorrectAnswers] = useState(0);
   const [wrongAnswers, setWrongAnswers] = useState(0);
 
   const handleTotalChange = (value: number) => {
     setTotalQuestions(value);
     if (correctAnswers > 0) {
       setWrongAnswers(Math.max(0, value - correctAnswers));
     }
   };
 
   const handleCorrectChange = (value: number) => {
     setCorrectAnswers(value);
     setWrongAnswers(Math.max(0, totalQuestions - value));
   };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || totalQuestions === 0) return;

    try {
      await onAdd({
        subject_id: subjectId,
        question_date: questionDate,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
      });

      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error adding questions:', error);
    }
  };
 
   const resetForm = () => {
     setSubjectId('');
     setQuestionDate(format(new Date(), 'yyyy-MM-dd'));
     setTotalQuestions(0);
     setCorrectAnswers(0);
     setWrongAnswers(0);
   };
 
   const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button size="sm" className="gradient-primary gap-1">
           <Plus className="w-4 h-4" />
           Registrar Questões
         </Button>
       </DialogTrigger>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="font-display flex items-center gap-2">
             <HelpCircle className="w-5 h-5 text-primary" />
             Registrar Questões do Dia
           </DialogTitle>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4 py-4">
           <div className="space-y-2">
             <Label>Disciplina</Label>
             <Select value={subjectId} onValueChange={setSubjectId} required>
               <SelectTrigger>
                 <SelectValue placeholder="Selecione uma disciplina" />
               </SelectTrigger>
               <SelectContent>
                 {subjects.map(subject => (
                   <SelectItem key={subject.id} value={subject.id}>
                     <div className="flex items-center gap-2">
                       <div 
                         className="w-3 h-3 rounded-full" 
                         style={{ backgroundColor: subject.color }}
                       />
                       {subject.name}
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="questionDate">Data</Label>
             <Input
               id="questionDate"
               type="date"
               value={questionDate}
               onChange={(e) => setQuestionDate(e.target.value)}
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
 
           <Button type="submit" className="w-full gradient-primary" disabled={!subjectId || totalQuestions === 0}>
             Registrar Questões
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }