import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DollarSign,
  Calendar,
  Car,
  Settings2,
  RotateCcw,
  FileText,
} from "lucide-react";

const paymentCycleOptions = [
  { value: "monthly", label: "Mensuel (30 jours)" },
  { value: "15_days", label: "Tous les 15 jours" },
  { value: "10_days", label: "Tous les 10 jours" },
  { value: "custom", label: "Personnalisé" },
];

interface VehicleSelection {
  car_id: number | string;
  car_model_id: number | string;
  monthly_price: string | number;
  price_input_type?: "ht" | "ttc";
}

interface CarType {
  id: number | string;
  license_plate?: string;
  car_model_id?: number | string;
}

interface CarModelType {
  id: number | string;
  brand?: string;
  model?: string;
  cars?: CarType[];
}

interface Props {
  vehicles: VehicleSelection[];
  setVehicles: (vehicles: VehicleSelection[]) => void;
  carModels: CarModelType[];
  cars: CarType[];
  start_date: string;
  deposit: string | number;
  payment_cycle: string;
  custom_cycle_days: string | number;
  pro_rata_first_month?: boolean;
  errors?: Record<string, string>;
  updateData: (key: string, value: any) => void;
}

export default function StepLongTermTerms({
  vehicles,
  setVehicles,
  carModels,
  cars,
  start_date,
  deposit,
  payment_cycle,
  custom_cycle_days,
  pro_rata_first_month,
  errors = {},
  updateData,
}: Props) {
  /* ---------------------------------
   FORCE PRORATA OFF ON FIRST LOAD
  ---------------------------------- */
  useEffect(() => {
    if (pro_rata_first_month !== false) {
      updateData("pro_rata_first_month", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateVehicle = (
    carId: number | string,
    payload: Partial<VehicleSelection>
  ) => {
    setVehicles(
      vehicles.map((v) =>
        String(v.car_id) === String(carId)
          ? { ...v, ...payload }
          : v
      )
    );
  };

  const computeBreakdown = (price: string | number, type?: "ht" | "ttc") => {
    const value = Number(price) || 0;
    const isTtc = type !== "ht";
    const ht = isTtc ? value / 1.2 : value;
    const ttc = isTtc ? value : value * 1.2;
    const tva = ttc - ht;

    return {
      ht: +ht.toFixed(2),
      tva: +tva.toFixed(2),
      ttc: +ttc.toFixed(2),
    };
  };

  const vehicleDetails = vehicles.map((v) => {
    const model = carModels.find((m) => String(m.id) === String(v.car_model_id));
    const car = cars.find((c) => String(c.id) === String(v.car_id));

    return {
      ...v,
      modelLabel:
        `${model?.brand ?? ""} ${model?.model ?? ""}`.trim() || "Véhicule",
      license: car?.license_plate ?? "",
    };
  });

  return (
    <div className="space-y-6">
      {/* PAGE TITLE */}
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Settings2 className="h-5 w-5 text-primary" />
        Conditions de location LLD
      </h2>

      {/* VEHICLE PRICING */}
      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Prix mensuel par véhicule
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2">
          {vehicleDetails.map((vehicle) => {
            const breakdown = computeBreakdown(
              vehicle.monthly_price,
              vehicle.price_input_type
            );

            return (
              <div
                key={vehicle.car_id}
                className="rounded-lg border bg-muted/30 p-4 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    {/* Model */}
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      {vehicle.modelLabel}
                    </div>

                    {/* Matricule with ICON */}
                    {vehicle.license ? (
                      <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1">
                        <Car className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold tracking-wide text-primary">
                          {vehicle.license}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border border-muted bg-muted px-3 py-1">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">—</span>
                      </div>
                    )}
                  </div>

                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Montant saisi</Label>
                      <Select
                        value={vehicle.price_input_type ?? "ttc"}
                        onValueChange={(val) =>
                          updateVehicle(vehicle.car_id, {
                            price_input_type: val as "ht" | "ttc",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ht">HT</SelectItem>
                          <SelectItem value="ttc">TTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Montant</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={vehicle.monthly_price}
                        onChange={(e) =>
                          updateVehicle(vehicle.car_id, {
                            monthly_price: e.target.value,
                          })
                        }
                        placeholder="Ex: 5000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {[
                      { label: "HT", value: breakdown.ht },
                      { label: "TVA", value: breakdown.tva },
                      { label: "TTC", value: breakdown.ttc },
                    ].map((b) => (
                      <div
                        key={b.label}
                        className="rounded-md border bg-background px-3 py-1.5"
                      >
                        <p className="text-xs text-muted-foreground">
                          {b.label}
                        </p>
                        <p className="font-semibold">{b.value} MAD</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* CONTRACT DETAILS */}
      <Card className="rounded-xl border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Détails du contrat
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Date de début
            </Label>
            <Input
              type="date"
              value={start_date}
              onChange={(e) => updateData("start_date", e.target.value)}
            />
            {errors.start_date && (
              <p className="text-xs text-destructive">
                {errors.start_date}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Caution (optionnel)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={deposit}
              onChange={(e) => updateData("deposit", e.target.value)}
              placeholder="Ex: 1500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              Cycle de paiement
            </Label>
            <Select
              value={payment_cycle}
              onValueChange={(val) => updateData("payment_cycle", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un cycle" />
              </SelectTrigger>
              <SelectContent>
                {paymentCycleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {payment_cycle === "custom" && (
            <div className="space-y-1.5">
              <Label>Nombre de jours</Label>
              <Input
                type="number"
                min="1"
                value={custom_cycle_days}
                onChange={(e) =>
                  updateData("custom_cycle_days", e.target.value)
                }
              />
              {errors.custom_cycle_days && (
                <p className="text-xs text-destructive">
                  {errors.custom_cycle_days}
                </p>
              )}
            </div>
          )}

          {/* PRORATA */}
          <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div>
              <p className="font-medium">Prorata du premier mois</p>
              <p className="text-sm text-muted-foreground">
                Facturation partielle selon les jours restants.
              </p>
            </div>

            <Switch
              checked={Boolean(pro_rata_first_month)}
              onCheckedChange={(val) =>
                updateData("pro_rata_first_month", Boolean(val))
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { paymentCycleOptions };
