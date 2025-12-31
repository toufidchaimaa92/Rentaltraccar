import { useCallback } from 'react';
import { CalendarView } from './calendarHelpers';

export const useCalendarNavigation = (
  currentDate: Date,
  today: Date,
  setCurrentDate: (date: Date) => void,
  setCurrentView?: (view: CalendarView) => void,
) => {
  const shiftDay = useCallback((direction: number) => {
    const nd = new Date(currentDate);
    nd.setDate(currentDate.getDate() + direction);
    setCurrentDate(nd);
  }, [currentDate, setCurrentDate]);

  const shiftMonth = useCallback((direction: number) => {
    const normalized = new Date(currentDate);
    normalized.setDate(1);
    normalized.setMonth(normalized.getMonth() + direction);
    setCurrentDate(normalized);
  }, [currentDate, setCurrentDate]);

  const goToToday = useCallback(() => {
    setCurrentDate(today);
  }, [setCurrentDate, today]);

  const switchView = useCallback((view: CalendarView) => {
    if (setCurrentView) setCurrentView(view);
  }, [setCurrentView]);

  return {
    shiftDay,
    shiftMonth,
    goToToday,
    switchView,
  };
};
