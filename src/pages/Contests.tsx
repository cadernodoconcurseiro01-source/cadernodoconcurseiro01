 import { useState } from 'react';
 import { Trophy } from 'lucide-react';
 import { useContests } from '@/hooks/useContests';
 import { AddContestDialog } from '@/components/AddContestDialog';
 import { ContestList } from '@/components/ContestList';
 import { Contest } from '@/types/database';
 import { Skeleton } from '@/components/ui/skeleton';
 
 const ContestsPage = () => {
   const { contests, isLoading, addContest, updateContest, deleteContest } = useContests();
   const [editingContest, setEditingContest] = useState<Contest | null>(null);
   const [editDialogOpen, setEditDialogOpen] = useState(false);
 
   const handleEdit = (contest: Contest) => {
     setEditingContest(contest);
     setEditDialogOpen(true);
   };
 
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
               <Trophy className="w-8 h-8 text-primary" />
               Meus Concursos
             </h1>
             <p className="text-muted-foreground">
               Gerencie seus concursos e configure o tipo de plano de estudos.
             </p>
           </div>
           <AddContestDialog onAdd={addContest} />
         </div>
       </header>
 
       <ContestList 
         contests={contests} 
         onEdit={handleEdit} 
         onDelete={deleteContest} 
       />
 
       <AddContestDialog
         onAdd={addContest}
         editingContest={editingContest}
         onUpdate={updateContest}
         open={editDialogOpen}
         onOpenChange={(open) => {
           setEditDialogOpen(open);
           if (!open) setEditingContest(null);
         }}
       />
     </div>
   );
 };
 
 export default ContestsPage;