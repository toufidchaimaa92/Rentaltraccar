import React, { useCallback, useEffect, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings2, ChevronLeft, MapPin } from "lucide-react";
import TripHistoryMap from "@/components/gps/TripHistoryMap";

interface Props {
  auth: { user: any };
  rentalId: number;
  status: string;
  car?: {
    brand?: string;
    model?: string;
    license_plate?: string;
  } | null;
}

type RentalTripHistory = {
  rental_id: number;
  car_id: number;
  license_plate: string;
  from: string | null;
  to: string | null;
  rental_start: string | null;
  rental_end: string | null;
  positions: {
    latitude: number;
    longitude: number;
    speed: number;
    time: string | null;
  }[];
};

export default function TripHistory({ auth, rentalId, car }: Props) {
  const [tripHistory, setTripHistory] = useState<RentalTripHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeMode, setRangeMode] = useState<'today' | 'yesterday' | 'last7' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchTripHistory = useCallback(async (params?: { from?: string; to?: string }) => {
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params?.from && params?.to) {
        query.set('from', params.from);
        query.set('to', params.to);
      }

      const response = await fetch(
        `/api/traccar/rentals/${rentalId}/trip-history${query.toString() ? `?${query.toString()}` : ''}`
      );

      if (response.status === 403) {
        setTripHistory(null);
        setError("Historique disponible uniquement pour les locations actives ou terminées.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load trip history");
      }

      const data = (await response.json()) as RentalTripHistory;
      setTripHistory(data);

      if (!params?.from && !params?.to) {
        setCustomFrom(data.rental_start ? data.rental_start.slice(0, 10) : '');
        setCustomTo(data.rental_end ? data.rental_end.slice(0, 10) : '');
      }
    } catch (err) {
      setError("Impossible de charger l’historique du trajet.");
    } finally {
      setLoading(false);
    }
  }, [rentalId]);

  const formatDateValue = (date: Date) => date.toISOString().slice(0, 10);

  const applyQuickRange = (mode: 'today' | 'yesterday' | 'last7') => {
    setRangeMode(mode);
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    if (mode === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1);
      endDate.setDate(endDate.getDate() - 1);
    }

    if (mode === 'last7') {
      startDate.setDate(startDate.getDate() - 6);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    setCustomFrom(formatDateValue(startDate));
    setCustomTo(formatDateValue(endDate));

    fetchTripHistory({
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    });
    setFiltersOpen(false);
  };

  const applyCustomRange = () => {
    setRangeMode('custom');

    if (!customFrom || !customTo) {
      return;
    }

    const start = new Date(`${customFrom}T00:00:00`);
    const end = new Date(`${customTo}T23:59:59`);

    fetchTripHistory({
      from: start.toISOString(),
      to: end.toISOString(),
    });
    setFiltersOpen(false);
  };

  useEffect(() => {
    applyQuickRange('today');
  }, []);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Historique du trajet" />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={route("rentals.show", rentalId)}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="hidden md:block text-2xl font-semibold">Historique du trajet</div>
          </div>
          {car ? (
            <div className="flex flex-col items-end text-sm">
              <span className="font-medium">
                {car.brand} {car.model}
              </span>
              <span className="text-muted-foreground">{car.license_plate || "—"}</span>
            </div>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Historique du trajet
          </CardTitle>
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden md:inline">Filtrer</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Filtrer</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={rangeMode === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyQuickRange('today')}
                >
                  Aujourd’hui
                </Button>
                <Button
                  variant={rangeMode === 'yesterday' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyQuickRange('yesterday')}
                >
                  Hier
                </Button>
                <Button
                  variant={rangeMode === 'last7' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => applyQuickRange('last7')}
                >
                  7 derniers jours
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <input
                  type="date"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
                <input
                  type="date"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
                <Button size="sm" variant="outline" onClick={applyCustomRange}>
                  Appliquer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading && !tripHistory ? (
            <div className="mt-4 text-sm text-muted-foreground">Chargement de l’historique...</div>
          ) : null}

          {tripHistory && tripHistory.positions.length === 0 && !loading ? (
            <div className="mt-4 text-sm text-muted-foreground">
              Aucun trajet pour cette période.
            </div>
          ) : null}

          {tripHistory && tripHistory.positions.length > 0 ? (
            <div className="mt-6 space-y-3">
              <TripHistoryMap points={tripHistory.positions} isInteractive={!filtersOpen} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
