import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { MapPin, SearchIcon, Settings2 } from "lucide-react";
import CarPositionsMap from "@/components/gps/CarPositionsMap";
const refreshIntervalMs = 30000;

type CarPosition = {
  car_id: number;
  license_plate: string;
  car_brand?: string | null;
  car_model?: string | null;
  latitude: number;
  longitude: number;
  speed: number;
  updated_at: string | null;
};

export default function LiveMap({ auth }) {
  const [positions, setPositions] = useState<CarPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showRented, setShowRented] = useState(true);
  const [showAvailable, setShowAvailable] = useState(true);
  const [showGpsActive, setShowGpsActive] = useState(true);
  const [showGpsOffline, setShowGpsOffline] = useState(true);
  const [showMoving, setShowMoving] = useState(true);
  const [showStopped, setShowStopped] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchPositions = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/traccar/cars/positions");
      if (!response.ok) {
        throw new Error("Failed to load positions");
      }
      const data = (await response.json()) as CarPosition[];
      setPositions(data);
    } catch (err) {
      setError("Impossible de charger les positions GPS.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
    const intervalId = window.setInterval(fetchPositions, refreshIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [fetchPositions]);

  const gpsThresholdMs = 10 * 60 * 1000;

  const filteredPositions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return positions.filter((position) => {
      const gpsActive =
        !!position.updated_at &&
        Date.now() - new Date(position.updated_at).getTime() <= gpsThresholdMs;
      const moving = (position.speed ?? 0) > 0;
      const rented = gpsActive;

      const matchesSearch =
        !query ||
        position.license_plate?.toLowerCase().includes(query) ||
        `${position.car_brand ?? ""} ${position.car_model ?? ""}`.toLowerCase().includes(query);

      const matchesRented = (showRented && rented) || (showAvailable && !rented);
      const matchesGps = (showGpsActive && gpsActive) || (showGpsOffline && !gpsActive);
      const matchesMotion = (showMoving && moving) || (showStopped && !moving);

      return matchesSearch && matchesRented && matchesGps && matchesMotion;
    });
  }, [
    positions,
    search,
    showRented,
    showAvailable,
    showGpsActive,
    showGpsOffline,
    showMoving,
    showStopped,
    gpsThresholdMs,
  ]);

  const mapPositions = useMemo(
    () =>
      filteredPositions.map((position) => {
        const gpsActive =
          !!position.updated_at &&
          Date.now() - new Date(position.updated_at).getTime() <= gpsThresholdMs;
        const moving = (position.speed ?? 0) > 0;
        const brandModel = `${position.car_brand ?? ""} ${position.car_model ?? ""}`.trim();
        return {
          id: position.car_id,
          label: position.license_plate,
          brandModel,
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed,
          updated_at: position.updated_at,
          statusText: moving ? "En mouvement" : "À l’arrêt",
          gpsStatusText: gpsActive ? "GPS actif" : "GPS hors ligne",
        };
      }),
    [filteredPositions, gpsThresholdMs]
  );

  useEffect(() => {
    if (filteredPositions.length === 1) {
      setSelectedId(filteredPositions[0].car_id);
    }
  }, [filteredPositions]);

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="GPS Live Map" />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              GPS Live Map
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonGroup className="w-full md:w-[360px]">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un véhicule"
                  className="h-11"
                />

                <Button
                  variant="outline"
                  aria-label="Search"
                  className="h-11 px-3">
                  <SearchIcon className="h-4 w-4 text-primary" />
                </Button>
              </ButtonGroup>


              <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden md:inline">Filtres</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle>Filtres</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <Checkbox checked={showRented} onCheckedChange={() => setShowRented(!showRented)} />
                      En location
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={showAvailable} onCheckedChange={() => setShowAvailable(!showAvailable)} />
                      Disponible
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={showGpsActive} onCheckedChange={() => setShowGpsActive(!showGpsActive)} />
                      GPS actif
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={showGpsOffline} onCheckedChange={() => setShowGpsOffline(!showGpsOffline)} />
                      GPS hors ligne
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={showMoving} onCheckedChange={() => setShowMoving(!showMoving)} />
                      En mouvement
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={showStopped} onCheckedChange={() => setShowStopped(!showStopped)} />
                      À l’arrêt
                    </label>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <CardDescription>Données rafraîchies toutes les 30 secondes.</CardDescription>
        </CardHeader>
        <CardContent>

          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading && !positions.length ? (
            <div className="mt-4 text-sm text-muted-foreground">Chargement des positions...</div>
          ) : null}

          {!loading && positions.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">
              Aucun véhicule avec GPS n&apos;est disponible pour le moment.
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <CarPositionsMap
              positions={mapPositions}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(Number(id))}
              isInteractive={!filtersOpen}
            />
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium">Véhicules</div>
              <div className="mt-3 space-y-2 text-sm">
                {filteredPositions.map((position) => {
                  const gpsActive =
                    !!position.updated_at &&
                    Date.now() - new Date(position.updated_at).getTime() <= gpsThresholdMs;
                  const moving = (position.speed ?? 0) > 0;
                  const isSelected = selectedId === position.car_id;
                  const brandModel = `${position.car_brand ?? ""} ${position.car_model ?? ""}`.trim();

                  return (
                    <button
                      key={position.car_id}
                      type="button"
                      className={`flex w-full items-start justify-between rounded-md border px-3 py-2 text-left ${isSelected ? "border-primary bg-primary/5" : "border-transparent"
                        }`}
                      onClick={() => setSelectedId(position.car_id)}
                    >
                      <div>
                        <div className="font-medium">{position.license_plate || "—"}</div>
                        <div className="text-xs text-muted-foreground">{brandModel || "—"}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {moving ? "En mouvement" : "À l’arrêt"} • {gpsActive ? "GPS actif" : "GPS hors ligne"}
                      </div>
                    </button>
                  );
                })}
                {!filteredPositions.length && !loading ? (
                  <div className="text-xs text-muted-foreground">Aucun véhicule ne correspond aux filtres.</div>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
