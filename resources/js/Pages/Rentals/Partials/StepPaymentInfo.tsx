import React, { useMemo, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReservationInfoCard from "@/components/rentals/ReservationInfoCard";
import {
  ReservationSummaryCard,
  ReservationSummaryItem,
} from "@/components/rentals/ReservationSummaryCard";
import { buildPricingSummaryItems } from "@/components/rentals/reservationSummaryUtils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

interface Photo { photo_path: string; }

interface CarModel {
  id: number;
  brand: string;
  model: string;
  initial_price_per_day?: number;
  price_per_day?: number;
  license_plate?: string;
  fuel_type?: string;
  transmission?: string;
  finish?: string;
  photos?: Photo[];
}

interface StepPaymentInfoProps {
  manual_mode: boolean;
  manual_total: number | null;
  advance_payment: number | null;
  payment_method: string;
  total_price: number;
  days: number;
  discount_per_day: number;
  global_discount: number | null;
  initial_price_per_day: number;
  price_per_day: number | null;
  reference: string;
  updateData: (key: any, value?: any) => void;
  errors?: Record<string, string>;
  car_model_id: string;
  carModels: CarModel[];
  start_date: string;
  end_date: string;
  pickup_time?: string;
  return_time?: string;
  selectedCar?: CarModel | null;
}

export default function StepPaymentInfo({
  manual_mode,
  manual_total,
  advance_payment,
  payment_method,
  total_price,
  days,
  discount_per_day,
  global_discount,
  initial_price_per_day,
  price_per_day,
  reference,
  updateData,
  errors = {},
  car_model_id,
  carModels,
  start_date,
  end_date,
  pickup_time,
  return_time,
  selectedCar: selectedCarProp = null,
}: StepPaymentInfoProps) {

  const selectedCar =
    selectedCarProp ?? carModels.find((m) => m.id === parseInt(car_model_id));

  const [priceInput, setPriceInput] = useState<string>("");
  const [priceError, setPriceError] = useState<string>("");

  const safeInitialPrice =
    Number(initial_price_per_day) ||
    Number(selectedCar?.initial_price_per_day) ||
    Number(selectedCar?.price_per_day) ||
    0;

  const safeDays = Math.max(0, Number(days) || 0);
  const safeGlobalDiscount = Math.max(0, Number(global_discount ?? 0));
  const safeAdvancePayment = Math.max(0, Number(advance_payment ?? 0));

  const minEffectivePrice = Math.max(0, Math.floor(safeInitialPrice * 0.5));

  /* ---------------- DEFAULT PAYMENT METHOD = ESPÈCES ---------------- */
  useEffect(() => {
    if (safeAdvancePayment > 0 && !payment_method) {
      updateData("payment_method", "cash");
    }
  }, [safeAdvancePayment]);

  /* ---------------- PRICE INPUT ---------------- */
  useEffect(() => {
    if (manual_mode) return;

    const hasUserValue =
      price_per_day !== undefined &&
      price_per_day !== null &&
      Number.isFinite(Number(price_per_day));

    const seed = hasUserValue ? String(price_per_day) : String(safeInitialPrice);
    setPriceInput(seed);
    setPriceError("");

    if (!hasUserValue) {
      updateData("price_per_day", Number(seed));
    }
  }, [selectedCar?.id, manual_mode]);

  const parsedPrice =
    priceInput.trim() === "" ? null : Number(priceInput);

  const safeEffectivePrice = useMemo(() => {
    if (manual_mode) return 0;

    if (parsedPrice === null || !Number.isFinite(parsedPrice)) {
      return Math.max(minEffectivePrice, safeInitialPrice);
    }
    return Math.max(parsedPrice, minEffectivePrice);
  }, [manual_mode, parsedPrice, minEffectivePrice, safeInitialPrice]);

  const subtotal = useMemo(() => safeEffectivePrice * safeDays, [safeEffectivePrice, safeDays]);

  const computedTotal = Math.max(subtotal - safeGlobalDiscount, 0);

  const effectiveTotal = manual_mode
    ? Math.max(0, Number(manual_total ?? total_price ?? 0))
    : computedTotal;

  const remainingToPay = Math.max(effectiveTotal - safeAdvancePayment, 0);

  const summaryItems: ReservationSummaryItem[] = buildPricingSummaryItems({
    manual: manual_mode,
    days: safeDays,
    currency: "DH",
    initialPricePerDay: safeInitialPrice,
    effectivePricePerDay: safeEffectivePrice,
    subtotal,
    globalDiscount: safeGlobalDiscount,
    totalAmount: effectiveTotal,
    estimatedPerDay:
      manual_mode && safeDays > 0
        ? Math.floor(Number(manual_total ?? total_price ?? 0) / safeDays)
        : null,
    advancePayment: safeAdvancePayment,
    remainingToPay,
    subtotalLabel: `Sous-total (${safeDays} × ${safeEffectivePrice.toFixed(0)})`,
    valueFormatter: (v) => `${v.toFixed(0)} DH`,
    classNames: {
      perDay: "font-medium text-blue-600",
      discount: "font-medium text-red-600",
      total: "font-semibold text-lg",
      advance: "font-medium text-green-600",
      remaining: "font-bold text-lg text-orange-600",
    },
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

      {/* LEFT SIDE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations de Paiement</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* MANUAL MODE TOGGLE */}
          <div className="flex items-center justify-between border rounded-md p-3">
            <div className="text-sm">
              <p className="font-medium">Définir le total manuellement</p>
              <p className="text-xs text-muted-foreground">
                Saisissez le total final sans recalcul.
              </p>
            </div>
            <input
              type="checkbox"
              checked={manual_mode}
              onChange={(e) => {
                const enabled = e.target.checked;
                updateData((prev: any) => ({
                  ...prev,
                  manual_mode: enabled,
                  manual_total: enabled
                    ? (prev.total_price ?? computedTotal)
                    : null,
                  total_price: enabled
                    ? (prev.total_price ?? computedTotal)
                    : computedTotal,
                }));
              }}
              className="w-5 h-5"
            />
          </div>

          {/* PRICE PER DAY */}
          {!manual_mode && (
            <div className="space-y-1">
              <Label className="text-sm">
                Prix effectif par jour (DH)
                <span className="block text-xs text-muted-foreground">
                  Min: {minEffectivePrice}
                </span>
              </Label>

              <Input
                type="number"
                value={priceInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setPriceInput(raw);

                  if (raw === "") {
                    setPriceError("");
                    updateData("price_per_day", null);
                    return;
                  }

                  const num = Number(raw);
                  if (!Number.isFinite(num)) {
                    setPriceError("Valeur invalide");
                    return;
                  }

                  if (num < minEffectivePrice) {
                    setPriceError(`Doit être ≥ ${minEffectivePrice} DH`);
                  } else {
                    setPriceError("");
                  }

                  updateData("price_per_day", num);
                }}
                onBlur={() => {
                  if (priceInput.trim() === "") {
                    const val = String(minEffectivePrice);
                    setPriceInput(val);
                    setPriceError("");
                    updateData("price_per_day", minEffectivePrice);
                  }
                }}
              />

              {(priceError || errors.price_per_day) && (
                <p className="text-xs text-red-600">
                  {priceError || errors.price_per_day}
                </p>
              )}
            </div>
          )}

          {/* GLOBAL DISCOUNT */}
          {!manual_mode && (
            <div className="space-y-1">
              <Label className="text-sm">
                Remise globale (DH)
                <span className="block text-xs text-muted-foreground">
                  Sous-total: {subtotal} DH
                </span>
              </Label>

              <Input
                type="number"
                value={global_discount ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    updateData("global_discount", null);
                    return;
                  }
                  const parsed = Math.max(0, Number(raw) || 0);
                  updateData("global_discount", Math.min(parsed, subtotal));
                }}
              />
            </div>
          )}

          {/* MANUAL TOTAL */}
          {manual_mode && (
            <div className="space-y-1">
              <Label className="text-sm">Total (DH)</Label>
              <Input
                type="number"
                value={manual_total ?? ""}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  updateData((prev: any) => ({
                    ...prev,
                    manual_total: val,
                    total_price: val,
                  }));
                }}
              />
            </div>
          )}

          {/* ADVANCE */}
          <div className="space-y-1">
            <Label className="text-sm">
              Avance (DH)
              <span className="block text-xs text-muted-foreground">
                Max: {effectiveTotal} DH
              </span>
            </Label>

            <ButtonGroup className="w-full">
              <Input
                type="number"
                className="h-10"
                value={advance_payment ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;

                  if (raw === "") {
                    updateData("advance_payment", null);
                    updateData("payment_method", "");
                    updateData("reference", "");
                    return;
                  }

                  const parsed = Math.max(0, Number(raw) || 0);
                  const finalValue = Math.min(parsed, effectiveTotal);

                  updateData("advance_payment", finalValue);

                  if (finalValue === 0) {
                    updateData("payment_method", "");
                    updateData("reference", "");
                  }
                }}
              />

              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  updateData("advance_payment", effectiveTotal);
                  updateData("payment_method", "cash");
                  updateData("reference", "");
                }}
              >
                Payer total
              </Button>
            </ButtonGroup>
          </div>


          {/* PAYMENT METHOD */}
          {safeAdvancePayment > 0 && (
            <div className="space-y-1">
              <Label className="text-sm">Méthode de paiement</Label>

              <Select
                value={payment_method || ""}
                onValueChange={(value) => {
                  updateData("payment_method", value);
                  if (!["virement", "cheque"].includes(value)) {
                    updateData("reference", "");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Méthodes disponibles</SelectLabel>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* REFERENCE */}
          {["virement", "cheque"].includes(payment_method) &&
            safeAdvancePayment > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">Référence</Label>
                <Input
                  value={reference}
                  onChange={(e) => updateData("reference", e.target.value)}
                  placeholder="Numéro de chèque ou de virement"
                />
              </div>
            )}

        </CardContent>
      </Card>

      {/* RIGHT SIDE */}
      <div className="space-y-4 h-fit">
        <ReservationInfoCard
          car={selectedCar}
          startDate={start_date}
          endDate={end_date}
          pickupTime={pickup_time}
          returnTime={return_time}
          formatDates
        />

        <ReservationSummaryCard items={summaryItems} />
      </div>
    </div>
  );
}