import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ReservationCarInfo = {
  brand?: string;
  model?: string;
  finish?: string;
  fuel_type?: string;
  transmission?: string;
  license_plate?: string;
  photo_path?: string | null;
  photos?: { photo_path: string }[];
};

type ReservationInfoCardProps = {
  car?: ReservationCarInfo | null;
  startDate?: string | null;
  endDate?: string | null;
  pickupTime?: string | null;
  returnTime?: string | null;
  showDays?: boolean;
  days?: number | string | null;
  daysLabel?: string;
  formatDates?: boolean;
  variant?: "blue" | "default";
  className?: string;
  title?: React.ReactNode;
  titleClassName?: string;
  contentClassName?: string;
  headerActions?: React.ReactNode;
  fallbackImage?: string;
};

/* ----------------------------------- */
/* IMAGE SRC                           */
/* ----------------------------------- */
const getImageSrc = (car?: ReservationCarInfo | null, fallback?: string) => {
  const raw = car?.photo_path ?? car?.photos?.[0]?.photo_path;
  if (raw) return raw.startsWith("http") ? raw : `/storage/${raw}`;
  return fallback;
};

export function ReservationInfoCard({
  car,
  startDate,
  endDate,
  pickupTime,
  returnTime,
  showDays = false,
  days,
  daysLabel = "Nombre de jours :",
  formatDates = false,
  variant = "blue",
  className,
  title = "Informations de Réservation",
  titleClassName,
  contentClassName,
  headerActions,
  fallbackImage = "/storage/car_model_photos/default.jpg",
}: ReservationInfoCardProps) {
  const imageSrc = getImageSrc(car, fallbackImage);

  const formatDate = (date?: string | null) => {
    if (!date) return "--";
    if (!formatDates) return date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toLocaleDateString("fr-FR");
  };

  const brandModel = [car?.brand, car?.model].filter(Boolean).join(" ").trim();

  const carTitle = [
    brandModel || "--",
    car?.license_plate ? `• ${car.license_plate}` : "",
  ]
    .join(" ")
    .trim();

  const blueStyle = {
    wrapper: "bg-blue-50/70 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/40",
    title: "text-blue-900 dark:text-blue-200",
    text: "text-blue-800 dark:text-blue-300",
  };

  const defaultStyle = {
    wrapper: "bg-card/70 dark:bg-card/40 backdrop-blur-lg border-border/60",
    title: "text-foreground",
    text: "text-muted-foreground dark:text-foreground/80",
  };

  const palette = variant === "blue" ? blueStyle : defaultStyle;
  const detailsClass = cn("text-xs leading-relaxed", palette.text);

  /* ----------------------------------- */
  /* COMPONENT UI                        */
  /* ----------------------------------- */
  return (
    <Card
      className={cn(
        "rounded-2xl overflow-hidden border shadow-[0_4px_18px_rgba(0,0,0,0.08)]",
        "transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)]",
        palette.wrapper,
        className
      )}
    >
      {/* HEADER */}
      <CardHeader className="bg-gradient-to-br from-background/20 to-background/5  rounded-t-2xl">
        <div className="flex items-start justify-between">
          <CardTitle
            className={cn(
              "text-base font-semibold tracking-wide",
              palette.title,
              titleClassName
            )}
          >
            {title}
          </CardTitle>
          {headerActions}
        </div>
      </CardHeader>

      {/* CONTENT */}
      <CardContent
        className={cn("space-y-4", palette.text, contentClassName)}
      >
        {/* IMAGE + CAR INFO */}
        <div className="flex items-start gap-3">
          {imageSrc ? (
            <div className="relative">
              <img
                src={imageSrc}
                alt={brandModel || "Image"}
                loading="lazy"
                className="w-24 h-20 object-cover rounded-lg shadow-md border border-border/50 "
              />
              <div className="absolute inset-0 rounded-lg bg-black/0 hover:bg-black/10 transition"></div>
            </div>
          ) : (
            <div className="w-24 h-20 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
              Aucune image
            </div>
          )}

          <div className="flex flex-col justify-center">
            <p className="font-semibold text-sm text-foreground dark:text-white/90">
              {carTitle}
            </p>

            <p className={detailsClass}>
              {car?.finish ?? "--"} • {car?.fuel_type ?? "--"} • {car?.transmission ?? "--"}
            </p>
          </div>
        </div>

        {/* DATES */}
{/* DATES */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <p className="font-semibold text-sm text-foreground dark:text-white/90">Du :</p>

    {/* Normal date color */}
    <p className="text-foreground dark:text-white">
      {formatDate(startDate)}
    </p>

    {pickupTime && <p className={detailsClass}>à {pickupTime}</p>}
  </div>

  <div>
    <p className="font-semibold text-sm text-foreground dark:text-white/90">Au :</p>

    {/* Normal date color */}
    <p className="text-foreground dark:text-white">
      {formatDate(endDate)}
    </p>

    {returnTime && <p className={detailsClass}>à {returnTime}</p>}
  </div>
</div>


        {/* DAYS */}
        {showDays && (
          <div className="pt-1 text-sm">
            <span className="font-medium text-foreground dark:text-white">
              {daysLabel}
            </span>{" "}
            {days ?? "--"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReservationInfoCard;
