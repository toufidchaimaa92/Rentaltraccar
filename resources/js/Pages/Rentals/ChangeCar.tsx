import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// shadcn-ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Icons (lucide-react uses names without the "Icon" suffix)
import {
  Calendar as CalendarIcon,
  Car,
  ChevronDown,
  ChevronLeft,
  Clock,
  UserCog,
  FileText,
  Wallet,
  Calculator,
  Edit3,
} from "lucide-react";

// Étape 1
import StepSelectCarImmediate from "./Partials/StepSelectCarImmediate";

type CarModelPhoto = { id: number; photo_path: string; order: number };
type CarType = { id: number; license_plate: string; status?: string };
type CarModel = {
  id: number | string;
  brand: string;
  model: string;
  fuel_type?: string;
  price_per_day?: number;
  transmission?: string;
  finish?: string;
  photos?: CarModelPhoto[];
  cars?: CarType[];
};

type RentalProp = {
  id: number;
  start_date: string;
  end_date: string;
  car_id: number | null;
  price_per_day?: number | string | null;
  discount_per_day?: number | string | null;
  car_label?: string | null;
  total_price?: number | string | null;
};

type PageProps = {
  auth: { user: any };
  rental: RentalProp;
  carModels: CarModel[];
};

function ymd(d: Date) {
  return d.toISOString().split("T")[0];
}
function parseYMD(s: string) {
  const d = new Date(s);
  d.setHours(12, 0, 0, 0);
  return d;
}
/** Non-inclusif (comme Carbon diffInDays). Min 1 pour la facturation. */
function diffDaysNonInclusive(a: Date, b: Date) {
  const ms = parseYMD(ymd(b)).getTime() - parseYMD(ymd(a)).getTime();
  const days = Math.floor(ms / 86400000);
  return Math.max(1, days);
}

// Format MAD
const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, n));

