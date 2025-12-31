import React from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Printer, Users, Car, CreditCard } from "lucide-react";

// ---------------- Utils
function formatCurrency(value: number | string | undefined | null, fallback = "0.00") {
  if (value === undefined || value === null) return fallback;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? fallback : num.toFixed(2);
}

/** Diff en jours (non inclusif, comme diffInDays de Laravel) */
function diffDaysNonInclusive(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diff = Math.round((d2.getTime() - d1.getTime()) / MS_PER_DAY);
  return diff >= 0 ? diff : 0;
}

// ---------------- Types
interface Client {
  id?: number;
  name?: string;
  phone?: string;
  address?: string;
  identity_card_number?: string;
  license_number?: string;
  license_date?: string;
  license_expiration_date?: string;
}

interface CarModel {
  id?: number;
  brand?: string;
  model?: string;
  finish?: string;
  fuel_type?: string;
  transmission?: string;
}

interface Car {
  id?: number;
  license_plate?: string;
  model?: CarModel;
}

interface Payment {
  id?: number;
  amount?: number | string;
}

interface RentalExtension {
  id?: number;
  extension_days?: number;     // ✅ durée ajoutée (ex: 2)
  new_total?: number;          // grand total après extension
  old_total?: number;
  price_delta?: number;        // delta de l'extension (= new_total - old_total)
  new_end_date?: string;
  old_end_date?: string;
  ext_segment_total?: number;  // ✅ total de l'extension (ex: 200)
  ext_price_per_day_applied?: number;
  ext_discount_per_day?: number;
  ext_fees_json?: string;
  ext_override_total_applied?: boolean;
  ext_override_total_mode?: "segment" | "grand";
}

interface Rental {
  id: number;
  client?: Client;
  secondDriver?: Client;
  carModel?: CarModel;
  car?: Car;
  total_price?: number | string;
  price_per_day?: number | string;
  days?: number;
  start_date?: string;
  end_date?: string;
  pickup_time?: string;
  return_time?: string;
  manual_mode?: boolean;
  manual_total?: number | string | null;
  payments?: Payment[];
  extensions?: RentalExtension[];
  car_changes?: any[];
}

interface Props {
  auth: { user: { name?: string } };
  rental: Rental;
}

