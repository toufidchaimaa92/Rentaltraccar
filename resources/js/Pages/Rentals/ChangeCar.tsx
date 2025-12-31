import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// shadcn-ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Icons (lucide-react uses names without the "Icon" suffix)
import { ChevronDown, ChevronLeft } from "lucide-react";

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

  const selectedCarLabel = useMemo(() => {
    if (!data.car_model_id || !data.new_car_id) return "";
    const model = selectedModel;
    if (!model || !model.cars) return "";
    const car = model.cars.find((c) => String(c.id) === String(data.new_car_id));
    return car ? `${model.brand} ${model.model} — ${car.license_plate}` : `${model.brand} ${model.model}`;
  }, [data.car_model_id, data.new_car_id, selectedModel]);

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
  const hasOldPPD = old_price_per_day > 0;
  const ppdDiff = (price_per_day || 0) - old_price_per_day;

  // Net/jour (affichage résumé)
  const netPerDay = useMemo(() => {
    if (newDays <= 0) return 0;
    if (data.manual_total) return Math.max(0, manualTotal) / newDays;
    const perDayDiscount = newDays > 0 ? Math.min(global_discount, subtotal) / newDays : 0;
    return Math.max(0, (price_per_day || 0) - perDayDiscount);
  }, [data.manual_total, manualTotal, newDays, global_discount, subtotal, price_per_day]);

  // 🔹 Baseline & écart total segment vs ancien tarif
  const baselineTotal = useMemo(() => {
    const days = newDays > 0 ? newDays : 1;
    const netOldPerDay = Math.max(0, old_price_per_day - old_discount_per_day);
    return days * netOldPerDay;
  }, [newDays, old_price_per_day, old_discount_per_day]);

  const currentTotal = data.manual_total ? Math.max(0, manualTotal) : autoTotal;
  const totalDiff = currentTotal - baselineTotal;

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
      <Head title={`Changer de voiture — Location #${rental.id}`} />

      <div>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Changer de voiture — Location #{rental.id}</h1>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={route("rentals.show", rental.id)} aria-label="Retour à la location">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Link>
          </Button>
        </div>

        {/* Étape 1 */}
        {step === 1 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Étape 1 — Sélectionner la voiture</CardTitle>
            </CardHeader>
            <CardContent>
              <StepSelectCarImmediate
                car_model_id={data.car_model_id}
                updateData={updateData}
                carModels={carModels}
              />
              {errors.new_car_id && <p className="text-red-600 text-sm mt-3">{errors.new_car_id}</p>}
            </CardContent>
          </Card>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <form onSubmit={submit}>
            <Card className="mt-4 w-full">
              <CardHeader>
                <CardTitle>Étape 2 — Détails & confirmation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Contexte */}
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Voiture actuelle</div>
                    <div className="font-medium">{rental.car_label || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Du</div>
                    <div className="font-medium">
                      {new Date(rental.start_date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Au</div>
                    <div className="font-medium">
                      {new Date(rental.end_date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* === ROW 1: 2 colonnes (Tarification + Résumé) === */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* ⬅️ Colonne gauche */}
                  <div className="space-y-6">
                    {/* Tarification (+ Date + Note DANS la carte) */}
                    <Card className="w-full">
                      <CardHeader>
                        <CardTitle className="text-lg">Tarification</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Toggle total manuel */}
                        <div className="flex items-center justify-between border rounded-md p-3">
                          <div className="text-sm">
                            <p className="font-medium">Définir le total manuellement</p>
                            <p className="text-xs text-muted-foreground">
                              Saisissez le <strong>total du segment</strong> sans recalcul.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(data.manual_total)}
                            onChange={(e) => setData("manual_total", e.target.checked)}
                            className="w-5 h-5"
                          />
                        </div>

                        {/* Prix/jour (cache en mode manuel) */}
                        {!data.manual_total && (
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                              <Label htmlFor="price_per_day" className="text-sm">
                                Prix effectif par jour
                                <span className="text-xs text-muted-foreground block">
                                  Min: {minEffectivePrice.toFixed(0)} — Max: {maxEffectivePrice.toFixed(0)}
                                </span>
                              </Label>
                              {hasOldPPD && (
                                <div className="text-[11px] sm:text-xs text-muted-foreground">
                                  Ancien: <span className="line-through">{old_price_per_day.toFixed(0)} DH</span>
                                  {ppdDiff !== 0 && (
                                    <span
                                      className={`ml-2 font-medium ${ppdDiff > 0 ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {ppdDiff > 0 ? `+${ppdDiff.toFixed(0)}` : ppdDiff.toFixed(0)} DH
                                    </span>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="ml-2 h-6 px-2 py-0 text-[11px]"
                                    onClick={() => setData("price_per_day", Number(old_price_per_day))}
                                  >
                                    Revenir à l&apos;ancien
                                  </Button>
                                </div>
                              )}
                            </div>

                            <Input
                              type="number"
                              id="price_per_day"
                              min={minEffectivePrice}
                              max={maxEffectivePrice}
                              step={10}
                              value={data.price_per_day || ""}
                              onChange={(e) => {
                                const parsed = parseFloat(e.target.value) || 0;
                                const clamped = Math.min(Math.max(parsed, minEffectivePrice), maxEffectivePrice);
                                setData("price_per_day", clamped);
                              }}
                            />
                            {errors.price_per_day && <p className="text-xs text-red-600">{errors.price_per_day}</p>}
                          </div>
                        )}

                        {/* Remise globale (cache en mode manuel) */}
                        {!data.manual_total && (
                          <div className="space-y-1">
                            <Label htmlFor="global_discount" className="text-sm">
                              Remise globale (DH)
                              <span className="text-xs text-muted-foreground block">
                                Appliquée sur le sous-total segment: {subtotal.toFixed(0)} DH
                              </span>
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
                            {errors.global_discount && <p className="text-xs text-red-600">{errors.global_discount}</p>}
                          </div>
                        )}

                        {/* Total libre (visible en mode manuel) */}
                        {data.manual_total && (
                          <div className="space-y-1">
                            <Label htmlFor="total_price" className="text-sm">Total segment (DH)</Label>
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

                        {/* --- Date de changement (DANS la carte) --- */}
                        <Separator />
                        <div className="grid gap-3">
                          <Label htmlFor="change_date">Date de changement</Label>
                          <Popover open={changeCarOpen} onOpenChange={setChangeCarOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" id="change_date" className="justify-between font-normal">
                                {changeCarDate ? changeCarDate.toLocaleDateString("fr-FR") : "Sélectionner une date"}
                                <ChevronDown className="w-4 h-4 ml-2" />
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

                        {/* --- Note interne (DANS la carte) --- */}
                        <div className="space-y-2">
                          <Label>Note interne</Label>
                          <Textarea
                            placeholder="Ex: Client a négocié un tarif spécial…"
                            value={data.note}
                            onChange={(e) => setData("note", e.target.value)}
                          />
                          {errors.note && <p className="text-red-600 text-sm">{errors.note}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* ➡️ Colonne droite: Résumé */}
                  <div className="space-y-6">
                    <Card className="w-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Résumé</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-5 text-sm">
                        {/* Sélection */}
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Sélection</div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="font-medium">{selectedCarLabel || "—"}</div>
                            </div>

                            {/* Badge de mode */}
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border ${
                                data.manual_total
                                  ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                              }`}
                              title={
                                data.manual_total
                                  ? "Vous saisissez le total directement"
                                  : "Calcul automatique à partir du PPD et de la remise"
                              }
                            >
                              {data.manual_total ? "Total manuel" : "Calcul auto"}
                            </span>
                          </div>
                        </div>

                        {/* Période */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-md border p-3">
                            <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Du</div>
                            <div className="font-medium">
                              {new Date(data.change_date).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                          <div className="rounded-md border p-3">
                            <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Au</div>
                            <div className="font-medium">
                              {new Date(rental.end_date).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                          <div className="rounded-md border p-3">
                            <div className="text-[10px] uppercase text-muted-foreground tracking-wide">Jours</div>
                            <div className="font-semibold">{newDays}</div>
                          </div>
                        </div>

                        {/* Montants principaux */}
                        {!data.manual_total ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Prix / jour</span>
                              <span className="font-medium">{formatMoney(price_per_day || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Sous-total</span>
                              <span className="font-medium">{formatMoney(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Remise</span>
                              <span className="font-medium">
                                −{formatMoney(Math.min(global_discount, subtotal))}
                              </span>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                              <span className="text-sm">Net / jour</span>
                              <span className="font-semibold">{formatMoney(netPerDay)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm">Total segment</span>
                              <span className="text-lg font-bold text-green-600">
                                {formatMoney(autoTotal)}
                              </span>
                            </div>

                            {/* Écart vs total précédent */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Écart vs total précédent</span>
                              <span
                                className={`font-medium ${
                                  totalDiff > 0
                                    ? "text-red-600"
                                    : totalDiff < 0
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                                }`}
                                title={`Ancien total segment (à ancien tarif): ${formatMoney(baselineTotal)}`}
                              >
                                {totalDiff >= 0 ? "+" : "−"}
                                {formatMoney(Math.abs(totalDiff))}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Total saisi</span>
                              <span className="text-lg font-bold text-green-600">
                                {formatMoney(Number(data.total_price || 0))}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Net / jour (approx.)</span>
                              <span className="font-semibold">{formatMoney(netPerDay)}</span>
                            </div>

                            {/* Écart vs total précédent */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Écart vs total précédent</span>
                              <span
                                className={`font-medium ${
                                  totalDiff > 0
                                    ? "text-red-600"
                                    : totalDiff < 0
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                                }`}
                                title={`Ancien total segment (à ancien tarif): ${formatMoney(baselineTotal)}`}
                              >
                                {totalDiff >= 0 ? "+" : "−"}
                                {formatMoney(Math.abs(totalDiff))}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Comparatif PPD (si dispo) */}
                        {hasOldPPD && (
                          <>
                            <Separator />
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Écart vs ancien PPD</span>
                              <span
                                className={`font-medium ${
                                  ppdDiff > 0 ? "text-red-600" : ppdDiff < 0 ? "text-green-600" : ""
                                }`}
                                title={`Ancien: ${formatMoney(old_price_per_day)}`}
                              >
                                {ppdDiff >= 0 ? "+" : ""}
                                {formatMoney(Math.abs(ppdDiff))}
                                <span className="text-muted-foreground text-xs">&nbsp;/ jour</span>
                              </span>
                            </div>
                          </>
                        )}

                        {/* Aide contextuelle concise */}
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Le <strong>total segment</strong> tient compte des jours du nouveau segment et, si le mode
                          auto est actif, du <strong>prix/jour</strong> et de la <strong>remise</strong>. L’<strong>écart</strong> compare au total que vous auriez payé en gardant l’ancien tarif.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Retour
                    </Button>
                  </div>

                  <Button type="submit" disabled={processing || !data.new_car_id}>
                    {processing ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
