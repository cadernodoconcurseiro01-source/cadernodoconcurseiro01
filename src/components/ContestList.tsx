import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Contest } from '@/types/database';
import { Trophy, Calendar, Edit, Trash2, RefreshCw, Layers, ChevronRight } from 'lucide-react';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
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
  const navigate = useNavigate();

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

  return (
    <div className="space-y-4">
      {contests.map((contest) => {
        const formattedDate = formatExamDate(contest.exam_date);
        const daysUntilExam = getDaysUntilExam(contest.exam_date);

        return (
          <Card 
            key={contest.id} 
            className="p-4 shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
            onClick={() => navigate(`/contests/${contest.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display font-semibold">{contest.name}</h3>
                  <Badge variant={contest.is_active ? "default" : "secondary"}>
                    {contest.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {formattedDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formattedDate}</span>
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
                      {contest.cycle_number || 1}º {contest.study_plan_type === 'cycle' ? 'Ciclo' : 'Plano'} • {contest.cycle_days || 7} dias
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(contest);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir concurso?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. As matérias vinculadas serão desvinculadas, mas não excluídas.
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
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}