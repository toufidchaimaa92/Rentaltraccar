import { router } from '@inertiajs/react';

export type CalendarView = 'day' | 'month';
export type EventTiming = 'start' | 'end' | 'single' | 'due' | 'none';

export interface Car {
  id: string;
  make: string;
  model: string;
  license_plate: string;
}

export interface Client {
  phone: string;
}

export interface CarModel {
  brand: string;
  model: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  status: string;
  car_id?: string | null;
  car_model_id?: string | null;
  car?: Car | null;
  client?: Client | null;
  carModel: CarModel;
  note?: string;
  eventType?: EventTiming;
  displayColor?: string;
  paid_amount?: number;
  total_amount?: number;
  reste_a_payer?: number;
  has_payment_due?: boolean;
  payment_status?: string | null;
}

export const CALENDAR_COLORS = {
  start: 'blue',
  end: 'red',
  due: 'amber',
  single: 'blue',
} as const;

export const CALENDAR_STATUS = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'active', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
];

export const PDF_STYLES = {
  margin: { top: 40, right: 40, bottom: 30, left: 40 },
  headerBlue: [17, 94, 250] as [number, number, number],
};

export const toLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const hhmm = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export const safeTime = (s?: string) => {
  const t = s ? new Date(s).getTime() : NaN;
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
};

export const byStartTime = (a: CalendarEvent, b: CalendarEvent) => safeTime(a.start) - safeTime(b.start);
export const byEndTime = (a: CalendarEvent, b: CalendarEvent) => safeTime(a.end) - safeTime(b.end);

export const getEventType = (event: CalendarEvent, date: Date): EventTiming => {
  const dateStr = toLocalYMD(date);
  const startStr = toLocalYMD(new Date(event.start));
  const endStr = toLocalYMD(new Date(event.end));
  const isDue = (event.status || '').toLowerCase() === 'due';

  if (!(dateStr === startStr || dateStr === endStr)) return 'none';
  if (isDue) return 'due';
  if (startStr === endStr) return 'single';
  return dateStr === startStr ? 'start' : 'end';
};

export const withEventType = (event: CalendarEvent, date: Date): CalendarEvent | null => {
  const eventType = getEventType(event, date);
  if (eventType === 'none') return null;
  const displayColor = CALENDAR_COLORS[eventType === 'none' ? 'start' : eventType as keyof typeof CALENDAR_COLORS];
  return { ...event, eventType, displayColor };
};

export const getStarts = (events: CalendarEvent[]) =>
  events.filter((e) => e.eventType === 'start' || e.eventType === 'single').sort(byStartTime);

export const getEnds = (events: CalendarEvent[]) =>
  events.filter((e) => e.eventType === 'end' || e.eventType === 'single').sort(byEndTime);

export const getDues = (events: CalendarEvent[]) =>
  events.filter((e) => e.eventType === 'due').sort(byStartTime);

export const statusToFr = (v: string) => CALENDAR_STATUS.find((s) => s.value === (v || '').toLowerCase())?.label || v;

export const mapFetchedEvents = (fetched: any[]): CalendarEvent[] =>
  fetched
    .map((event: any) => {
      if (!event?.start || !event?.end) return null;
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
      return {
        id: String(event.id),
        title: String(event.title),
        start: event.start,
        end: event.end,
        color: event.color || 'blue',
        status: event.status || 'pending',
        car_id: event.car_id || null,
        car_model_id: event.car_model_id || null,
        car: event.car || null,
        client: event.client || null,
        carModel: event.carModel || { brand: 'Inconnue', model: 'Inconnu' },
        note: event.note || '',
        paid_amount: event.paid_amount ?? 0,
        total_amount: event.total_amount ?? 0,
        reste_a_payer: event.reste_a_payer ?? 0,
        has_payment_due: event.has_payment_due ?? false,
        payment_status: event.payment_status ?? null,
    } as CalendarEvent;
    })
    .filter(Boolean)
    .filter((event: CalendarEvent) => event.status !== 'completed');

export const fetchCalendarEvents = (
  url: string,
  onSuccess: (events: CalendarEvent[]) => void,
  onFinish?: () => void,
) => {
  router.get(url, {}, {
    preserveState: true,
    preserveScroll: true,
    only: ['events'],
    onSuccess: (page: any) => {
      const mapped = mapFetchedEvents(page.props.events || []);
      onSuccess(mapped);
    },
    onFinish,
  });
};
