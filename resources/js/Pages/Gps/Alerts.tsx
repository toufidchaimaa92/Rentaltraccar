import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Gauge, MapPin } from "lucide-react";

const refreshIntervalMs = 30000;

const typeMeta = {
  deviceOverspeed: {
    label: "Excès de vitesse",
    icon: Gauge,
    color: "text-orange-600",
  },
  geofenceEnter: {
    label: "Entrée zone",
    icon: MapPin,
    color: "text-green-600",
  },
  geofenceExit: {
    label: "Sortie zone",
    icon: MapPin,
    color: "text-red-600",
  },
};

type AlertItem = {
  rental_id: number;
  car_id: number;
  license_plate: string;
  type: keyof typeof typeMeta;
  message: string;
  event_time: string | null;
};

export default function Alerts({ auth }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/traccar/alerts");
      if (!response.ok) {
        throw new Error("Failed to load alerts");
      }
      const data = (await response.json()) as AlertItem[];
      setAlerts(data);
    } catch (err) {
      setError("Impossible de charger les alertes GPS.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const intervalId = window.setInterval(fetchAlerts, refreshIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [fetchAlerts]);

  const orderedAlerts = useMemo(
    () =>
      [...alerts].sort((a, b) =>
        String(b.event_time ?? "").localeCompare(String(a.event_time ?? ""))
      ),
    [alerts]
  );

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="GPS Alerts" />

      <Card>
        <CardHeader>
          <CardTitle>GPS Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>Alertes Traccar (lecture seule) pour les locations actives.</span>
            <span>Actualisation toutes les 30 secondes.</span>
          </div>

          {error ? (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading && !orderedAlerts.length ? (
            <div className="mt-4 text-sm text-muted-foreground">Chargement des alertes...</div>
          ) : null}

          {!loading && orderedAlerts.length === 0 ? (
            <div className="mt-4 text-sm text-muted-foreground">
              Aucune alerte GPS disponible pour le moment.
            </div>
          ) : null}

          {orderedAlerts.length > 0 ? (
            <div className="mt-6 space-y-3">
              {orderedAlerts.map((alert, index) => {
                const meta = typeMeta[alert.type] ?? {
                  label: alert.type,
                  icon: AlertTriangle,
                  color: "text-muted-foreground",
                };
                const Icon = meta.icon;

                return (
                  <div
                    key={`${alert.rental_id}-${alert.car_id}-${alert.event_time ?? index}`}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className={`mt-1 ${meta.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{alert.license_plate || "—"}</span>
                        <span className="text-xs text-muted-foreground">Location #{alert.rental_id}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{meta.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {alert.message} • {alert.event_time ?? "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  );
}
