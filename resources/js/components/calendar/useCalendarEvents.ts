import React, { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import {
  CalendarEvent,
  fetchCalendarEvents,
  mapFetchedEvents,
} from './calendarHelpers';

interface StatusPayload {
  status: string;
  car_id?: string;
}

export const useCalendarEvents = (
  currentDate: Date,
  setEvents: (events: CalendarEvent[]) => void,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [availableCars, setAvailableCars] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDayEvents = useCallback(() => {
    setIsLoading(true);
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const d = currentDate.getDate();
    const url = `/calendar/day?date=${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    fetchCalendarEvents(url, setEvents, () => setIsLoading(false));
  }, [currentDate, setEvents]);

  const fetchMonthEvents = useCallback(() => {
    setIsLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const url = `/calendar/month?year=${year}&month=${month}`;
    fetchCalendarEvents(url, setEvents, () => setIsLoading(false));
  }, [currentDate, setEvents]);

  const fetchAvailableCars = useCallback(async (rentalId?: string) => {
    if (!rentalId) { setAvailableCars([]); setErrorMessage('Aucune location sélectionnée.'); return; }
    setIsLoading(true); setErrorMessage(null);
    try {
      const res = await fetch(`/cars/available?rental_id=${rentalId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const result = await res.json();
      if (Array.isArray(result.cars)) { setAvailableCars(result.cars); } else {
        setAvailableCars([]); setErrorMessage(result.message || 'Aucune voiture disponible pour ce modèle.');
      }
    } catch {
      setErrorMessage('Échec du chargement des voitures.'); setAvailableCars([]);
    } finally { setIsLoading(false); }
  }, []);

  const updateEventStatus = useCallback(async (
    events: CalendarEvent[],
    eventId: string,
    newStatus: string,
    selectedCarId: string | null,
    onUpdate: React.Dispatch<React.SetStateAction<CalendarEvent[]>>,
    onClose: () => void,
  ) => {
    setErrorMessage(null);

    const payload: StatusPayload = { status: newStatus };
    if (newStatus === 'active' && selectedCarId) payload.car_id = selectedCarId;

    const prevEvents = events;
    const chosen = availableCars.find((c) => c.id === selectedCarId);

    onUpdate(prev =>
      prev
        .map((e) => (e.id === eventId
          ? {
              ...e,
              status: newStatus,
              car_id: newStatus === 'active' ? selectedCarId : e.car_id,
              car: newStatus === 'active' && chosen ? {
                make: chosen.make,
                model: chosen.model,
                license_plate: chosen.license_plate,
              } : e.car,
            }
          : e))
        .filter((e) => e.status !== 'completed'),
    );

    onClose();

    router.patch(`/rentals/${eventId}/status`, payload, {
      preserveScroll: true,
      onError: () => {
        onUpdate(prevEvents);
        setErrorMessage('Erreur lors de la mise à jour du statut.');
      },
    });
  }, [availableCars]);

  const mapEventsForDate = useCallback((date: Date, events: any[]) => {
    const mapped = mapFetchedEvents(events);
    return mapped.map((evt) => ({ ...evt }));
  }, []);

  return {
    isLoading,
    availableCars,
    errorMessage,
    fetchDayEvents,
    fetchMonthEvents,
    fetchAvailableCars,
    updateEventStatus,
    mapEventsForDate,
  };
};
