import { useState } from 'react';
import { FileText, Target, CheckCircle, XCircle, Percent } from 'lucide-react';
import { useSimulados } from '@/hooks/useSimulados';
import { useContests } from '@/hooks/useContests';
import { useSubjects } from '@/hooks/useSubjects';
import { AddSimuladoDialog } from '@/components/AddSimuladoDialog';
import { SimuladoList } from '@/components/SimuladoList';
import { Simulado } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

const SimuladosPage = () => {
  const { simulados, isLoading, addSimuladoAsync, updateSimuladoAsync, deleteSimulado, getStats } = useSimulados();
  const { contests } = useContests();
  const { subjects } = useSubjects();
  const [editingSimulado, setEditingSimulado] = useState<Simulado | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const stats = getStats();

  const handleEdit = (simulado: Simulado) => {
    setEditingSimulado(simulado);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Simulados
            </h1>
            <p className="text-muted-foreground">
              Registre e acompanhe seu desempenho nos simulados.
            </p>
          </div>
          <AddSimuladoDialog onAdd={addSimuladoAsync} contests={contests} subjects={subjects} />
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSimulados}</p>
              <p className="text-xs text-muted-foreground">Simulados</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalQuestions}</p>
              <p className="text-xs text-muted-foreground">Questões</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">{stats.totalCorrect}</p>
              <p className="text-xs text-muted-foreground">Acertos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Percent className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{stats.avgPercentage}%</p>
              <p className="text-xs text-muted-foreground">Média</p>
            </div>
          </div>
        </Card>
      </div>

      <SimuladoList 
        simulados={simulados} 
        contests={contests}
        onEdit={handleEdit} 
        onDelete={deleteSimulado} 
      />

      <AddSimuladoDialog
        onAdd={addSimuladoAsync}
        contests={contests}
        subjects={subjects}
        editingSimulado={editingSimulado}
        onUpdate={updateSimuladoAsync}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingSimulado(null);
        }}
      />
    </div>
  );
};

export default SimuladosPage;