import { useCallback } from 'react';
import { buildCalendarPdf } from './pdf/calendarPdfBuilder';
import { CalendarEvent } from './calendarHelpers';

type Filter = 'all' | 'start' | 'end';

export const useCalendarPdf = (currentDate: Date, events: CalendarEvent[]) => {
  const handleDownload = useCallback(async (filter?: Filter) => {
    const doc = await buildCalendarPdf({ currentDate, events, filter });
    const dateStr = currentDate.toLocaleDateString('fr-CA');
    doc.save(`locations-${dateStr}.pdf`);
  }, [currentDate, events]);

  return { handleDownload };
};
