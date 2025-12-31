// resources/js/Pages/Rentals/Extend.tsx
import React, { useMemo, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// shadcn-ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import { ChevronDownIcon, ChevronLeft } from "lucide-react";

// 🇫🇷 Locale FR
import { fr } from "date-fns/locale";

type RentalProp = {
  id: number;
  start_date: string;     // "YYYY-MM-DD"
  end_date: string;       // "YYYY-MM-DD"
  car_id: number | null;
  price_per_day?: number | string | null;
  discount_per_day?: number | string | null;
  car_label?: string | null;
  total_price?: number | string | null;
};

type PageProps = {
  auth: { user: any };
  rental: RentalProp;
};

function ymd(d: Date) { return d.toISOString().split("T")[0]; }
function parseYMD(s: string) { const d = new Date(s); d.setHours(12, 0, 0, 0); return d; }
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); c.setHours(12, 0, 0, 0); return c; }
/** diff NON inclusif start->newEnd (comme backend diffInDays($newEnd)) */
function diffDaysNonInclusive(start: Date, newEnd: Date) {
  const ms = parseYMD(ymd(newEnd)).getTime() - parseYMD(ymd(start)).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}
/** jours d’extension = newEnd - currentEnd (en jours) */
function extraDaysFromEnd(currentEnd: Date, newEnd: Date) {
  const ms = parseYMD(ymd(newEnd)).getTime() - parseYMD(ymd(currentEnd)).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

export default function Extend({ rental }: PageProps) {
  const { props } = usePage<PageProps>();
  const auth = props.auth;

  const {
    data,
    setData,
    patch,
    processing,
    errors,
    transform,
  } = useForm<{
    // extension
    new_end_date: string;
    extension_id?: number | string | null;

    // pricing
    manual_mode: boolean;
    manual_total: number | null; // en mode manuel: TOTAL DE L’EXTENSION UNIQUEMENT
    price_per_day: number | string;
    global_discount: number | string; // s’applique sur l’extension uniquement (mode auto)

    // payment (avance pour l’extension)
    advance_payment: number | null;
    payment_method: string;
    reference: string;
  }>({
    new_end_date: "",
    extension_id: null,

    manual_mode: false,
    manual_total: null,
    price_per_day: Number(rental.price_per_day ?? 0),
    global_discount: 0,

    // Paiement optionnel + défaut espèces
    advance_payment: null,
    payment_method: "cash",
    reference: "",
  });

  const [openCal, setOpenCal] = useState(false);

  // Base dates
  const startDate = parseYMD(rental.start_date);
  const currentEnd = parseYMD(rental.end_date);
  const minSelectable = addDays(currentEnd, 1); // lendemain de la fin actuelle

  // États locaux synchronisés
  const selectedDate: Date | null = data.new_end_date ? parseYMD(data.new_end_date) : null;

  // 👉 démarre à 0 jour d’extension
  const [extraDays, setExtraDays] = useState<number>(0);

  // Handlers synchro
  const handleSelectDate = (d: Date | undefined) => {
    if (!d) return;
    const normalized = addDays(d, 0);
    const clamped = normalized < minSelectable ? minSelectable : normalized;
    setData("new_end_date", ymd(clamped));
    setExtraDays(extraDaysFromEnd(currentEnd, clamped));
    setOpenCal(false);
  };

  const handleDaysChange = (n: number) => {
    // 👉 permet 0
    const safe = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    setExtraDays(safe);

    if (safe === 0) {
      // pas de date envoyée tant que l’extension = 0 (évite l’erreur de validation backend)
      setData("new_end_date", "");
    } else {
      const newEnd = addDays(currentEnd, safe);
      setData("new_end_date", ymd(newEnd));
    }
  };

  // ----- PRICING COMPUTATIONS -----

  // Ancien nombre de jours (contrat initial)
  const oldDays = useMemo(
    () => diffDaysNonInclusive(startDate, currentEnd),
    [startDate, currentEnd]
  );

  // Jours ajoutés (extension)
  const extDays = useMemo(() => {
    if (!data.new_end_date) return 0;
    const newEnd = parseYMD(data.new_end_date);
    return Math.max(0, extraDaysFromEnd(currentEnd, newEnd));
  }, [data.new_end_date, currentEnd]);

  // Total jours après extension (info affichage)
  const totalDaysAfter = oldDays + extDays;

  // Entrées UI
  const uiPricePerDay = Math.max(0, Number(data.price_per_day) || 0);
  const uiGlobalDiscount = Math.max(0, Number(data.global_discount) || 0);

  // Ancien net/jour (base du contrat, pour affichage "Avant")
  const oldBasePPD = Math.max(0, Number(rental.price_per_day ?? 0));
  const oldBaseDiscount = Math.max(0, Number(rental.discount_per_day ?? 0));
  const oldNetPerDay = Math.max(0, oldBasePPD - oldBaseDiscount);

  // Remise/jour sur l’extension (mode auto uniquement)
  const extDiscountPerDay = !data.manual_mode && extDays > 0 ? uiGlobalDiscount / extDays : 0;

  // Totaux
  const oldTotal = Math.max(0, Number(rental.total_price ?? 0));

  // Net/jour extension (affichage)
  const extNetPerDay = extDays > 0
    ? (data.manual_mode
      // ⚠️ en manuel: net/jour approx = total extension saisi / extDays
      ? Math.max(0, Math.max(0, Number(data.manual_total ?? 0)) / extDays)
      : Math.max(0, uiPricePerDay - extDiscountPerDay))
    : 0;

  // Calcul du supplément (extension uniquement)
  const extensionSubtotal = extDays * uiPricePerDay;
  const extensionDiscount = data.manual_mode ? 0 : Math.min(uiGlobalDiscount, extensionSubtotal);

  // Supplément à ajouter au contrat
  const extensionDelta = data.manual_mode
    ? Math.max(0, Number(data.manual_total ?? 0)) // 👉 manuel = TOTAL DE L’EXTENSION
    : Math.max(0, extensionSubtotal - extensionDiscount);

  // Grand total après extension (affichage)
  const effectiveNewGrandTotal = Math.max(0, oldTotal + extensionDelta);

  // Avance sur l’extension
  const safeAdvancePayment = Math.max(0, Number(data.advance_payment ?? 0));
  const remainingToPayExtension = Math.max(extensionDelta - safeAdvancePayment, 0);

  // bornes prix/jour (±50% du prix de base connu)
  const basePPD = Number(rental.price_per_day ?? uiPricePerDay);
  const minEffectivePrice = Math.max(0, Math.floor(basePPD * 0.5));
  const maxEffectivePrice = Math.max(minEffectivePrice + 1, Math.ceil(basePPD * 1.5) || 100000);

  function submit(e: React.FormEvent) {
    e.preventDefault();

    // mapping pour backend
    transform((payload) => {
      const p: any = { ...payload };
      if (!p.new_end_date) delete p.new_end_date;
      if (!p.extension_id) delete p.extension_id;

      if (p.manual_mode) {
        // ✅ En manuel: envoyer le total de l’EXTENSION uniquement
        p.override_total_price = Math.max(0, Number(p.manual_total || 0));
        p.override_total_mode = "segment"; // pour le controller (optionnel si vous forcez segment côté serveur)
        delete p.price_per_day;
        delete p.global_discount;
      } else {
        // Mode auto: on envoie le prix/jour et la remise/jour calculée sur l’extension
        const d = extDays > 0 ? extDays : 1;
        p.override_price_per_day = Number(p.price_per_day || 0);
        p.discount_per_day = Math.max(0, Number(p.global_discount || 0) / d);
        delete p.manual_total;
      }
      delete p.manual_mode;

      // ✅ Paiement optionnel : on ne garde rien si <= 0
      if (!p.advance_payment || Number(p.advance_payment) <= 0) {
        delete p.payment_method;
        delete p.reference;
        p.advance_payment = 0;
      }

      return p;
    });

    patch(route("rentals.extend", rental.id), { preserveScroll: true });
  }

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Prolonger — Location #${rental.id}`} />

      <div>
        {/* En-tête */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Prolonger la location #{rental.id}</h1>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={route("rentals.show", rental.id)} aria-label="Retour à la location">
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Retour</span>
            </Link>
          </Button>

        </div>

        <form onSubmit={submit}>
          <Card className="w-full">
            <CardContent className="space-y-6">
              {/* Contexte */}
              <div className="grid sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Voiture</div>
                  <div className="font-medium">{rental.car_label || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Du</div>
                  <div className="font-medium">
                    {new Date(rental.start_date).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fin actuelle</div>
                  <div className="font-medium">
                    {new Date(rental.end_date).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total actuel</div>
                  <div className="font-medium">
                    {oldTotal.toFixed(2)} DH
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sélection date + nombre de jours */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Calendrier */}
                <div className="space-y-3">
                  <Label htmlFor="new_end_date">Nouvelle date de fin</Label>

                  <Popover open={openCal} onOpenChange={setOpenCal}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="new_end_date"
                        className="justify-between font-normal"
                        aria-label="Sélectionner une date de fin"
                      >
                        {selectedDate
                          ? selectedDate.toLocaleDateString("fr-FR")
                          : "Sélectionner une date"}
                        <ChevronDownIcon className="w-4 h-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate ?? undefined}
                        fromDate={minSelectable}         // lendemain de la fin actuelle
                        fromYear={startDate.getFullYear()}
                        toYear={new Date().getFullYear() + 3}
                        locale={fr}
                        captionLayout="dropdown"
                        onSelect={handleSelectDate}
                      />
                    </PopoverContent>
                  </Popover>

                  {errors.new_end_date && (
                    <div className="text-red-600 text-sm">{errors.new_end_date}</div>
                  )}

                </div>

                {/* Nombre de jours */}
                <div className="space-y-3">
                  <Label htmlFor="extra_days">Nombre de jours d’extension</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 px-2"
                      onClick={() => handleDaysChange(Math.max(0, extraDays - 1))}
                    >
                      −
                    </Button>
                    <Input
                      id="extra_days"
                      type="number"
                      min={0}
                      step={1}
                      value={Number.isFinite(extraDays) ? extraDays : 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value || "0", 10);
                        handleDaysChange(Number.isFinite(v) ? Math.max(0, v) : 0);
                      }}
                      className="w-28 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 px-2"
                      onClick={() => handleDaysChange(extraDays + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tarification & Paiement */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Gauche: Formulaire prix + paiement */}
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Tarification & Paiement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Toggle mode manuel */}
                    <div className="flex items-center justify-between border rounded-md p-3">
                      <div className="text-sm">
                        <p className="font-medium">Définir le total manuellement</p>
                        <p className="text-xs text-muted-foreground">
                          Saisissez le <strong>total de l’extension</strong> (DH).
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(data.manual_mode)}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setData((prev) => ({
                            ...prev,
                            manual_mode: enabled,
                            manual_total: enabled ? (prev.manual_total ?? 0) : null,
                          }));
                        }}
                        className="w-5 h-5"
                      />
                    </div>

                    {/* Prix/jour + remise (cachés en manuel) */}
                    {!data.manual_mode && (
                      <>
                        <div className="space-y-1">
                          <Label htmlFor="price_per_day" className="text-sm">
                            Prix effectif par jour (DH)
                            <span className="text-xs text-muted-foreground block">
                              Min: {minEffectivePrice} — Max: {maxEffectivePrice}
                            </span>
                          </Label>
                          <Input
                            type="number"
                            id="price_per_day"
                            min={minEffectivePrice}
                            max={maxEffectivePrice}
                            step={10}
                            value={data.price_per_day}
                            onChange={(e) => {
                              const parsed = Number(e.target.value) || 0;
                              const clamped = Math.min(Math.max(parsed, minEffectivePrice), maxEffectivePrice);
                              setData("price_per_day", clamped);
                            }}
                          />
                          {errors.price_per_day && (
                            <p className="text-xs text-red-600">{errors.price_per_day}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="global_discount" className="text-sm">
                            Remise globale (DH)
                            <span className="text-xs text-muted-foreground block">
                              Appliquée sur le sous-total <strong>extension</strong>: {(extDays * uiPricePerDay).toFixed(0)} DH
                            </span>
                          </Label>
                          <Input
                            type="number"
                            id="global_discount"
                            min={0}
                            max={extDays * uiPricePerDay}
                            step={10}
                            value={data.global_discount}
                            onChange={(e) => {
                              const parsed = Number(e.target.value) || 0;
                              const max = extDays * uiPricePerDay;
                              setData("global_discount", Math.min(parsed, max));
                            }}
                          />
                          {errors.global_discount && (
                            <p className="text-xs text-red-600">{errors.global_discount}</p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Total manuel = extension uniquement */}
                    {data.manual_mode && (
                      <div className="space-y-1">
                        <Label htmlFor="manual_total" className="text-sm">
                          Total de l’extension — DH
                        </Label>
                        <Input
                          type="number"
                          id="manual_total"
                          min={0}
                          step={10}
                          value={
                            Number.isFinite(data.manual_total as any)
                              ? (data.manual_total as number)
                              : ""
                          }
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setData("manual_total", val);
                          }}
                        />
                        {errors.total_price && (
                          <p className="text-xs text-red-600">{errors.total_price}</p>
                        )}
                      </div>
                    )}

                    {/* Avance (sur le supplément) */}
                    <div className="space-y-1">
                      <Label htmlFor="advance_payment" className="text-sm">
                        Montant de l’avance (DH)
                        <span className="text-xs text-muted-foreground block">
                          Max: {Math.floor(extensionDelta)} DH
                        </span>
                      </Label>

                      <div className="flex gap-2">
                        <Input
                          type="number"
                          id="advance_payment"
                          min={0}
                          max={extensionDelta}
                          step={10}
                          inputMode="numeric"
                          value={
                            data.advance_payment === null ||
                              Number.isNaN(data.advance_payment as any)
                              ? ""
                              : data.advance_payment
                          }
                          placeholder="Entrez le montant"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === "") {
                              setData("advance_payment", null);
                              setData("payment_method", "cash"); // keep default ready
                              setData("reference", "");
                              return;
                            }
                            const parsed = Math.max(0, Number(raw) || 0);
                            const finalValue = Math.min(parsed, extensionDelta);
                            setData("advance_payment", finalValue);

                            if (finalValue > 0 && !data.payment_method) {
                              setData("payment_method", "cash"); // default to cash when entering a payment
                            }
                            if (finalValue === 0) {
                              setData("payment_method", "cash"); // keep default ready
                              setData("reference", "");
                            }
                          }}
                          className="w-full"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setData("advance_payment", extensionDelta);
                            setData("payment_method", "cash"); // default to cash
                            setData("reference", "");
                          }}
                        >
                          Payer total
                        </Button>
                      </div>

                      {errors.advance_payment && (
                        <p className="text-xs text-red-600">{errors.advance_payment}</p>
                      )}
                    </div>

                    {/* Méthode de paiement (si avance > 0) */}
                    {safeAdvancePayment > 0 && (
                      <div className="space-y-1">
                        <Label htmlFor="payment_method" className="text-sm">Méthode de paiement</Label>
                        <Select
                          value={data.payment_method || "cash"} // default to cash in UI
                          onValueChange={(value) => {
                            setData("payment_method", value);
                            if (!["virement", "cheque"].includes(value)) {
                              setData("reference", "");
                            }
                          }}
                        >
                          <SelectTrigger id="payment_method" className="w-full">
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
                        {errors.payment_method && (
                          <p className="text-xs text-red-600">{errors.payment_method}</p>
                        )}
                      </div>
                    )}

                    {/* Référence (si virement/cheque) */}
                    {["virement", "cheque"].includes(data.payment_method) && safeAdvancePayment > 0 && (
                      <div className="space-y-1">
                        <Label htmlFor="reference" className="text-sm">Référence</Label>
                        <Input
                          type="text"
                          id="reference"
                          placeholder="Numéro de chèque ou virement"
                          value={data.reference}
                          onChange={(e) => setData("reference", e.target.value)}
                        />
                        {errors.reference && (
                          <p className="text-xs text-red-600">{errors.reference}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Droite: Résumé */}
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg">Résumé</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm">
                    {/* --- Prix / jour --- */}
                    <div className="text-xs text-muted-foreground">Prix par jour</div>
                    <div className="flex justify-between">
                      <span>Avant</span>
                      <span className="font-medium text-muted-foreground">{oldNetPerDay.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Extension</span>
                      <span className="font-bold text-green-600">
                        {extNetPerDay > 0 ? extNetPerDay.toFixed(2) : '—'} DH
                      </span>
                    </div>

                    <Separator className="my-2" />

                    {/* --- Jours --- */}
                    <div className="text-xs text-muted-foreground">Durée</div>
                    <div className="flex justify-between">
                      <span>Avant</span>
                      <span className="font-medium text-muted-foreground">{oldDays} jour(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Après</span>
                      <span className="font-bold text-green-600">{totalDaysAfter || '—'} jour(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ajoutés</span>
                      <span className="font-medium text-blue-600">{extDays} jour(s)</span>
                    </div>

                    <Separator className="my-2" />

                    {/* --- Supplément --- */}
                    <div className="flex justify-between">
                      <span className="font-medium">Supplément (extension)</span>
                      <span className="font-semibold text-blue-600">
                        {extensionDelta.toFixed(2)} DH
                      </span>
                    </div>

                    <Separator className="my-2" />

                    {/* --- Totaux --- */}
                    <div className="text-xs text-muted-foreground">Totaux</div>
                    <div className="flex justify-between">
                      <span>Avant</span>
                      <span className="text-muted-foreground">{oldTotal.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Après</span>
                      <span className="font-bold text-green-600">{effectiveNewGrandTotal.toFixed(2)} DH</span>
                    </div>

                    <Separator className="my-2" />

                    {/* --- Paiement --- */}
                    {safeAdvancePayment > 0 && (
                      <div className="flex justify-between">
                        <span>Avance</span>
                        <span className="text-green-600">-{safeAdvancePayment.toFixed(2)} DH</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">À payer</span>
                      <span className="font-bold text-orange-600">
                        {remainingToPayExtension.toFixed(2)} DH
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Link href={route("rentals.show", rental.id)}>
                  <Button type="button" variant="outline">Annuler</Button>
                </Link>

                <Button type="submit" disabled={processing || !data.new_end_date || extDays <= 0}>
                  {processing ? "Enregistrement…" : "Prolonger"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
