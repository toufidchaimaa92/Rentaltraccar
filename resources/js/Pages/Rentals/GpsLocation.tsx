import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Route } from "lucide-react";
import CarPositionsMap from "@/components/gps/CarPositionsMap";

interface Props {
  auth: { user: any };
  rentalId: number;
  car?: {
    brand?: string;
    model?: string;
    license_plate?: string;
  } | null;
}

type RentalGpsPosition = {
  rental_id: number;
  car_id: number;
  license_plate: string;
  latitude: number;
  longitude: number;
  speed: number;
  updated_at: string | null;
};

export default function GpsLocation({ auth, rentalId, car }: Props) {
  const [position, setPosition] = useState<RentalGpsPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosition = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/traccar/rentals/${rentalId}/position`);

      if (response.status === 403) {
        setPosition(null);
        setError("GPS disponible uniquement pour les locations actives.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load position");
      }

      const data = (await response.json()) as RentalGpsPosition | null;
      setPosition(data);
    } catch (err) {
      setError("Impossible de charger la localisation GPS.");
    } finally {
      setLoading(false);
    }
  }, [rentalId]);

  useEffect(() => {
    fetchPosition();
    const intervalId = window.setInterval(fetchPosition, 30000);
    return () => window.clearInterval(intervalId);
  }, [fetchPosition]);

  const mapPositions = useMemo(
    () =>
      position
        ? [
            {
              id: position.car_id,
              label: position.license_plate,
              latitude: position.latitude,
              longitude: position.longitude,
              speed: position.speed,
              updated_at: position.updated_at,
            },
          ]
        : [],
    [position]
  );

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Localisation du véhicule" />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href={route("rentals.show", rentalId)}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="hidden md:block text-2xl font-semibold">Localisation du véhicule</div>
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
            Localisation du véhicule
          </CardTitle>
          <Link href={route("rentals.trip-history", rentalId)}>
            <Button variant="ghost" size="sm" className="gap-2">
              <Route className="h-4 w-4" />
              <span className="hidden md:inline">Historique</span>
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading && !position ? (
            <div className="mt-4 text-sm text-muted-foreground">Chargement de la localisation...</div>
          ) : null}

          {!loading && !position ? (
            <div className="mt-4 text-sm text-muted-foreground">
              GPS non disponible pour ce véhicule.
            </div>
          ) : null}

          {position ? (
            <div className="mt-6">
              <CarPositionsMap positions={mapPositions} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
