import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock3, Eye, Settings } from 'lucide-react';
import { CalendarEvent, statusToFr } from '../../calendar/calendarHelpers';
import { Button } from '@/components/ui/button';

interface Props {
  event: CalendarEvent;
  onStatus?: () => void;
  onVisit?: () => void;
}

const timingTone: Record<string, string> = {
  start: 'border-blue-400',
  end: 'border-red-400',
  due: 'border-amber-400',
  single: 'border-blue-400',
};

const timingIcon: Record<string, React.ReactNode> = {
  start: <ArrowUpRight className="h-4 w-4 text-blue-700" aria-hidden />,
  end: <ArrowDownLeft className="h-4 w-4 text-rose-700" aria-hidden />,
  due: <Clock3 className="h-4 w-4 text-amber-700" aria-hidden />,
  single: <ArrowUpRight className="h-4 w-4 text-blue-700" aria-hidden />,
};

const chipClass = (eventType?: string) => {
  switch (eventType) {
    case 'start':
    case 'single':
      return 'bg-blue-100 text-blue-800';
    case 'end':
      return 'bg-red-100 text-red-800';
    case 'due':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-muted text-foreground';
  }
};

const statusColor = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'active': return 'bg-green-100 text-green-800 border-green-300';
    case 'completed': return 'bg-muted text-foreground border-border';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-muted text-foreground border-border';
  }
};

export const EventCard: React.FC<Props> = ({ event, onStatus, onVisit }) => {
  const timingLabel = event.eventType === 'start'
    ? 'Départ'
    : event.eventType === 'end'
      ? 'Retour'
      : event.eventType === 'due'
        ? 'Échéance'
        : 'Jour';
  const isDue = event.eventType === 'due';

  return (
    <div className={`mb-2 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm ${timingTone[event.eventType || 'start']}`}>
      <div className={`border-l-4 ${timingTone[event.eventType || 'start']}`}>
        <div className="flex items-center justify-between px-3 py-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-[11px] font-semibold ${chipClass(event.eventType)}`}>
            {timingIcon[event.eventType || 'start']}
            <span className="leading-none">{timingLabel}</span>
          </span>
          <span className={`rounded-full border px-2 py-1 text-[11px] font-medium leading-none ${statusColor(event.status)}`}>
            {statusToFr(event.status) || '—'}
          </span>
        </div>

        <div className="grid gap-2 px-3 pb-3 text-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Véhicule</span>
              {event.car?.license_plate && (
                <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {event.car.license_plate}
                </span>
              )}
            </div>
            <div className="text-base font-semibold leading-tight">{event.carModel?.brand || 'Marque inconnue'} {event.carModel?.model || 'Modèle inconnu'}</div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex flex-col text-left">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Client</span>
              <span className="font-medium leading-tight">{event.title || '—'}</span>
            </div>
            {event.client?.phone && (
              <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[12px] font-semibold text-blue-900">
                {event.client.phone}
              </div>
            )}
          </div>

          {event.note && (
            <div className="rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
              {event.note}
            </div>
          )}
        </div>

        {!isDue && (
          <div className="flex items-center justify-end gap-2 border-t bg-muted/50 px-3 py-2">
            {onStatus && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onStatus}
                aria-label="Modifier le statut"
              >
                <Settings size={16} />
              </Button>
            )}
            {onVisit && (
              <Button
                size="icon"
                className="h-8 w-8 bg-blue-500 text-white hover:bg-blue-600"
                onClick={onVisit}
                aria-label="Voir les détails"
              >
                <Eye size={16} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;