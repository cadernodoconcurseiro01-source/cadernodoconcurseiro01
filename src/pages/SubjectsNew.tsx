import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { AddSubjectDialogNew } from '@/components/AddSubjectDialogNew';
import { SubjectProgressNew } from '@/components/SubjectProgressNew';
import { useSubjects } from '@/hooks/useSubjects';
import { Subject } from '@/types/database';

const SubjectsPage = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useSubjects();
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-accent" />
              Matérias
            </h1>
            <p className="text-muted-foreground">
              Gerencie suas matérias e defina níveis de dificuldade para o ciclo de estudos.
            </p>
          </div>
          <AddSubjectDialogNew onAdd={addSubject} />
        </div>
      </header>

      <SubjectProgressNew 
        subjects={subjects}
        onDelete={deleteSubject}
        onEdit={handleEditSubject}
      />

      {/* Edit Subject Dialog */}
      <AddSubjectDialogNew
        onAdd={addSubject}
        editingSubject={editingSubject}
        onUpdate={updateSubject}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingSubject(null);
        }}
      />
    </div>
  );
};

export default SubjectsPage;
