import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import MonthlyCalendar from './MonthlyCalendar';
import DayViewCalendar from './DayViewCalendar';
import { CalendarEvent } from '@/components/calendar/calendarHelpers';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Calendar as CalendarIcon,
  Calendar1,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Props {
  auth: { user: any };
  events?: CalendarEvent[];      // make sure backend always uses this key
  initialEvents?: CalendarEvent[]; // optional: accept legacy key temporarily
  today?: string;
}

const getQueryParams = () => {
  if (typeof window === 'undefined') return {} as { view?: 'month' | 'day'; date?: string };
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const date = params.get('date');
  return {
    view: view === 'day' || view === 'month' ? view : undefined,
    date: date ?? undefined,
  };
};

export default function FullCalendarPage({ auth, events = [], initialEvents = [], today }: Props) {
  // Accept either prop name while you fix the backend mismatch
  const incoming = events.length ? events : initialEvents;

  // Just use the date the server gave you for "today", otherwise now.
  const todayDate = useMemo(() => today ? new Date(today) : new Date(), [today]);

  const { view: initialView, date: initialDateParam } = getQueryParams();
  const initialDate = useMemo(() => {
    if (!initialDateParam) return todayDate;
    const parsed = new Date(initialDateParam);
    return Number.isNaN(parsed.getTime()) ? todayDate : parsed;
  }, [initialDateParam, todayDate]);

  // IMPORTANT: do NOT “normalize”/stretch end times on the client.
  // FullCalendar/custom month views typically expect:
  // - allDay=true  -> end is exclusive (next-day 00:00)
  // - timed event  -> exact start/end datetimes
  const visibleEvents = useMemo(
    () => incoming.filter(e => e.status?.toLowerCase() !== 'completed'),
    [incoming]
  );

  const [eventsState, setEvents] = useState<CalendarEvent[]>(visibleEvents);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [currentView, setCurrentView] = useState<'month' | 'day'>(initialView ?? 'day');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const calendarYear = todayDate.getFullYear();

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];

  const navigateDate = (direction: number) => {
    if (currentView === 'month') {
      const normalized = new Date(currentDate);
      normalized.setDate(1);
      normalized.setMonth(normalized.getMonth() + direction);
      setCurrentDate(normalized);
      return;
    }

    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + direction);
    setCurrentDate(next);
  };

  const goToToday = () => {
    setCurrentDate(new Date(todayDate));
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Card className="w-full border-border bg-card text-card-foreground shadow">
        <CardHeader className="sticky top-0 z-20 bg-card md:static px-2 sm:px-4 lg:px-5 pt-0 pb-2">



          <div className="flex flex-nowrap items-center justify-between gap-2 overflow-x-auto">
            <div className="flex min-w-0 items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate(-1)}
                aria-label={currentView === 'month' ? 'Mois précédent' : 'Jour précédent'}
                className="h-9 w-9 shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="mx-1 h-9 min-w-0 flex-1 justify-start truncate"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {currentView === 'month'
                        ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        : currentDate.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    captionLayout="dropdown"
                    fromYear={calendarYear - 5}
                    toYear={calendarYear + 5}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentDate(date);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDate(1)}
                aria-label={currentView === 'month' ? 'Mois suivant' : 'Jour suivant'}
                className="h-9 w-9 shrink-0"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-none items-center gap-2">
              <div className="hidden min-w-[140px] text-sm font-semibold text-muted-foreground sm:block" />
              <Button
                onClick={goToToday}
                className="h-9 px-4 rounded-full flex items-center gap-2 shadow-sm hover:shadow transition"
              >
                <Calendar1 className="h-4 w-4" />
                <span className="hidden sm:inline">Aujourd’hui</span>
                <span className="sr-only">Aujourd’hui</span>
              </Button>

              <div className="inline-flex rounded-full border border-border bg-card p-0.5 shadow">
                {(['month', 'day'] as const).map((view) => (
                  <Button
                    key={view}
                    size="sm"
                    variant={currentView === view ? 'default' : 'ghost'}
                    className="h-8 rounded-full px-3"
                    onClick={() => setCurrentView(view)}
                  >
                    <span className="sm:hidden">{view === 'month' ? 'M' : 'J'}</span>
                    <span className="hidden sm:inline">
                      {view === 'month' ? 'Mois' : 'Jour'}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 sm:px-4 lg:px-5 pt-0 pb-4">


          {currentView === 'month' ? (
            <MonthlyCalendar
              auth={auth}
              events={eventsState}
              currentDate={currentDate}
              today={todayDate}
              setCurrentDate={setCurrentDate}
              setEvents={setEvents}
              setCurrentView={setCurrentView}
            />
          ) : (
            <DayViewCalendar
              auth={auth}
              events={eventsState}
              currentDate={currentDate}
              setEvents={setEvents}
            />
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}