import "leaflet/dist/leaflet.css";

import React, { useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";

const defaultCenter: [number, number] = [33.59, -7.62];

type TripPoint = {
  latitude: number;
  longitude: number;
  time?: string | null;
};

interface TripHistoryMapProps {
  points: TripPoint[];
  heightClassName?: string;
  isInteractive?: boolean;
}

export default function TripHistoryMap({
  points,
  heightClassName = "h-[420px]",
  isInteractive = true,
}: TripHistoryMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (points.length > 0) {
      return [points[0].latitude, points[0].longitude];
    }
    return defaultCenter;
  }, [points]);

  const polylinePositions = useMemo(() => points.map((point) => [point.latitude, point.longitude]) as [number, number][], [points]);

  const start = points[0];
  const end = points.length > 1 ? points[points.length - 1] : points[0];

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

        {polylinePositions.length > 1 && <Polyline positions={polylinePositions} pathOptions={{ color: "#2563eb" }} />}

        {start ? (
          <CircleMarker center={[start.latitude, start.longitude]} radius={6} pathOptions={{ color: "#16a34a" }}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-xs">Début {start.time ?? ""}</div>
            </Tooltip>
          </CircleMarker>
        ) : null}

        {end ? (
          <CircleMarker center={[end.latitude, end.longitude]} radius={6} pathOptions={{ color: "#dc2626" }}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-xs">Fin {end.time ?? ""}</div>
            </Tooltip>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  );
}