export default function ChangeCar({ rental, carModels, auth }: PageProps) {
  // Étapes
  const [step, setStep] = useState<1 | 2>(1);

  // Inertia form
  const { data, setData, post, processing, errors, transform } = useForm({
    // Étape 1
    car_model_id: "" as string | number,
    new_car_id: "" as string,

    // Étape 2
    change_date: rental.start_date ?? "",
    manual_total: false as boolean, // false = auto (ppd/remise), true = total segment libre
    price_per_day: "" as string | number, // par défaut = prix du modèle
    global_discount: "" as string | number, // remise globale DH (répartie /jour à l'envoi)
    total_price: "" as string | number, // total segment en mode manuel
    note: "" as string,
  });

  // Calendar state
  const [changeCarOpen, setChangeCarOpen] = useState(false);
  const [changeCarDate, setChangeCarDate] = useState<Date | null>(
    data.change_date ? parseYMD(data.change_date as string) : null
  );

  // Helpers Step 1
  function updateData(key: string, value: any) {
    if (key === "car_id") {
      setData("new_car_id", String(value));
      setStep(2);
      return;
    }
    if (key === "car_model_id") {
      setData("car_model_id", value);
      return;
    }
    setData(key as any, value);
  }

  // Sélections
  const selectedModel = useMemo(
    () => carModels.find((m) => String(m.id) === String(data.car_model_id)),
    [carModels, data.car_model_id]
  );
  const selectedCar = useMemo(() => {
    if (!data.new_car_id || !selectedModel?.cars) return null;
    return selectedModel.cars.find((c) => String(c.id) === String(data.new_car_id)) ?? null;
  }, [data.new_car_id, selectedModel]);

  // ✅ Prix/jour = prix du modèle sélectionné (si non saisi par l'utilisateur)
  useEffect(() => {
    if (step !== 2) return;
    const modelPPD = Number(selectedModel?.price_per_day ?? 0);
    const currentPPD = Number(data.price_per_day || 0);
    if (modelPPD > 0 && (!data.price_per_day || currentPPD === 0)) {
      setData("price_per_day", modelPPD);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedModel?.price_per_day]);

  // Jours du nouveau segment (non-inclusif)
  const newDays = useMemo(() => {
    if (!data.change_date) return 1;
    const start = parseYMD(data.change_date as string);
    const end = parseYMD(rental.end_date);
    return diffDaysNonInclusive(start, end);
  }, [data.change_date, rental.end_date]);

  // Bornes prix/jour (±50% du modèle si dispo)
  const basePPD = Number(selectedModel?.price_per_day ?? 0);
  const minEffectivePrice = useMemo(
    () => (basePPD > 0 ? Math.max(0, Math.floor(basePPD * 0.5)) : 0),
    [basePPD]
  );
  const maxEffectivePrice = useMemo(
    () => (basePPD > 0 ? Math.ceil(basePPD * 1.5) : 100000),
    [basePPD]
  );

  const price_per_day = Number(data.price_per_day || 0);
  const global_discount = Number(data.global_discount || 0);

  const subtotal = useMemo(() => newDays * (price_per_day || 0), [newDays, price_per_day]);
  const autoTotal = useMemo(
    () => Math.max(0, subtotal - Math.min(global_discount, subtotal)),
    [subtotal, global_discount]
  );
  const manualTotal = Number(data.total_price || 0);

  // Ancien tarif pour comparaison
  const old_price_per_day = Number(rental.price_per_day || 0);
  const old_discount_per_day = Number(rental.discount_per_day || 0);
  const totalCurrent = (rental as any).total_price ?? null;

  // 🔹 Baseline & écart total segment vs ancien tarif
  const baselineTotal = useMemo(() => {
    const days = newDays > 0 ? newDays : 1;
    const netOldPerDay = Math.max(0, old_price_per_day - old_discount_per_day);
    return days * netOldPerDay;
  }, [newDays, old_price_per_day, old_discount_per_day]);

  const currentTotal = data.manual_total ? Math.max(0, manualTotal) : autoTotal;

  // Submit
  function submit(e: React.FormEvent) {
    e.preventDefault();

    transform((payload) => {
      const p: any = { ...payload };

      if (!p.new_car_id) delete p.new_car_id;
      if (!p.change_date) delete p.change_date;
      if (!p.note) delete p.note;
      delete p.car_model_id; // UI only

      if (p.manual_total) {
        // total segment en mode manuel
        p.override_total_price = Number(p.total_price || 0);
        delete p.price_per_day;
        delete p.global_discount;
      } else {
        const ppd = Number(p.price_per_day || 0);
        const gdisc = Number(p.global_discount || 0);
        const days = newDays > 0 ? newDays : 1;
        const discount_per_day = Math.max(0, Math.min(gdisc, days * ppd) / days);
        p.override_price_per_day = ppd;
        p.discount_per_day = discount_per_day;
        delete p.total_price;
      }

      delete p.manual_total;
      return p;
    });

    post(route("rentals.changeCar", rental.id), { preserveScroll: true });
  }

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Changer de voiture - Location #${rental.id}`} />

      <div>
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between gap-4">
          {/* LEFT */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href={route("rentals.show", rental.id)}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>

            <h1 className="text-2xl font-bold tracking-tight truncate">
              Changer de voiture
            </h1>
          </div>

          {/* RIGHT (desktop only) */}
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-semibold">
              Location #{rental.id}
            </p>
            <p className="text-xs text-muted-foreground">
              Changement de véhicule
            </p>
          </div>
        </div>


        {/* Étape 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">
              Étape 1 - Sélectionner la voiture
            </h2>

            <StepSelectCarImmediate
              car_model_id={data.car_model_id}
              updateData={updateData}
              carModels={carModels}
            />

            {errors.new_car_id && (
              <p className="text-red-600 text-sm">
                {errors.new_car_id}
              </p>
            )}
          </div>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <form onSubmit={submit}>
            <div className="space-y-4">
              {/* Contexte */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg border bg-muted/40 p-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-4 w-4 text-primary" /> Voiture actuelle
                  </div>
                  <div className="font-medium">{rental.car_label || "—"}</div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 text-primary" /> Début
                  </div>
                  <div className="font-medium">
                    {new Date(rental.start_date).toLocaleDateString("fr-FR")}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 text-primary" /> Fin
                  </div>
                  <div className="font-medium">
                    {new Date(rental.end_date).toLocaleDateString("fr-FR")}
                  </div>
                </div>

                {totalCurrent !== null && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wallet className="h-4 w-4 text-primary" /> Total actuel
                    </div>
                    <div className="font-medium">{formatMoney(Number(totalCurrent || 0))}</div>
                  </div>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* LEFT */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Tarification */}
                  <div className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        Tarification
                      </h3>
                    </div>

                    {/* Mode de tarification */}
                    <div className="space-y-2">
                      <Label className="text-xs">Mode de tarification</Label>

                      <div className="flex rounded-md border bg-muted/40 p-1">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 gap-2"
                          variant={!data.manual_total ? "default" : "ghost"}
                          onClick={() => setData("manual_total", false)}
                        >
                          <Calculator className="h-4 w-4" />
                          Automatique
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 gap-2"
                          variant={data.manual_total ? "default" : "ghost"}
                          onClick={() => setData("manual_total", true)}
                        >
                          <UserCog className="h-4 w-4" />
                          Manuel
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {data.manual_total
                          ? "Vous définissez directement le total du segment."
                          : "Le total est calculé automatiquement (prix / jour + remise)."}
                      </p>
                    </div>

                    {/* Prix/jour + Remise (same row on desktop) */}
                    {!data.manual_total && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Prix / jour */}
                        <div className="space-y-2">
                          <Label htmlFor="price_per_day" className="text-xs">
                            Prix effectif par jour
                          </Label>

                          <Input
                            type="number"
                            id="price_per_day"
                            min={minEffectivePrice}
                            max={maxEffectivePrice}
                            step={10}
                            value={data.price_per_day || ""}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value) || 0;
                              const clamped = Math.min(
                                Math.max(parsed, minEffectivePrice),
                                maxEffectivePrice
                              );
                              setData("price_per_day", clamped);
                            }}
                          />

                          {errors.price_per_day && (
                            <p className="text-xs text-red-600">{errors.price_per_day}</p>
                          )}
                        </div>

                        {/* Remise globale */}
                        <div className="space-y-2">
                          <Label htmlFor="global_discount" className="text-xs">
                            Remise globale (DH)
                          </Label>

                          <Input
                            type="number"
                            id="global_discount"
                            min={0}
                            max={subtotal}
                            step={10}
                            value={data.global_discount || ""}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value) || 0;
                              setData("global_discount", Math.min(parsed, subtotal));
                            }}
                          />

                          {errors.global_discount && (
                            <p className="text-xs text-red-600">{errors.global_discount}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Total libre (visible en mode manuel) */}
                    {data.manual_total && (
                      <div className="space-y-2">
                        <Label htmlFor="total_price" className="text-xs">Total segment (DH)</Label>
                        <Input
                          type="number"
                          id="total_price"
                          min={0}
                          step={10}
                          value={
                            typeof data.total_price === "number" ||
                              (typeof data.total_price === "string" && data.total_price !== "")
                              ? (data.total_price as any)
                              : ""
                          }
                          onChange={(e) => setData("total_price", parseFloat(e.target.value) || 0)}
                        />
                        {errors.total_price && <p className="text-xs text-red-600">{errors.total_price}</p>}
                      </div>
                    )}
                  </div>

                  {/* Date de changement */}
                  <div className="rounded-lg border p-4 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Date de changement
                    </h3>

                    <div className="space-y-2">
                      <Label htmlFor="change_date" className="text-xs">Date de changement</Label>
                      <Popover open={changeCarOpen} onOpenChange={setChangeCarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="change_date"
                            className="w-full h-10 justify-between font-normal"
                          >
                            {changeCarDate ? changeCarDate.toLocaleDateString("fr-FR") : "Sélectionner une date"}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={changeCarDate ?? undefined}
                            captionLayout="dropdown"
                            fromYear={new Date(rental.start_date).getFullYear()}
                            toYear={new Date(rental.end_date).getFullYear()}
                            onSelect={(selectedDate) => {
                              const d = selectedDate ? new Date(selectedDate) : null;
                              if (d) d.setHours(12, 0, 0, 0);
                              setChangeCarDate(d);
                              setData("change_date", d ? ymd(d) : "");
                              setChangeCarOpen(false);
                            }}
                            disabled={(date) =>
                              date < parseYMD(rental.start_date) || date > parseYMD(rental.end_date)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.change_date && <div className="text-red-600 text-sm">{errors.change_date}</div>}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="rounded-lg border p-4 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Notes
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-xs">Note interne</Label>
                      <Textarea
                        placeholder="Ex: Client a négocié un tarif spécial…"
                        value={data.note}
                        onChange={(e) => setData("note", e.target.value)}
                      />
                      {errors.note && <p className="text-red-600 text-sm">{errors.note}</p>}
                    </div>
                  </div>
                </div>

                <Card className="lg:sticky lg:top-6 h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg">Résumé du changement</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 text-sm">
                    {/* VEHICULE */}
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Véhicule sélectionné</div>
                      <div className="font-medium flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        {selectedModel
                          ? `${selectedModel.brand} ${selectedModel.model}`
                          : "—"}
                        {selectedCar?.license_plate ? ` .  ${selectedCar.license_plate}` : ""}
                      </div>
                    </div>

                    {/* TOTAL HERO */}
                    <div className="rounded-xl bg-primary/10 p-4 border border-primary/20">
                      <div className="text-xs text-muted-foreground">Total du segment</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatMoney(currentTotal)}
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {data.manual_total ? (
                          <>
                            <UserCog className="h-3.5 w-3.5" />
                            Mode manuel
                          </>
                        ) : (
                          <>
                            <Calculator className="h-3.5 w-3.5" />
                            Calcul automatique
                          </>
                        )}
                      </div>
                    </div>

                    {/* DETAILS TARIF */}
                    {!data.manual_total && (
                      <div className="rounded-lg border p-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ancien prix / jour</span>
                          <span>
                            {formatMoney(old_price_per_day || 0)}
                          </span>
                        </div>

                        <div className="flex justify-between font-medium">
                          <span>Nouveau prix / jour</span>
                          <span
                            className={
                              price_per_day > old_price_per_day
                                ? "text-green-600"
                                : price_per_day < old_price_per_day
                                  ? "text-red-600"
                                  : ""
                            }
                          >
                            {formatMoney(price_per_day)}
                          </span>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Durée</span>
                          <span>
                            {newDays} jour{newDays > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* COMPARAISON */}
                    <div className="rounded-lg border p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avant</span>
                        <span>{formatMoney(baselineTotal)}</span>
                      </div>

                      <div className="flex justify-between font-medium">
                        <span>Après</span>
                        <span
                          className={
                            currentTotal > baselineTotal
                              ? "text-green-600"
                              : currentTotal < baselineTotal
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {formatMoney(currentTotal)}
                        </span>
                      </div>

                      {/* BENEFICE / PERTE */}
                      <div className="flex justify-between items-center text-xs pt-2 border-t mt-2">
                        <span className="text-muted-foreground">Résultat</span>

                        {currentTotal - baselineTotal > 0 ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            +{formatMoney(currentTotal - baselineTotal)}
                          </span>
                        ) : currentTotal - baselineTotal < 0 ? (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            {formatMoney(currentTotal - baselineTotal)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            ⚖️ Aucun changement
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={processing || !data.new_car_id}
                    >
                      {processing ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </div>
          </form>
        )}
      </div>
    </AuthenticatedLayout>
  );
}