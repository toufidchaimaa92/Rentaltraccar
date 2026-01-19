import "leaflet/dist/leaflet.css";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultCenter: [number, number] = [33.59, -7.62];

const markerIconDefault = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type CarPosition = {
  id: number | string;
  label: string;
  brandModel?: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  updated_at?: string | null;
  statusText?: string;
  gpsStatusText?: string;
};

interface CarPositionsMapProps {
  positions: CarPosition[];
  heightClassName?: string;
  selectedId?: number | string | null;
  onSelect?: (id: number | string) => void;
  isInteractive?: boolean;
}

export default function CarPositionsMap({
  positions,
  heightClassName = "h-[520px]",
  selectedId,
  onSelect,
  isInteractive = true,
}: CarPositionsMapProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({});
  const lastSelectedId = useRef<number | string | null>(null);
  const center = useMemo<[number, number]>(() => {
    if (positions.length > 0) {
      return [positions[0].latitude, positions[0].longitude];
    }
    return defaultCenter;
  }, [positions]);

  const positionMap = useMemo(() => {
    const map = new Map<number | string, CarPosition>();
    positions.forEach((position) => {
      map.set(position.id, position);
    });
    return map;
  }, [positions]);

  function SelectedMarkerHandler() {
    const map = useMap();

    useEffect(() => {
      if (!selectedId) {
        lastSelectedId.current = null;
        return;
      }

      if (selectedId === lastSelectedId.current) {
        return;
      }

      const selectedPosition = positionMap.get(selectedId);
      if (!selectedPosition) {
        return;
      }

      lastSelectedId.current = selectedId;
      map.flyTo([selectedPosition.latitude, selectedPosition.longitude], 16, {
        animate: true,
      });

      const marker = markerRefs.current[String(selectedId)];
      marker?.openPopup();
    }, [map, positionMap, selectedId]);

    return null;
  }

  return (
    <div
      className={`relative z-0 w-full overflow-hidden rounded-lg border ${heightClassName} ${
        isInteractive ? "" : "pointer-events-none"
      }`}
      aria-hidden={!isInteractive}
    >
      <MapContainer center={center} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SelectedMarkerHandler />

        {positions.map((position) => (
          <Marker
            key={position.id}
            position={[position.latitude, position.longitude]}
            icon={markerIconDefault}
            ref={(marker) => {
              if (marker) {
                markerRefs.current[String(position.id)] = marker;
              }
            }}
            eventHandlers={{
              click: () => onSelect?.(position.id),
            }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="text-sm font-semibold">{position.label || "—"}</div>
                <div className="text-muted-foreground">{position.brandModel || "—"}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {position.statusText ?? "—"}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {position.gpsStatusText ?? "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-muted-foreground">
                  <span>Vitesse: {position.speed ?? 0} km/h</span>
                  <span>
                    Maj:{" "}
                    {position.updated_at
                      ? new Date(position.updated_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
