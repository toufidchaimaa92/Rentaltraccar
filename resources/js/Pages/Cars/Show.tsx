import React, { useMemo } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Car as CarIcon, CreditCard, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  rented: "Louée",
  reserved: "Réservée",
  maintenance: "Maintenance",
};

function fmtDateStr(v?: string | null): string {
  if (!v) return "N/A";
  if (v.includes("/")) return v;
  const base = v.includes("T") ? v.split("T")[0] : v;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(base);
  if (!m) return "N/A";
  const [, y, mm, dd] = m;
  return `${dd}/${mm}/${y}`;
}

function fmtNumber(n?: number | null): string {
  const num = Number(n ?? 0);
  return isNaN(num) ? "0" : num.toLocaleString("fr-FR");
}

function fmtMoney(n?: number | null): string {
  const num = Number(n ?? 0);
  const rendered = isNaN(num)
    ? "0,00"
    : num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return `${rendered} Dh`;
}

export default function ShowCar() {
  const { auth, car, totals } = usePage().props;

  const insuranceMonthlyDerived = useMemo(() => {
    const annual = Number(car?.assurance_prix_annuel ?? 0);
    return annual > 0 && !isNaN(annual)
      ? Math.round((annual / 12) * 100) / 100
      : 0;
  }, [car?.assurance_prix_annuel]);

  const insuranceMonthlyToShow =
    typeof totals?.insuranceMonthly === "number"
      ? totals.insuranceMonthly
      : insuranceMonthlyDerived;

  const statusClasses: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-800",
    rented: "bg-amber-100 text-amber-800",
    reserved: "bg-blue-100 text-blue-800",
    maintenance: "bg-rose-100 text-rose-800",
  };

  const statusKey = car?.status ?? "";

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={`Voiture ${car.license_plate || "N/A"}`} />

      <div className="space-y-6">

        {/* PAGE TITLE */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Voiture # {car.license_plate || "N/A"}
          </h1>
          <Link href={route("cars.index")}>
            <Button variant="secondary">Retour</Button>
          </Link>
        </div>

        {/* 2 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT — INFO CARTE */}
          <Card className="border shadow-sm">

            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle className="flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-primary" />
                Informations sur la voiture
              </CardTitle>

              <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                <Link href={route("cars.edit", car.id)}>
                  <Pencil className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="space-y-6 text-sm">

              {/* SECTION — Identité */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Identité</h4>

                <div className="space-y-2">
                  {[
                    ["ID Modèle", car.car_model_id],
                    ["Modèle", car.car_model?.name],
                    ["Immatriculation", car.license_plate],
                    ["WW", car.wwlicense_plate],
                  ].map(([label, value], i) => (
                    <div key={i} className="flex justify-between">
                      <span>{label}</span>
                      <span className="font-medium">{value ?? "N/A"}</span>
                    </div>
                  ))}

                  {/* Statut */}
                  <div className="flex justify-between pt-2 border-t">
                    <span>Statut</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusClasses[statusKey] || "bg-gray-100 text-gray-800"
                        }`}
                    >
                      {STATUS_LABELS[statusKey] ?? car.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* SECTION — Validité */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Documents & Validités</h4>

                <div className="space-y-2">
                  {[
                    ["Expiration assurance", fmtDateStr(car.insurance_expiry_date)],
                    ["Contrôle technique", fmtDateStr(car.technical_check_expiry_date)],
                  ].map(([label, value], i) => (
                    <div key={i} className="flex justify-between">
                      <span>{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t" />

              {/* SECTION — Technique */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Technique</h4>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Kilométrage</span>
                    <span className="font-medium">{fmtNumber(car.mileage)} km</span>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* SECTION — Financier (KEPT HERE) */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Financier</h4>

                <div className="space-y-2">
                  {[
                    ["Prix d'achat", fmtMoney(car.purchase_price)],
                    ["Crédit mensuel", fmtMoney(car.monthly_credit)],
                    ["Début crédit", fmtDateStr(car.credit_start_date)],
                    ["Fin crédit", fmtDateStr(car.credit_end_date)],
                    ["Assurance annuel", fmtMoney(car.assurance_prix_annuel)],
                    ["Assurance mensuel estimé", fmtMoney(insuranceMonthlyDerived)],
                  ].map(([label, value], i) => (
                    <div key={i} className="flex justify-between">
                      <span>{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>


          {/* RIGHT — UNIFIED FINANCE CARD */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Finances de la voiture
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 text-sm">

              {/* SECTION — Ce mois */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Ce mois</h4>

                <div className="flex justify-between">
                  <span>Bénéfice</span>
                  <span className="font-bold text-green-600">
                    {fmtMoney(totals?.monthlyBenefit)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Dépense</span>
                  <span className="font-bold text-red-600">
                    {fmtMoney(totals?.monthlyExpense)}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t">
                  <span>Résultat</span>
                  <span className="font-bold text-blue-600">
                    {fmtMoney(totals?.monthlyResult)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Jours loués</span>
                  <span className="font-bold">{totals?.monthlyRentedDays ?? 0}</span>
                </div>
              </div>

              <div className="border-t" />

              {/* SECTION — Total */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Total</h4>

                <div className="flex justify-between">
                  <span>Bénéfice total</span>
                  <span className="font-bold text-green-700">
                    {fmtMoney(totals?.totalBenefit)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Dépense totale</span>
                  <span className="font-bold text-red-700">
                    {fmtMoney(totals?.totalExpense)}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t">
                  <span>Résultat total</span>
                  <span className="font-bold text-blue-700">
                    {fmtMoney(totals?.totalResult)}
                  </span>
                </div>
              </div>

              <div className="border-t" />

              {/* SECTION — Dépenses */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Dépenses
                </h4>

                <div className="flex justify-between">
                  <span>Dépenses ce mois</span>
                  <span className="font-bold text-red-600">
                    {fmtMoney(totals?.monthlyExpense)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Crédit mensuel</span>
                  <span className="font-medium">{fmtMoney(car.monthly_credit)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Assurance mensuelle</span>
                  <span className="font-medium">{fmtMoney(insuranceMonthlyToShow)}</span>
                </div>

                <div className="text-center">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full font-medium border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Link href={`/cars/${car.id}/expenses`}>Voir les dépenses</Link>
                  </Button>
                </div>
              </div>

              <div className="border-t" />

              {/* SECTION — Bénéfices */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Bénéfices
                </h4>

                <div className="flex justify-between">
                  <span>Bénéfice (mois)</span>
                  <span className="font-bold text-green-700">
                    {fmtMoney(totals?.monthlyBenefit)}
                  </span>
                </div>

                <div className="text-center">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full font-medium border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <Link href={`/cars/${car.id}/benefits`}>Voir les bénéfices</Link>
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
