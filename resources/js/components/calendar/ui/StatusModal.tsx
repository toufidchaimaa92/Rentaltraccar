import React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarEvent, CALENDAR_STATUS, statusToFr } from '../../calendar/calendarHelpers';
import { Separator } from '@/components/ui/separator';

interface Props {
  open: boolean;
  event: CalendarEvent | null;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  availableCars: any[];
  selectedCarId: string | null;
  onCarChange: (id: string | null) => void;
  onClose: () => void;
  onUpdate: (eventId: string, status: string) => void;
  errorMessage?: string | null;
}

export const StatusModal: React.FC<Props> = ({
  open,
  event,
  selectedStatus,
  onStatusChange,
  availableCars,
  selectedCarId,
  onCarChange,
  onClose,
  onUpdate,
  errorMessage,
}) => (
  <Dialog open={open} onOpenChange={(openState) => { if (!openState) onClose(); }}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Modifier le statut</DialogTitle>
        <DialogDescription>
          Choisissez un nouveau statut pour cette location.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {CALENDAR_STATUS.map((s) => (
            <Button
              key={s.value}
              variant={selectedStatus === s.value ? 'default' : 'outline'}
              onClick={() => onStatusChange(s.value)}
            >
              {statusToFr(s.value)}
            </Button>
          ))}
        </div>

        {selectedStatus === 'active' && (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-semibold">Sélectionner une voiture disponible</p>
            <Separator />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {availableCars.map((car) => (
                <button
                  key={car.id}
                  type="button"
                  className={`rounded border p-2 text-left text-sm ${selectedCarId === car.id ? 'border-blue-500 bg-blue-50' : 'border-border bg-card'}`}
                  onClick={() => onCarChange(car.id)}
                >
                  <p className="font-semibold">{car.make} {car.model}</p>
                  <p className="text-muted-foreground">{car.license_plate}</p>
                </button>
              ))}
              {availableCars.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune voiture disponible.</p>
              )}
            </div>
          </div>
        )}

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Annuler</Button>
        </DialogClose>
        {event && (
          <Button onClick={() => onUpdate(event.id, selectedStatus)}>
            Valider
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default StatusModal;
