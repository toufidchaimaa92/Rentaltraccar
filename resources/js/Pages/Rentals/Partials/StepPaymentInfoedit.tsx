import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReservationInfoCard from "@/components/rentals/ReservationInfoCard";
import ReservationSummaryCard, { ReservationSummaryItem } from "@/components/rentals/ReservationSummaryCard";
import { buildPricingSummaryItems } from "@/components/rentals/reservationSummaryUtils";

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
  // ✅ Admin-editable pricing
  manual_mode: boolean;            // toggle
  manual_total: number | null;     // value (only used if manual_mode = true)
  total_price: number;
  days: number | string;
  global_discount: number | string;
  initial_price_per_day: number | string;
  price_per_day: number | string;

  // Optional payment fields (used in summary calculations)
  advance_payment?: number | string;
  payment_method?: string;
  reference?: string;

  // Supporting
  updateData: (key: any, value?: any) => void; // inertia setter (setData from useForm)
  errors?: Record<string, string>;
  car_model_id: string;
  carModels: CarModel[];
  start_date?: string;
  end_date?: string;
  pickup_time?: string;
  return_time?: string;

  // Old values (to display diffs)
  old_price_per_day?: number | null;
  old_total_price?: number | null;
}

export default function StepPaymentInfoedit({
  manual_mode,
  manual_total,
  total_price,
  days,
  global_discount,
  initial_price_per_day,
  price_per_day,
  advance_payment = 0,
  payment_method = "",
  reference = "",
  updateData,
  errors = {},
  car_model_id,
  carModels,
  start_date,
  end_date,
  pickup_time,
  return_time,
  old_price_per_day,
  old_total_price,
}: StepPaymentInfoProps) {
  const selectedCar = carModels.find((m) => m.id === parseInt(car_model_id));
  const firstPhotoPath = selectedCar?.photos?.[0]?.photo_path;
  const imageSrc = firstPhotoPath ? `/storage/${firstPhotoPath}` : null;

  // ---------- Number helpers (preserve 0; avoid || fallbacks) ----------
  const toNum = (x: any): number => {
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
  };

  // ---------- Safe numeric values (do NOT break when value is "0" or string) ----------
  const safeInitialPrice =
    Number.isFinite(toNum(initial_price_per_day)) && toNum(initial_price_per_day) >= 0
      ? toNum(initial_price_per_day)
      : (Number.isFinite(toNum(selectedCar?.initial_price_per_day))
          ? toNum(selectedCar?.initial_price_per_day)
          : (Number.isFinite(toNum(selectedCar?.price_per_day))
              ? toNum(selectedCar?.price_per_day)
              : 0));

  const safeDays      = Number.isFinite(toNum(days)) ? toNum(days) : 0;
  const safePPD       = Number.isFinite(toNum(price_per_day)) ? toNum(price_per_day) : safeInitialPrice;
  const safeDiscount  = Math.max(0, Number.isFinite(toNum(global_discount)) ? toNum(global_discount) : 0);
  const safeAdvance   = Math.max(0, Number.isFinite(toNum(advance_payment)) ? toNum(advance_payment) : 0);

  // ---------- Computations ----------
  const subtotal       = Math.max(0, safePPD * safeDays);
  const computedTotal  = Math.max(0, subtotal - safeDiscount);
  const effectiveTotal = manual_mode
    ? (Number.isFinite(toNum(manual_total)) ? toNum(manual_total) :
       (Number.isFinite(toNum(total_price)) ? toNum(total_price) : 0))
    : computedTotal;
  const remainingToPay = Math.max(0, effectiveTotal - safeAdvance);

  // ---------- Indicative bounds (display only; not enforced) ----------
  const minPPD = Math.max(0, Math.floor(safeInitialPrice - 50));
  const maxPPD = Math.floor(safeInitialPrice + 100);

  // ---------- Diffs ----------
  const showOldPPD   = typeof old_price_per_day === "number" && !Number.isNaN(old_price_per_day);
  const showOldTotal = typeof old_total_price === "number" && !Number.isNaN(old_total_price);
  const ppdDiff      = showOldPPD ? (safePPD - Number(old_price_per_day)) : 0;
  const totalDiff    = showOldTotal ? (effectiveTotal - Number(old_total_price)) : 0;

  const summaryItems: ReservationSummaryItem[] = [
    ...buildPricingSummaryItems({
      manual: manual_mode,
      days: safeDays,
      initialPricePerDay: safeInitialPrice,
      effectivePricePerDay: safePPD,
      subtotal,
      globalDiscount: safeDiscount,
      totalAmount: effectiveTotal,
      estimatedPerDay:
        manual_mode && safeDays > 0
          ? Math.floor(effectiveTotal / safeDays)
          : null,
      advancePayment: safeAdvance,
      remainingToPay,
      subtotalLabel: `Sous-total (${safeDays} × ${safePPD.toFixed(0)})`,
    }),
  ];

  if (payment_method) {
    summaryItems.push({ label: "Méthode", value: payment_method });
  }

  if (reference) {
    summaryItems.push({ label: "Référence", value: reference });
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row justify-center gap-4 lg:gap-8 px-2 sm:px-4">
      {/* LEFT: Admin price controls */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Prix (Administrateur)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ✅ Manual total toggle */}
          <div className="flex items-center justify-between border rounded-md p-3">
            <div className="text-sm">
              <p className="font-medium">Définir le total manuellement</p>
              <p className="text-xs text-muted-foreground">
                Saisissez le total final sans recalcul automatique.
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
                  // when enabling, initialize manual_total to the visible total
                  manual_total: enabled ? Number(prev.total_price || 0) : null,
                  // keep total_price as-is; auto-calc effect in parent will be skipped while enabled
                }));
              }}
              className="w-5 h-5"
            />
          </div>

          {/* Auto mode: price_per_day + global_discount */}
          {!manual_mode && (
            <>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="price_per_day" className="text-sm">
                    Prix par jour (DH)
                    <span className="block text-xs text-muted-foreground">
                      (indicatif) Min: {minPPD} — Max: {maxPPD}
                    </span>
                  </Label>
                  {showOldPPD && (
                    <div className="text-[11px] sm:text-xs text-muted-foreground">
                      Ancien:{" "}
                      <span className="line-through">
                        {Number(old_price_per_day).toFixed(0)} DH
                      </span>
                      {ppdDiff !== 0 && (
                        <span className={`ml-2 font-medium ${ppdDiff > 0 ? "text-red-600" : "text-green-600"}`}>
                          {ppdDiff > 0 ? `+${ppdDiff.toFixed(0)}` : ppdDiff.toFixed(0)} DH
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="ml-2 h-6 px-2 py-0 text-[11px]"
                        onClick={() => updateData("price_per_day", Number(old_price_per_day))}
                      >
                        Revenir à l&apos;ancien
                      </Button>
                    </div>
                  )}
                </div>

                {/* Free typing: no clamping, no min/max attributes */}
                <Input
                  type="number"
                  id="price_per_day"
                  step="1"
                  value={price_per_day ?? ""} // show string or number; allow ""
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      updateData("price_per_day", "");
                      return;
                    }
                    const val = Number(raw);
                    updateData("price_per_day", Number.isFinite(val) ? val : "");
                  }}
                  className="w-full"
                />
                {errors.price_per_day && (
                  <p className="text-xs text-red-600">{errors.price_per_day}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="global_discount" className="text-sm">
                  Remise globale (DH)
                  <span className="block text-xs text-muted-foreground">
                    Appliquée sur le sous-total: {subtotal.toFixed(0)} DH
                  </span>
                </Label>
                <Input
                  type="number"
                  id="global_discount"
                  step="10"
                  value={global_discount ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      updateData("global_discount", "");
                      return;
                    }
                    const val = Number(raw);
                    // store as typed; computation already caps at >=0 when used
                    updateData("global_discount", Number.isFinite(val) ? val : "");
                  }}
                  className="w-full"
                />
                {errors.global_discount && (
                  <p className="text-xs text-red-600">{errors.global_discount}</p>
                )}
              </div>
            </>
          )}

          {/* ✅ Manual mode: manual_total input keeps total in sync */}
          {manual_mode && (
            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="manual_total" className="text-sm">Total (DH)</Label>
                {showOldTotal && (
                  <div className="text-[11px] sm:text-xs text-muted-foreground">
                    Ancien:{" "}
                    <span className="line-through">{Number(old_total_price).toFixed(0)} DH</span>
                    {totalDiff !== 0 && (
                      <span className={`ml-2 font-medium ${totalDiff > 0 ? "text-red-600" : "text-green-600"}`}>
                        {totalDiff > 0 ? `+${totalDiff.toFixed(0)}` : totalDiff.toFixed(0)} DH
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-2 h-6 px-2 py-0 text-[11px]"
                      onClick={() =>
                        updateData((prev: any) => ({
                          ...prev,
                          manual_total: Number(old_total_price || 0),
                          total_price: Number(old_total_price || 0),
                        }))
                      }
                    >
                      Revenir à l&apos;ancien
                    </Button>
                  </div>
                )}
              </div>

              <Input
                type="number"
                id="manual_total"
                step="10"
                value={
                  Number.isFinite(toNum(manual_total))
                    ? toNum(manual_total)
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    updateData((prev: any) => ({
                      ...prev,
                      manual_total: "",
                      total_price: "",
                    }));
                    return;
                  }
                  const val = Number(raw);
                  updateData((prev: any) => ({
                    ...prev,
                    manual_total: Number.isFinite(val) ? val : "",
                    total_price: Number.isFinite(val) ? val : "",
                  }));
                }}
                className="w-full"
              />
              {errors.total_price && (
                <p className="text-xs text-red-600">{errors.total_price}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RIGHT: Summary */}
      <div className="w-full lg:w-[400px] space-y-4 mx-auto">
        <ReservationInfoCard
          car={selectedCar}
          startDate={start_date}
          endDate={end_date}
          pickupTime={pickup_time}
          returnTime={return_time}
          showDays
          days={safeDays}
          formatDates
          fallbackImage={imageSrc || undefined}
          title="Informations de Réservation"
        />

        <ReservationSummaryCard items={summaryItems} />
      </div>
    </div>
  );
}
