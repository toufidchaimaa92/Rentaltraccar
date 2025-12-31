import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentCycleOptions } from "./StepLongTermTerms";
import {
  Calendar,
  IdCard,
  Phone,
  UserCheck,
  Building2,
} from "lucide-react";

interface CarModelOption {
  id: number | string;
  brand?: string;
  model?: string;
}

interface CarOption {
  id: number | string;
  license_plate?: string;
  car_model_id?: number | string;
}

interface Props {
  data: any;
  carModels: CarModelOption[];
  cars: CarOption[];
}

export default function StepLongTermRecap({ data, carModels, cars }: Props) {
  const paymentCycleLabel =
    paymentCycleOptions.find((opt) => opt.value === data.payment_cycle)?.label ??
    "Non renseigné";

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString("fr-FR");
  };

  const getCycleDays = () => {
    if (data.payment_cycle === "15_days") return 15;
    if (data.payment_cycle === "10_days") return 10;
    if (data.payment_cycle === "custom") {
      const d = Number(data.custom_cycle_days);
      return Number.isNaN(d) ? null : d;
    }
    return 30;
  };

  const getNextPaymentDate = () => {
    if (data.next_payment_due_date) {
      return formatDate(data.next_payment_due_date);
    }
    const cycleDays = getCycleDays();
    if (!cycleDays || !data.start_date) return "-";
    const start = new Date(data.start_date);
    if (Number.isNaN(start.getTime())) return "-";
    const next = new Date(start);
    next.setDate(next.getDate() + cycleDays);
    return formatDate(next.toISOString());
  };

  const computeBreakdown = (price: number, type?: "ht" | "ttc") => {
    const p = Number(price) || 0;
    const isTtc = type !== "ht";
    const ht = isTtc ? p / 1.2 : p;
    const ttc = isTtc ? p : p * 1.2;
    return {
      ht: Math.round(ht * 100) / 100,
      tva: Math.round((ttc - ht) * 100) / 100,
      ttc: Math.round(ttc * 100) / 100,
    };
  };

  const vehicleLines = Array.isArray(data.vehicles)
    ? data.vehicles.map((v: any) => {
      const model = carModels.find(
        (m) => String(m.id) === String(v.car_model_id)
      );
      const car = cars.find(
        (c) => String(c.id) === String(v.car_id)
      );
      const price = Number(v.monthly_price || 0);
      return {
        modelLabel: model
          ? `${model.brand ?? ""} ${model.model ?? ""}`.trim()
          : "Modèle",
        license: car?.license_plate ?? "",
        price,
        breakdown: computeBreakdown(price, v.price_input_type),
      };
    })
    : [];

  const monthlyTotals = vehicleLines.reduce(
    (acc: any, v: any) => ({
      ht: acc.ht + v.breakdown.ht,
      tva: acc.tva + v.breakdown.tva,
      ttc: acc.ttc + v.breakdown.ttc,
    }),
    { ht: 0, tva: 0, ttc: 0 }
  );

  const hasSecondDriver =
    data.driver_id ||
    data.driver_enabled ||
    data.driver?.name ||
    data.driver?.driver_name;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* LEFT */}
      <div className="space-y-6 flex flex-col h-full">
        {/* Conducteurs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conducteurs</CardTitle>
          </CardHeader>

          <CardContent className="pt-0 text-sm divide-y">
            {/* CLIENT */}
            <div className="flex items-start gap-3 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                {data.client_type === "company" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
              </div>

              {/* LABEL / VALUE */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium text-foreground text-right">
                    {data.client_mode === "existing"
                      ? `Client existant #${data.client_id || "-"}`
                      : data.client?.name || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Téléphone
                  </span>
                  <span className="text-foreground text-right">
                    {data.client?.phone || "-"}
                  </span>
                </div>

                {data.client?.license_number && (
                  <div className="flex justify-between gap-4">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <IdCard className="h-3.5 w-3.5" />
                      Permis
                    </span>
                    <span className="text-foreground text-right">
                      {data.client.license_number}
                    </span>
                  </div>
                )}

                {data.client_mode !== "existing" && (
                  <div className="pt-2 space-y-2 border-t">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Type</span>
                      <span className="text-foreground text-right">
                        {data.client_type === "company"
                          ? "Entreprise"
                          : "Particulier"}
                      </span>
                    </div>

                    {data.client_type === "company" ? (
                      <>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">RC</span>
                          <span className="text-foreground text-right">
                            {data.client?.rc || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">ICE</span>
                          <span className="text-foreground text-right">
                            {data.client?.ice || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">
                            Adresse société
                          </span>
                          <span className="text-foreground text-right max-w-[60%]">
                            {data.client?.company_address || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Contact</span>
                          <span className="text-foreground text-right">
                            {data.client?.contact_person || "-"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Adresse</span>
                          <span className="text-foreground text-right max-w-[60%]">
                            {data.client?.address || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">CIN</span>
                          <span className="text-foreground text-right">
                            {data.client?.identity_card_number || "-"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECOND DRIVER — LABEL / VALUE */}
            {hasSecondDriver && (
              <div className="flex items-start gap-3 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">
                  <UserCheck className="h-4 w-4" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Conducteur</span>
                    <span className="font-medium text-foreground text-right">
                      {data.driver_id
                        ? `Conducteur existant #${data.driver_id}`
                        : data.driver?.name || data.driver?.driver_name}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      Téléphone
                    </span>
                    <span className="text-foreground text-right">
                      {data.driver?.phone || "-"}
                    </span>
                  </div>

                  {data.driver?.license_number && (
                    <div className="flex justify-between gap-4">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <IdCard className="h-3.5 w-3.5" />
                        Permis
                      </span>
                      <span className="text-foreground text-right">
                        {data.driver.license_number}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 space-y-2 border-t">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Adresse</span>
                      <span className="text-foreground text-right max-w-[60%]">
                        {data.driver?.address || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">CIN</span>
                      <span className="text-foreground text-right">
                        {data.driver?.identity_card_number || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Date du permis
                      </span>
                      <span className="text-foreground text-right">
                        {data.driver?.license_date || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* VEHICLE */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Véhicule</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            {vehicleLines.length === 0 && (
              <p className="text-muted-foreground">Aucun véhicule sélectionné</p>
            )}
            {vehicleLines.length > 0 && (
              <div className="divide-y">
                {vehicleLines.map((v, idx) => (
                  <div key={idx} className="flex justify-between py-3">
                    <div>
                      <p className="font-medium">{v.modelLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.license || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {v.price ? `${v.price} MAD TTC` : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {v.price
                          ? `${v.breakdown.ht.toFixed(
                            2
                          )} HT + ${v.breakdown.tva.toFixed(2)} TVA`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT */}
      <div className="space-y-6 flex flex-col h-full">
        {/* CONTRACT */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contrat</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm divide-y text-muted-foreground">
            <div className="flex justify-between py-2">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Début
              </span>
              <span className="text-foreground">
                {formatDate(data.start_date)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Prochaine échéance</span>
              <span className="text-foreground">{getNextPaymentDate()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Cycle</span>
              <span className="text-foreground">{paymentCycleLabel}</span>
            </div>
            {data.payment_cycle === "custom" && (
              <div className="flex justify-between py-2">
                <span>Fréquence</span>
                <span className="text-foreground">
                  Chaque {data.custom_cycle_days} jours
                </span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span>Prorata 1er mois</span>
              <span className="text-foreground">
                {data.pro_rata_first_month ? "Oui" : "Non"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Caution</span>
              <span className="text-foreground">
                {data.deposit ? `${data.deposit} MAD` : "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* PRICING */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tarification</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm divide-y text-muted-foreground">
            <div className="flex justify-between py-2">
              <span>Total HT</span>
              <span className="text-foreground">
                {monthlyTotals.ht
                  ? `${monthlyTotals.ht.toFixed(2)} MAD`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>TVA (20 %)</span>
              <span className="text-foreground">
                {monthlyTotals.tva
                  ? `${monthlyTotals.tva.toFixed(2)} MAD`
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span>Total TTC</span>
              <span className="font-semibold text-foreground">
                {monthlyTotals.ttc
                  ? `${monthlyTotals.ttc.toFixed(2)} MAD`
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
