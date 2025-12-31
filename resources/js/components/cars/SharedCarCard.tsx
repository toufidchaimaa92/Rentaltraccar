import React, { memo } from "react";
import { Fuel, Settings, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Photo {
  id?: number;
  photo_path?: string;
  order?: number;
}

export interface CarModel {
  id: number | string;
  brand: string;
  model: string;
  fuel_type?: string;
  price_per_day?: number;
  transmission?: string;
  finish?: string;
  photos?: Photo[];
  imageSrc?: string;
}

export interface SharedCarCardProps {
  model: CarModel;
  isSelected?: boolean;
  onClick: () => void;
  showPrice?: boolean;
}

const FALLBACK_IMG = "/storage/car_model_photos/default.jpg";

const formatTransmission = (value?: string) => {
  if (!value) return "N/A";
  const v = value.toLowerCase();
  if (v.includes("auto")) return "AUTO";
  if (v.includes("manu")) return "MANU";
  return value.toUpperCase();
};

const resolveImageSrc = (model: CarModel) => {
  if (model.imageSrc) return model.imageSrc;
  const raw = model.photos?.[0]?.photo_path;
  if (!raw) return FALLBACK_IMG;
  return raw.startsWith("http") ? raw : `/storage/${raw}`;
};

const SharedCarCard = memo(
  ({
    model,
    isSelected = false,
    onClick,
    showPrice = true,
  }: SharedCarCardProps) => {
    const transmissionShort = formatTransmission(model.transmission);
    const imageSrc = resolveImageSrc(model);

    return (
      <div
        onClick={onClick}
        className={[
          "group relative cursor-pointer overflow-hidden rounded-2xl",
          "border bg-card/80 backdrop-blur-sm",
          "transition-all duration-200",
          "hover:-translate-y-0.5 hover:shadow-md",
          isSelected
            ? "border-green-500 ring-2 ring-green-400/70"
            : "border-border",
        ].join(" ")}
      >
        {isSelected && (
          <div className="absolute top-2 right-2 z-10">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        )}

        <div className="relative w-full h-40 overflow-hidden">
          <img
            src={imageSrc}
            alt={`${model.brand} ${model.model}`}
            loading="lazy"
            onError={(e) =>
              ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)
            }
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-4 space-y-3">
          <h3 className="text-base font-semibold leading-tight capitalize">
            {model.brand} {model.model}
          </h3>

          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-h-[28px]">
              {model.fuel_type && (
                <Badge className="uppercase bg-black/40 border-white/20 text-white backdrop-blur-sm flex items-center gap-1">
                  <Fuel className="w-3 h-3 opacity-80" />
                  {model.fuel_type}
                </Badge>
              )}

              <Badge className="uppercase bg-black/40 border-white/20 text-white backdrop-blur-sm flex items-center gap-1">
                <Settings className="w-3 h-3 opacity-80" />
                {transmissionShort}
              </Badge>
            </div>

            {showPrice && model.price_per_day && (
              <Badge className="bg-emerald-600 text-white font-semibold">
                {model.price_per_day} DH / J
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }
);

SharedCarCard.displayName = "SharedCarCard";

export default SharedCarCard;
