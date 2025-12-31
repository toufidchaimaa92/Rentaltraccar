import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarView } from '../../calendar/calendarHelpers';

interface Props {
  currentDate: Date;
  monthLabel?: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateChange?: (date: Date) => void;
  view?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  showPicker?: boolean;
}

export const CalendarHeader: React.FC<Props> = ({
  currentDate,
  monthLabel,
  onPrev,
  onNext,
  onToday,
  onDateChange,
  view,
  onViewChange,
  showPicker = true,
}) => (
  <div className="flex flex-nowrap items-center justify-between gap-2 overflow-x-auto">
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Précédent" className="h-9 w-9 shrink-0">
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {showPicker && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="mx-1 h-9 min-w-0 flex-1 justify-start truncate sm:min-w-[220px]">
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {currentDate.toLocaleDateString('fr-FR', {
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
              onSelect={(d) => { if (d && onDateChange) onDateChange(d); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      <Button variant="ghost" size="icon" onClick={onNext} aria-label="Suivant" className="h-9 w-9 shrink-0">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>

    <div className="flex flex-none items-center gap-2">
      {monthLabel && <div className="hidden min-w-[140px] text-sm font-semibold text-muted-foreground sm:block">{monthLabel}</div>}
      <Button onClick={onToday} className="h-9 px-3">
        <CalendarIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Aujourd’hui</span>
        <span className="sr-only">Aujourd’hui</span>
      </Button>
      {onViewChange && view && (
        <div className="inline-flex rounded-full border border-border bg-card p-0.5 shadow">
          {(['month', 'day'] as CalendarView[]).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={view === v ? 'default' : 'ghost'}
              className="h-8 rounded-full px-3"
              onClick={() => onViewChange(v)}
            >
              <span className="sm:hidden">{v === 'month' ? 'M' : 'J'}</span>
              <span className="hidden sm:inline">{v === 'month' ? 'Mois' : 'Jour'}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default CalendarHeader;
