import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import EventCard from './EventCard';
import { CalendarEvent } from '../../calendar/calendarHelpers';

interface Tone {
  glyph?: string;
  icon?: React.ReactNode;
  headerBg: string;
  text: string;
  iconBg: string;
  countBg: string;
}

interface Props {
  title: string;
  tone: Tone;
  items: CalendarEvent[];
  emptyLabel: string;
  onStatus?: (event: CalendarEvent) => void;
  onVisit?: (event: CalendarEvent) => void;
}

export const SectionPanel: React.FC<Props> = ({ title, tone, items, emptyLabel, onStatus, onVisit }) => (
  <Card className="overflow-hidden border border-border shadow-sm">
    <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${tone.headerBg} ${tone.text}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tone.iconBg}`}>
          {tone.icon ? (
            tone.icon
          ) : (
            <span className="text-lg" aria-hidden>{tone.glyph}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{title}</p>
        </div>
      </div>
      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.countBg}`}>
        {items.length} événement{items.length !== 1 ? 's' : ''}
      </div>
    </div>
    <CardContent className="space-y-2 bg-card">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        items.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onStatus={onStatus ? () => onStatus(event) : undefined}
            onVisit={onVisit ? () => onVisit(event) : undefined}
          />
        ))
      )}
    </CardContent>
  </Card>
);

export default SectionPanel;
