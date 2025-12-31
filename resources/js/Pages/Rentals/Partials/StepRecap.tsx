import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReservationInfoCard from "@/components/rentals/ReservationInfoCard";
import {
  ReservationSummaryCard,
  ReservationSummaryItem,
} from "@/components/rentals/ReservationSummaryCard";
import { buildPricingSummaryItems } from "@/components/rentals/reservationSummaryUtils";
import { UserCheck, Phone, IdCard } from "lucide-react";

type CarModel = {
  id: number;
  brand: string;
  model: string;
  price_per_day: number;
  finish?: string;
  fuel_type?: string;
  transmission?: string;
  photos?: { photo_path: string }[];
};

type Props = {
  data: any;
  carModels: CarModel[];
  selectedCar?: CarModel | null;
};

export default function StepRecap({
  data,
  carModels,
  selectedCar: selectedCarProp,
}: Props) {
  const selectedCar =
    selectedCarProp ?? carModels.find((m) => m.id === Number(data.car_model_id));

  const safe = (n: number | string | undefined, fallback = 0) =>
    isNaN(Number(n)) ? fallback : Number(n);

  const manual =
    Boolean(data.manual_mode) ||
    (data.manual_total !== null && data.manual_total !== undefined);

  const safeDays = safe(data.days);
  const safeInitialPrice = safe(
    data.initial_price_per_day ?? selectedCar?.price_per_day
  );
  const safeEffectivePrice = safe(
    data.effective_price_per_day ??
      data.price_per_day ??
      safeInitialPrice
  );
  const safeGlobalDiscount = safe(data.global_discount);
  const safeAdvancePayment = safe(data.advance_payment);

  const subtotal = safeDays * safeEffectivePrice;
  const computedTotal = Math.max(subtotal - safeGlobalDiscount, 0);
  const manualTotal = safe(data.total_price);
  const effectiveTotal = manual ? manualTotal : computedTotal;
  const remainingToPay = Math.max(effectiveTotal - safeAdvancePayment, 0);
  const estimatedPerDayManual =
    safeDays > 0 ? Math.floor(manualTotal / safeDays) : 0;

  const getSecondDriver = () =>
    data?.second_driver && data.second_driver.name
      ? data.second_driver
      : null;

  const summaryItems: ReservationSummaryItem[] = [
    { label: "Client", value: data.client?.name || "--" },
    { label: "Téléphone", value: data.client?.phone || "--" },
    { label: "Adresse", value: data.client?.address || "--" },
    { label: "Nombre de jours", value: `${safeDays} jour(s)` },
  ];

  summaryItems.push(
    ...buildPricingSummaryItems({
      manual,
      days: safeDays,
      currency: "DH",
      initialPricePerDay: safeInitialPrice,
      effectivePricePerDay: safeEffectivePrice,
      subtotal,
      globalDiscount: safeGlobalDiscount,
      totalAmount: effectiveTotal,
      estimatedPerDay: manual ? estimatedPerDayManual : null,
      advancePayment: safeAdvancePayment,
      remainingToPay,
    })
  );

  summaryItems.push(
    { label: "Méthode de paiement", value: data.payment_method || "--" },
    { label: "Statut", value: data.payment_status || "--" }
  );

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* LEFT COLUMN */}
      <div className="space-y-6 flex flex-col h-full">
        {/* Drivers */}
        <Card>
          <CardHeader>
            <CardTitle>Conducteurs</CardTitle>
          </CardHeader>

          <CardContent className="text-sm divide-y">
            {/* Main Driver */}
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                <UserCheck className="h-4 w-4" />
              </div>

              <div className="flex flex-col">
                <span className="font-medium text-foreground dark:text-white">
                  {data.client?.name || "--"}
                </span>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground dark:text-white/70">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {data.client?.phone || "--"}
                  </span>

                  {data.client?.license_number && (
                    <span className="flex items-center gap-1">
                      <IdCard className="h-3.5 w-3.5" />
                      {data.client.license_number}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Second Driver */}
            {getSecondDriver() && (
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">
                  <UserCheck className="h-4 w-4" />
                </div>

                <div className="flex flex-col">
                  <span className="font-medium text-foreground dark:text-white">
                    {getSecondDriver()?.name}
                  </span>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground dark:text-white/70">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {getSecondDriver()?.phone || "--"}
                    </span>

                    {getSecondDriver()?.license_number && (
                      <span className="flex items-center gap-1">
                        <IdCard className="h-3.5 w-3.5" />
                        {getSecondDriver()?.license_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservation Info */}
        <div className="flex-1 flex flex-col">
          <ReservationInfoCard
            car={selectedCar}
            startDate={data.start_date}
            endDate={data.end_date}
            pickupTime={data.pickup_time}
            returnTime={data.return_time}
            showDays
            days={safeDays}
            formatDates
            title="Informations de Réservation"
            className="h-full flex flex-col"
            contentClassName="grow"
          />
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col h-full">
        <ReservationSummaryCard
          items={summaryItems}
          className="flex-1 flex flex-col"
          contentClassName="grow"
        />
      </div>
    </div>
  );
}
