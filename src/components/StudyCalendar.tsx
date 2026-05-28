import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Clock, BookOpen, FileText, Trophy, Pencil, X, ListChecks, FileBarChart, RotateCcw, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useSessions } from '@/hooks/useSessions';
import { useSubjects } from '@/hooks/useSubjects';
import { useContests } from '@/hooks/useContests';
import { useCalendarNotes, useCalendarEvents } from '@/hooks/useCalendar';
import { useDailyQuestions } from '@/hooks/useDailyQuestions';
import { useSimulados } from '@/hooks/useSimulados';
import { useStudyRevisions } from '@/hooks/useStudyRevisions';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export function StudyCalendar({ compact = false }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statsMonth, setStatsMonth] = useState<number>(new Date().getMonth());
  const [statsYear, setStatsYear] = useState<number>(new Date().getFullYear());
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  const { sessions } = useSessions();
  const { subjects } = useSubjects();
  const { contests } = useContests();
  const { notes, addNoteAsync, updateNoteAsync, deleteNoteAsync } = useCalendarNotes();
  const { events, addEventAsync, deleteEventAsync } = useCalendarEvents();
  const { dailyQuestions } = useDailyQuestions();
  const { simulados } = useSimulados();
  const { revisions, toggleRevisionAsync } = useStudyRevisions();

  const revisionDateSet = useMemo(() => new Set(revisions.map(r => r.revision_date)), [revisions]);
  const revisionDates = useMemo(() => revisions.map(r => parseISO(r.revision_date)), [revisions]);

  const subjectMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>();
    subjects.forEach(s => m.set(s.id, { name: s.name, color: s.color }));
    return m;
  }, [subjects]);

  // Sessions grouped by date
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, { totalMinutes: number; subjects: Map<string, number> }>();
    sessions.forEach(s => {
      const key = format(new Date(s.start_time), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, { totalMinutes: 0, subjects: new Map() });
      const entry = map.get(key)!;
      entry.totalMinutes += s.duration;
      entry.subjects.set(s.subject_id, (entry.subjects.get(s.subject_id) || 0) + s.duration);
    });
    return map;
  }, [sessions]);

  // All exam dates: from contests + manual events
  const examDates = useMemo(() => {
    const dates: Date[] = [];
    contests.forEach(c => {
      if (c.exam_date) dates.push(parseISO(c.exam_date));
    });
    events.forEach(e => dates.push(parseISO(e.event_date)));
    return dates;
  }, [contests, events]);

  const studiedDates = useMemo(() => {
    return Array.from(sessionsByDate.keys()).map(d => parseISO(d));
  }, [sessionsByDate]);

  const noteDates = useMemo(() => notes.map(n => parseISO(n.note_date)), [notes]);

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const dayStudy = sessionsByDate.get(selectedKey);
  const dayNotes = notes.filter(n => n.note_date === selectedKey);
  const dayEvents = events.filter(e => e.event_date === selectedKey);
  const dayContests = contests.filter(c => c.exam_date === selectedKey);
  const dayQuestions = dailyQuestions.filter(q => q.question_date === selectedKey);
  const daySimulados = simulados.filter(s => s.exam_date === selectedKey);

  const dayQuestionsTotal = dayQuestions.reduce(
    (acc, q) => ({
      total: acc.total + q.total_questions,
      correct: acc.correct + q.correct_answers,
      wrong: acc.wrong + q.wrong_answers,
    }),
    { total: 0, correct: 0, wrong: 0 }
  );

  const dayIsRevised = revisionDateSet.has(selectedKey);

  // Aggregated stats: studied days and total minutes per period + per subject
  const stats = useMemo(() => {
    const today = new Date();
    const monthRef = new Date(statsYear, statsMonth, 1);
    const yearRef = new Date(statsYear, 0, 1);
    const ranges = {
      week: { start: startOfWeek(today, { weekStartsOn: 0 }), end: endOfWeek(today, { weekStartsOn: 0 }) },
      month: { start: startOfMonth(monthRef), end: endOfMonth(monthRef) },
      year: { start: startOfYear(yearRef), end: endOfYear(yearRef) },
    };
    const result = {
      total: { days: 0, minutes: 0, revisions: 0, perSubject: new Map<string, number>() },
      week: { days: 0, minutes: 0, revisions: 0, perSubject: new Map<string, number>() },
      month: { days: 0, minutes: 0, revisions: 0, perSubject: new Map<string, number>() },
      year: { days: 0, minutes: 0, revisions: 0, perSubject: new Map<string, number>() },
    };
    const countedDays: Record<keyof typeof result, Set<string>> = {
      total: new Set(), week: new Set(), month: new Set(), year: new Set(),
    };
    const bucketsFor = (d: Date): (keyof typeof result)[] => {
      const b: (keyof typeof result)[] = ['total'];
      if (isWithinInterval(d, ranges.week)) b.push('week');
      if (isWithinInterval(d, ranges.month)) b.push('month');
      if (isWithinInterval(d, ranges.year)) b.push('year');
      return b;
    };
    sessionsByDate.forEach((entry, key) => {
      const d = parseISO(key);
      bucketsFor(d).forEach(b => {
        if (!countedDays[b].has(key)) {
          countedDays[b].add(key);
          result[b].days += 1;
        }
        result[b].minutes += entry.totalMinutes;
        entry.subjects.forEach((mins, sid) => {
          result[b].perSubject.set(sid, (result[b].perSubject.get(sid) || 0) + mins);
        });
      });
    });
    revisions.forEach(r => {
      const d = parseISO(r.revision_date);
      bucketsFor(d).forEach(b => {
        result[b].revisions += 1;
        if (!countedDays[b].has(r.revision_date)) {
          countedDays[b].add(r.revision_date);
          result[b].days += 1;
        }
      });
    });
    return result;
  }, [sessionsByDate, revisions, statsMonth, statsYear]);

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const cy = new Date().getFullYear();
    years.add(cy);
    years.add(statsYear);
    sessionsByDate.forEach((_, key) => years.add(parseISO(key).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [sessionsByDate, statsYear]);

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  };

  const openNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteDialogOpen(true);
  };

  const openEditNote = (id: string, title: string, content: string) => {
    setEditingNoteId(id);
    setNoteTitle(title);
    setNoteContent(content);
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    try {
      if (editingNoteId) {
        await updateNoteAsync({ id: editingNoteId, title: noteTitle, content: noteContent });
      } else {
        await addNoteAsync({ note_date: selectedKey, title: noteTitle, content: noteContent });
      }
      setNoteDialogOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEvent = async () => {
    if (!eventTitle.trim()) return;
    try {
      await addEventAsync({ event_date: selectedKey, title: eventTitle, description: eventDesc, type: 'exam' });
      setEventTitle('');
      setEventDesc('');
      setEventDialogOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={cn("grid gap-6", compact ? "grid-cols-1" : "lg:grid-cols-[auto_1fr]")}>
      {/* Calendar */}
      <Card className="p-4">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(d) => d && setSelectedDate(d)}
          locale={ptBR}
          modifiers={{
            studied: studiedDates,
            exam: examDates,
            hasNote: noteDates,
          }}
          modifiersClassNames={{
            studied: 'bg-primary/15 text-primary font-semibold',
            exam: 'ring-2 ring-destructive ring-offset-1',
            hasNote: 'underline decoration-accent decoration-2 underline-offset-4',
          }}
          className="pointer-events-auto"
          classNames={{
            months: 'flex flex-col',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-sm font-medium capitalize',
            nav: 'space-x-1 flex items-center',
            nav_button: 'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-muted',
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse',
            head_row: 'flex',
            head_cell: 'text-muted-foreground rounded-md w-9 font-normal text-[0.75rem]',
            row: 'flex w-full mt-1',
            cell: 'h-9 w-9 text-center text-sm p-0 relative',
            day: 'h-9 w-9 p-0 font-normal rounded-md hover:bg-muted aria-selected:opacity-100',
            day_selected: 'bg-primary text-primary-foreground hover:bg-primary',
            day_today: 'border border-primary/50',
            day_outside: 'text-muted-foreground opacity-40',
            day_disabled: 'text-muted-foreground opacity-50',
          }}
          components={{
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
          }}
        />
        <div className="mt-4 space-y-1.5 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-primary/30" /> Dia estudado</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded ring-2 ring-destructive" /> Prova / Evento</div>
          <div className="flex items-center gap-2"><span className="w-3 h-0.5 bg-accent" /> Tem anotação</div>
        </div>
      </Card>

      {/* Day details */}
      <div className="space-y-4">
        {/* Aggregate stats */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Resumo de estudos
            </h3>
            <div className="flex items-center gap-2">
              <Select value={String(statsMonth)} onValueChange={(v) => setStatsMonth(Number(v))}>
                <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(statsYear)} onValueChange={(v) => setStatsYear(Number(v))}>
                <SelectTrigger className="h-8 w-[90px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableYears.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ['Semana atual', stats.week],
              [monthNames[statsMonth], stats.month],
              [String(statsYear), stats.year],
              ['Total', stats.total],
            ] as const).map(([label, s]) => (
              <div key={label} className="border rounded-md p-2.5">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-lg font-semibold">{s.days} {s.days === 1 ? 'dia' : 'dias'}</div>
                <div className="text-xs text-muted-foreground">{formatTime(s.minutes)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-3">
            <div className="text-sm font-medium mb-2">Horas por disciplina (total)</div>
            {stats.total.perSubject.size === 0 ? (
              <p className="text-xs text-muted-foreground">Sem registros ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from(stats.total.perSubject.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([sid, mins]) => {
                    const subj = subjectMap.get(sid);
                    return (
                      <div
                        key={sid}
                        className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-md border"
                        style={{ borderColor: subj?.color }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: subj?.color }} />
                        <span>{subj?.name || 'Matéria removida'}</span>
                        <span className="text-muted-foreground">· {formatTime(mins)}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold capitalize">
              {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
          </div>

          {/* Study summary */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Clock className="w-4 h-4 text-primary" />
                Estudo do dia
              </div>
              {dayStudy ? (
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-sm">
                    Total: {formatTime(dayStudy.totalMinutes)}
                  </Badge>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.from(dayStudy.subjects.entries()).map(([sid, mins]) => {
                      const subj = subjectMap.get(sid);
                      return (
                        <div
                          key={sid}
                          className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-md border"
                          style={{ borderColor: subj?.color }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: subj?.color }} />
                          <span>{subj?.name || 'Matéria removida'}</span>
                          <span className="text-muted-foreground">· {formatTime(mins)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma sessão registrada neste dia.</p>
              )}
            </div>

            {/* Daily Questions */}
            {dayQuestions.length > 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <ListChecks className="w-4 h-4 text-accent" />
                  Questões do dia
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary">Total: {dayQuestionsTotal.total}</Badge>
                  <Badge variant="outline">✓ {dayQuestionsTotal.correct}</Badge>
                  <Badge variant="outline">✗ {dayQuestionsTotal.wrong}</Badge>
                  {dayQuestionsTotal.total > 0 && (
                    <Badge variant="outline">
                      {Math.round((dayQuestionsTotal.correct / dayQuestionsTotal.total) * 100)}%
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dayQuestions.map(q => {
                    const subj = subjectMap.get(q.subject_id);
                    return (
                      <div
                        key={q.id}
                        className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-md border"
                        style={{ borderColor: subj?.color }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: subj?.color }} />
                        <span>{subj?.name || 'Matéria removida'}</span>
                        <span className="text-muted-foreground">
                          · {q.correct_answers}/{q.total_questions}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Simulados */}
            {daySimulados.length > 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FileBarChart className="w-4 h-4 text-warning" />
                  Simulados
                </div>
                <div className="space-y-1.5">
                  {daySimulados.map(s => {
                    const pct = s.total_questions > 0
                      ? Math.round((s.correct_answers / s.total_questions) * 100)
                      : 0;
                    return (
                      <div key={s.id} className="text-sm flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">Simulado</Badge>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {s.correct_answers}/{s.total_questions} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exams */}
            {(dayContests.length > 0 || dayEvents.length > 0) && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Trophy className="w-4 h-4 text-destructive" />
                  Provas / Eventos
                </div>
                <div className="space-y-1.5">
                  {dayContests.map(c => (
                    <div key={c.id} className="text-sm flex items-center gap-2">
                      <Badge variant="destructive">Prova</Badge>
                      <span>{c.name}</span>
                    </div>
                  ))}
                  {dayEvents.map(e => (
                    <div key={e.id} className="text-sm flex items-center justify-between gap-2 group">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline">Evento</Badge>
                        <span className="truncate">{e.title}</span>
                        {e.description && <span className="text-muted-foreground text-xs truncate">— {e.description}</span>}
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 opacity-60 hover:opacity-100" onClick={() => deleteEventAsync(e.id).catch(() => {})}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Trophy className="w-3.5 h-3.5" /> Marcar prova/evento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo evento em {format(selectedDate, 'dd/MM/yyyy')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Título</Label>
                    <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Ex: Prova TJ-SP" />
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Textarea value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} placeholder="Detalhes..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddEvent}>Salvar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-accent" />
              Anotações ({dayNotes.length})
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={openNewNote}>
              <Plus className="w-3.5 h-3.5" /> Nova
            </Button>
          </div>
          {dayNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma anotação para este dia.</p>
          ) : (
            <div className="space-y-2">
              {dayNotes.map(n => (
                <div key={n.id} className="border rounded-md p-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {n.title && <div className="font-medium text-sm truncate">{n.title}</div>}
                      {n.content && <div className="text-sm text-muted-foreground whitespace-pre-wrap">{n.content}</div>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditNote(n.id, n.title, n.content)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteNoteAsync(n.id).catch(() => {})}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Note dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNoteId ? 'Editar anotação' : 'Nova anotação'} — {format(selectedDate, 'dd/MM/yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Ex: Revisar Direito Const." />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={6} placeholder="Suas anotações..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveNote}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
