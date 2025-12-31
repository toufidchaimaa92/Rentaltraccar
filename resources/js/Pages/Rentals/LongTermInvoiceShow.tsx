import React from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Link } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Car,
  Clock,
  Download,
  FileText,
} from "lucide-react";

/* ---------------- helpers ---------------- */
const formatDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR") : "—";

const formatCurrency = (v?: number | string | null) => {
  const n = Number(v);
  return Number.isNaN(n) ? "—" : `${n.toFixed(2)} MAD`;
};

const invoiceVariant = (invoice: any) =>
  invoice?.status === "paid"
    ? "success"
    : invoice?.severity === "severely_overdue" ||
      invoice?.severity === "overdue"
    ? "destructive"
    : invoice?.severity === "due_soon"
    ? "warning"
    : "secondary";

/* ---------------- small UI ---------------- */
function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold">{children}</p>
    </div>
  );
}

/* ---------------- page ---------------- */
export default function LongTermInvoiceShow({ auth, invoice, contract }: any) {
  const contractId = contract?.contract_id;
  const invoiceTotals = {
    ttc: Number(invoice?.group_total_ttc ?? invoice?.group_total ?? invoice?.amount_due ?? 0),
  };
  invoiceTotals.ttc = Number.isNaN(invoiceTotals.ttc) ? 0 : invoiceTotals.ttc;
  const invoiceHt = Number(
    invoice?.group_total_ht ??
      (invoiceTotals.ttc ? invoiceTotals.ttc / 1.2 : 0)
  );
  const invoiceTva = Number(
    invoice?.group_total_tva ??
      (invoiceTotals.ttc ? invoiceTotals.ttc - invoiceHt : 0)
  );

  const contractTotals = {
    ht: Number(contract?.monthly_total_ht ?? 0),
    tva: Number(contract?.monthly_total_tva ?? 0),
    ttc: Number(contract?.monthly_total_ttc ?? contract?.monthly_total ?? 0),
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <div className="space-y-8">

        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            Facture LLD #{invoice?.id}
          </h1>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a
                href={route("rentals.longTerm.invoice.pdf", invoice?.id)}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </a>
            </Button>
            <Button asChild>
              <Link href={route("rentals.longTerm.show", contractId)}>
                Retour
              </Link>
            </Button>
          </div>
        </div>

        {/* OVERDUE ALERT */}
        {(invoice?.severity === "overdue" ||
          invoice?.severity === "severely_overdue") && (
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold">Facture en retard</p>
                <p className="text-sm text-muted-foreground">
                  Cette facture n’a pas encore été réglée.
                </p>
              </div>
              <Badge variant="destructive">En retard</Badge>
            </CardContent>
          </Card>
        )}

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* INVOICE */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Facture
              </CardTitle>

              <Badge variant={invoiceVariant(invoice)}>
                {invoice?.status === "paid"
                  ? "Payée"
                  : invoice?.severity === "severely_overdue"
                  ? "Très en retard"
                  : invoice?.severity === "overdue"
                  ? "En retard"
                  : invoice?.severity === "due_soon"
                  ? "Échéance proche"
                  : "En attente"}
              </Badge>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Info label="Montant dû">
                <div className="space-y-1">
                  <p className="font-semibold">{formatCurrency(invoiceTotals.ttc)}</p>
                  <p className="text-xs text-muted-foreground">
                    HT {formatCurrency(invoiceHt)} · TVA {formatCurrency(invoiceTva)}
                  </p>
                </div>
              </Info>

              <Info label="Échéance">
                {formatDate(invoice?.due_date)}
              </Info>

              <Info label="Période">
                {formatDate(invoice?.period_start)} →{" "}
                {formatDate(invoice?.period_end)}
              </Info>

              <Info label="Type">
                {invoice?.is_prorated ? "Prorata" : "Mensuel"}
              </Info>

              <Info label="Payée le">
                {formatDate(invoice?.paid_at)}
              </Info>

              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-1">
                  Notes
                </p>
                <p className="font-medium">
                  {invoice?.description || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CONTRACT */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Contrat
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Info label="Numéro">#{contractId}</Info>
              <Info label="Cycle">
                {contract?.payment_cycle_days
                  ? `Tous les ${contract.payment_cycle_days} jours`
                  : "—"}
              </Info>
              <Info label="Mensuel">
                <div className="space-y-1">
                  <p className="font-semibold">{formatCurrency(contractTotals.ttc)}</p>
                  <p className="text-xs text-muted-foreground">
                    HT {formatCurrency(contractTotals.ht)} · TVA {formatCurrency(contractTotals.tva)}
                  </p>
                </div>
              </Info>
            </CardContent>
          </Card>
        </div>

        {/* VEHICLES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Véhicules facturés
            </CardTitle>
          </CardHeader>

          <CardContent className="divide-y">
            {invoice?.vehicles?.length ? (
              invoice.vehicles.map((v: any) => (
                <div
                  key={`${invoice.id}-${v.rental_id}`}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {v?.carModel?.brand} {v?.carModel?.model}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {v?.car?.license_plate || "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold whitespace-nowrap">
                      {formatCurrency(v?.amount_ttc ?? v?.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      HT {formatCurrency(v?.amount_ht ?? v?.amount)} · TVA {formatCurrency(v?.tva_amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                Aucun véhicule facturé.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
