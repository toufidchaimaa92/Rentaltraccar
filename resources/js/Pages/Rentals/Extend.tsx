import React, { useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// shadcn-ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ButtonGroup } from "@/components/ui/button-group";
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
import {
  ChevronDownIcon,
  ChevronLeft,
  Car,
  Clock,
  Calendar as CalendarIcon,
  Wallet,
  Banknote,
  CreditCard,
  Receipt,
  Calculator,
  UserCog,
} from "lucide-react";

// Locale
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/* ================= HELPERS ================= */

function ymd(d: Date) {
  return format(d, "yyyy-MM-dd");
}
function parseYMD(s: string) {
  const d = parseISO(s);
  d.setHours(12, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  c.setHours(12, 0, 0, 0);
  return c;
}
function extraDaysFromEnd(currentEnd: Date, newEnd: Date) {
  const ms =
    parseYMD(ymd(newEnd)).getTime() - parseYMD(ymd(currentEnd)).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

/* ================= TYPES ================= */

type RentalProp = {
  id: number;
  start_date: string;
  end_date: string;
  car_label?: string | null;
  price_per_day?: number | string | null;
  total_price?: number | string | null;
};

type PageProps = {
  auth: { user: any };
  rental: RentalProp;
};

/* ================= PAGE ================= */

export default function Extend({ rental }: PageProps) {
  const { props } = usePage<PageProps>();
  const auth = props.auth;

  const { data, setData, patch, processing, transform } = useForm({
    new_end_date: "",
    manual_mode: false,
    manual_total: null as number | null,
    price_per_day: Number(rental.price_per_day ?? 0),
    global_discount: 0,
    advance_payment: null as number | null,
    payment_method: "cash",
    reference: "",
  });

  const [openCal, setOpenCal] = useState(false);
  const [extraDays, setExtraDays] = useState(0);

  const startDate = parseYMD(rental.start_date);
  const currentEnd = parseYMD(rental.end_date);
  const minSelectable = addDays(currentEnd, 1);

  const selectedDate = data.new_end_date ? parseYMD(data.new_end_date) : null;

  const handleSelectDate = (d?: Date) => {
    if (!d) return;
    const clamped = d < minSelectable ? minSelectable : d;
    setData("new_end_date", ymd(clamped));
    setExtraDays(extraDaysFromEnd(currentEnd, clamped));
    setOpenCal(false);
  };

  const handleDaysChange = (n: number) => {
    const safe = Math.max(0, Math.floor(n));
    setExtraDays(safe);
    setData("new_end_date", safe === 0 ? "" : ymd(addDays(currentEnd, safe)));
  };

  /* ================= COMPUTED ================= */

  const extDays = extraDays;
  const oldTotal = Number(rental.total_price ?? 0);

  const extensionSubtotal = extDays * Number(data.price_per_day || 0);
  const extensionDiscount = data.manual_mode
    ? 0
    : Math.min(data.global_discount, extensionSubtotal);

  const extensionDelta = data.manual_mode
    ? Math.max(0, Number(data.manual_total || 0))
    : Math.max(0, extensionSubtotal - extensionDiscount);

  const advance = Math.max(0, Number(data.advance_payment || 0));
  const remaining = Math.max(extensionDelta - advance, 0);
  const newGrandTotal = oldTotal + extensionDelta;

  /* ================= SUBMIT ================= */

  function submit(e: React.FormEvent) {
    e.preventDefault();

    transform((p: any) => {
      if (!p.new_end_date) delete p.new_end_date;

      if (p.manual_mode) {
        p.override_total_price = Number(p.manual_total || 0);
        delete p.price_per_day;
        delete p.global_discount;
      } else {
        p.override_price_per_day = Number(p.price_per_day || 0);
        p.discount_per_day =
          extDays > 0 ? Number(p.global_discount || 0) / extDays : 0;
        delete p.manual_total;
      }

      delete p.manual_mode;

      if (!p.advance_payment || p.advance_payment <= 0) {
        delete p.payment_method;
        delete p.reference;
        p.advance_payment = 0;
      }

      return p;
    });

    patch(route("rentals.extend", rental.id), { preserveScroll: true });
  }

  /* ================= RENDER ================= */

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Prolonger — Location #${rental.id}`} />

      <div className="space-y-4">
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
              Prolonger la location
            </h1>
          </div>

          {/* RIGHT (optional info – desktop only) */}
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-sm font-semibold">
              Location #{rental.id}
            </p>
            <p className="text-xs text-muted-foreground">
              Extension de durée
            </p>
          </div>
        </div>


        {/* Context */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg border bg-muted/40 p-4 text-sm">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-4 w-4 text-primary" /> Voiture
            </div>
            <div className="font-medium">{rental.car_label || "—"}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" /> Total actuel
            </div>
            <div className="font-medium">{oldTotal.toFixed(2)} DH</div>
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
              <CalendarIcon className="h-4 w-4 text-primary" /> Fin actuelle
            </div>
            <div className="font-medium">
              {new Date(rental.end_date).toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-6">
              {/* Duration */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Durée de l’extension
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Nouvelle date de fin</Label>
                    <Popover open={openCal} onOpenChange={setOpenCal}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-10 justify-between"
                        >
                          {selectedDate
                            ? selectedDate.toLocaleDateString("fr-FR")
                            : "Sélectionner une date"}
                          <ChevronDownIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={selectedDate ?? undefined}
                          fromDate={minSelectable}
                          locale={fr}
                          disabled={(date) => date <= currentEnd}
                          onSelect={handleSelectDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Jours ajoutés</Label>
                    <Input
                      type="number"
                      min={0}
                      value={extraDays}
                      onChange={(e) =>
                        handleDaysChange(Number(e.target.value || 0))
                      }
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Tarification
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Extension uniquement
                  </span>
                </div>

                <div className="flex rounded-md border bg-muted/40 p-1">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    variant={!data.manual_mode ? "default" : "ghost"}
                    onClick={() => setData("manual_mode", false)}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Automatique
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    variant={data.manual_mode ? "default" : "ghost"}
                    onClick={() => setData("manual_mode", true)}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Manuel
                  </Button>
                </div>

                {!data.manual_mode ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Prix par jour (DH)</Label>
                      <Input
                        type="number"
                        value={data.price_per_day}
                        onChange={(e) =>
                          setData("price_per_day", Number(e.target.value || 0))
                        }

                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Remise globale (DH)</Label>
                      <Input
                        type="number"
                        value={data.global_discount}
                        onChange={(e) =>
                          setData("global_discount", Number(e.target.value || 0))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs">Total extension (DH)</Label>
                    <Input
                      type="number"
                      value={data.manual_total ?? ""}
                      onChange={(e) =>
                        setData("manual_total", Number(e.target.value || 0))
                      }
                    />
                  </div>
                )}

                {/* Avance */}
                <div className="space-y-2">
                  <Label className="text-xs">
                    Avance sur l’extension
                    <span className="block text-muted-foreground">
                      Maximum : {extensionDelta.toFixed(0)} DH
                    </span>
                  </Label>

                  <ButtonGroup className="w-full">
                    <Input
                      type="number"
                      min={0}
                      max={extensionDelta}
                      value={data.advance_payment ?? ""}
                      onChange={(e) =>
                        setData(
                          "advance_payment",
                          Math.min(
                            Number(e.target.value || 0),
                            extensionDelta
                          )
                        )
                      }
                      className="h-10"
                      placeholder="Montant"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setData("advance_payment", extensionDelta)
                      }
                    >
                      Tout payer
                    </Button>
                  </ButtonGroup>
                </div>

                {/* ✅ PAYMENT METHOD + REFERENCE */}
                {advance > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Méthode de paiement */}
                    <div className="space-y-2">
                      <Label className="text-xs">Méthode de paiement</Label>

                      <Select
                        value={data.payment_method}
                        onValueChange={(value) => {
                          setData("payment_method", value);
                          if (!["virement", "cheque"].includes(value)) {
                            setData("reference", "");
                          }
                        }}
                      >
                        {/* 👇 full width */}
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Méthodes disponibles</SelectLabel>

                            <SelectItem value="cash">
                              <div className="flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                Espèces
                              </div>
                            </SelectItem>

                            <SelectItem value="virement">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Virement
                              </div>
                            </SelectItem>

                            <SelectItem value="cheque">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4" />
                                Chèque
                              </div>
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Référence (desktop à côté) */}
                    {["virement", "cheque"].includes(data.payment_method) && (
                      <div className="space-y-2">
                        <Label className="text-xs">Référence</Label>
                        <Input
                          type="text"
                          placeholder="Numéro de chèque ou virement"
                          value={data.reference}
                          onChange={(e) => setData("reference", e.target.value)}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* RIGHT */}
            <Card className="lg:sticky lg:top-6 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">
                  Résumé de l’extension
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-xl bg-primary/10 p-4 border">
                  <div className="text-xs text-muted-foreground">
                    À payer
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {remaining.toFixed(2)} DH
                  </div>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Avant</span>
                    <span>{oldTotal.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Après</span>
                    <span className="text-green-600">
                      {newGrandTotal.toFixed(2)} DH
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  type="submit"
                  className="w-full"
                  disabled={processing || !data.new_end_date || extDays <= 0}
                >
                  {processing ? "Enregistrement…" : "Prolonger la location"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}