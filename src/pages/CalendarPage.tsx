import { CalendarDays } from 'lucide-react';
import { StudyCalendar } from '@/components/StudyCalendar';

const CalendarPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-6 animate-fade-in">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <CalendarDays className="w-7 h-7 text-primary" />
          Calendário
        </h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe seus dias estudados, anotações e provas em um só lugar.
        </p>
      </header>
      <StudyCalendar />
    </div>
  );
};

export default CalendarPage;