export default function RentalContract({ auth, rental }: Props) {
  if (!rental) return <div className="text-center py-10">Chargement...</div>;

  const client = rental.client || {};
  const secondDriver = rental.secondDriver || null;
  const carModel = rental.carModel || {};
  const car = rental.car || {};

  const isLongTerm = rental.rental_type === "long_term";
  const conductor = isLongTerm ? secondDriver || client : null;

  // Paiements (utile seulement si PAS d'extension)
  const totalPaid = rental.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) ?? 0;
  const totalPriceNum = Number(rental.total_price || 0);
  const remainingToPay = totalPriceNum - totalPaid;

  const hasModifications =
    (Array.isArray(rental.extensions) && rental.extensions.length > 0) ||
    (Array.isArray(rental.car_changes) && rental.car_changes.length > 0);

  // Second driver présent ?
  const hasSecondDriver =
    !isLongTerm &&
    !!(
      secondDriver &&
      (secondDriver.name ||
        secondDriver.phone ||
        secondDriver.address ||
        secondDriver.identity_card_number ||
        secondDriver.license_number)
    );

  // Fallback “manuel” (uniquement sans extension)
  const days = Number(rental.days || 0);
  const manual =
    Boolean(rental.manual_mode) ||
    (rental.manual_total !== null && rental.manual_total !== undefined);
  const manualTotalNum = Number(rental.total_price || 0);
  const estimatedPerDayManual = days > 0 ? Math.floor(manualTotalNum / days) : 0;

  // -------- Extensions : on prend la DERNIÈRE
  const extensions: RentalExtension[] = Array.isArray(rental.extensions) ? rental.extensions : [];
  const lastExt = extensions.length ? extensions[extensions.length - 1] : null;

  // Durée d'extension
  const extensionDays: number | null = lastExt
    ? (typeof lastExt.extension_days === "number"
        ? lastExt.extension_days
        : diffDaysNonInclusive(lastExt.old_end_date ?? undefined, lastExt.new_end_date ?? undefined))
    : null;

  // Total extension (priorité: ext_segment_total > price_delta > (new_total - old_total))
  const extensionTotal: number | null = lastExt
    ? (lastExt.ext_segment_total ?? lastExt.price_delta ??
        (lastExt.new_total !== undefined && lastExt.old_total !== undefined
          ? Number(lastExt.new_total) - Number(lastExt.old_total)
          : null))
    : null;

  return (
    <AuthenticatedLayout user={auth.user}>
      {/* First Page - Contract Details */}
      <div className="contract-print-area shadow-lg border rounded-md p-6 print:pt-0 print:mt-0 print:m-0 print:shadow-none print:border-0">
        {/* Header */}
        <header className="mt-0 pt-0 print:mt-0 print:pt-0 pb-4 flex justify-between items-center">
          <div className="text-lg font-bold print:text-xl">
            Taliani Auto
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm ">
              Contrat de location #{rental.id}
            </div>
            <div className="no-print">
              <Button asChild variant="outline" size="sm" className="ml-2">
                <a href={`/rentals/${rental.id}/contract/pdf`} target="_blank" rel="noopener">
                  <Printer className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <div className="contract-content space-y-4">
          {isLongTerm ? (
            <div className="flex flex-col gap-4">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Conducteur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm font-semibold">
                  {[
                    ["Nom complet", conductor?.driver_name || conductor?.name],
                    ["Téléphone", conductor?.phone],
                    ["Adresse", conductor?.address],
                    ["Carte d'identité", conductor?.identity_card_number],
                    ["Numéro de permis", conductor?.license_number],
                  ].map(([label, value], idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-medium">{label}</span>
                      <span>{(value as string) || "—"}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className={`flex gap-4 ${hasSecondDriver ? "flex-col print:flex-row" : "flex-col"}`}>
              {/* Client */}
              <Card className={`w-full ${hasSecondDriver ? "print:w-1/2" : "w-full"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm font-semibold">
                  {[
                    ["Nom complet", client?.name],
                    ["Téléphone", client?.phone],
                    ["Adresse", client?.address],
                    ["Carte d'identité", client?.identity_card_number],
                    ["Numéro de permis", client?.license_number],
                  ].map(([label, value], idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-medium">{label}</span>
                      <span>{(value as string) || "—"}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Deuxième conducteur */}
              {hasSecondDriver && (
                <Card className="w-full print:w-1/2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Deuxième Conducteur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {[
                      ["Nom complet", secondDriver!.name],
                      ["Téléphone", secondDriver!.phone],
                      ["Adresse", secondDriver!.address],
                      ["Carte d'identité", secondDriver!.identity_card_number],
                      ["Numéro de permis", secondDriver!.license_number],
                    ].map(([label, value], idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="font-medium text-muted-foreground">{label}</span>
                        <span className="font-semibold">{(value as string) || "—"}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Véhicule & Dates */}
          <div className="mt-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Véhicule & Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Marque / Modèle</span>
                  <span className="font-semibold">
                    {(carModel.brand ?? "—") + " " + (carModel.model ?? "—")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Finition</span>
                  <span className="font-semibold">{carModel.finish ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Carburant</span>
                  <span className="font-semibold">{carModel.fuel_type ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transmission</span>
                  <span className="font-semibold">{carModel.transmission ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Immatriculation</span>
                  <span className="font-semibold">{car.license_plate ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Du</span>
                  <span className="font-semibold">
                    {rental.start_date
                      ? new Date(rental.start_date).toLocaleDateString("fr-FR")
                      : "—"}
                    {rental.pickup_time && ` à ${rental.pickup_time.slice(0, 5)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Au</span>
                  <span className="font-semibold">
                    {rental.end_date
                      ? new Date(rental.end_date).toLocaleDateString("fr-FR")
                      : "—"}
                    {rental.return_time && ` à ${rental.return_time.slice(0, 5)}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Paiement (masqué pour les contrats LLD) */}
          {!isLongTerm && (
            <Card className={hasModifications ? "" : "md:col-span-2"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Paiement
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                {lastExt ? (
                  // --------- AVEC EXTENSION : on montre UNIQUEMENT extension
                  <>
                    <div className="flex justify-between">
                      <span>Durée d’extension</span>
                      <span className="font-semibold">
                        {extensionDays !== null ? `${extensionDays} jour(s)` : "—"}
                      </span>
                    </div>

                    <div className="flex justify-between border-t pt-2">
                      <span>Total extension</span>
                      <span className="font-semibold">
                        {extensionTotal !== null ? `${Number(extensionTotal).toFixed(2)} MAD` : "—"}
                      </span>
                    </div>
                  </>
                ) : (
                  // --------- SANS EXTENSION : affichage original
                  <>
                    <div className="flex justify-between">
                      <span>Durée</span>
                      <span>{rental.days} jour(s)</span>
                    </div>

                    {manual && days > 0 ? (
                      <div className="flex justify-between">
                        <span>Prix par jour</span>
                        <span className="font-semibold">{String(estimatedPerDayManual)} MAD</span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Prix par jour</span>
                        <span>{formatCurrency(rental.price_per_day)} MAD</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t pt-2">
                      <span>Total</span>
                      <span className="font-semibold">{formatCurrency(rental.total_price)} MAD</span>
                    </div>

                    {totalPaid > 0 && (
                      <div className="flex justify-between">
                        <span>Avance</span>
                        <span className="font-semibold text-green-600">-{formatCurrency(totalPaid)} MAD</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Reste à payer</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(remainingToPay)} MAD</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
