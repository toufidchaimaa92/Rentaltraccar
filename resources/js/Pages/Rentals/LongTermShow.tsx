import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Link, useForm, router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Car,
  Clock,
  CreditCard,
  DollarSign,
  User,
} from "lucide-react";

/* ---------------- helpers ---------------- */
const formatDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("fr-FR") : "—";

const formatCurrency = (v?: number | string | null) => {
  const n = Number(v);
  return Number.isNaN(n) ? "—" : `${n.toFixed(2)} MAD`;
};

const cycleLabel = (days?: number | null) =>
  days ? `Tous les ${days} jours` : "—";

const overdueVariant = (s?: string) =>
  s === "overdue" ? "destructive" : s === "due_soon" ? "warning" : "success";

const vehicleStatusVariant = (status?: string) =>
  status === "active" ? "success" : "secondary";

/* ---------------- page ---------------- */
export default function LongTermShow({ auth, contract, primaryRentalId }: any) {
  const contractId = contract?.contract_id ?? primaryRentalId;

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endTargetId, setEndTargetId] = useState(contractId);

  const paymentForm = useForm({
    amount: "",
    method: "cash",
    reference: "",
    invoice_id: "",
  });

  const endForm = useForm({
    end_date:
      contract?.end_date ||
      contract?.next_payment_due_date ||
      contract?.start_date ||
      "",
    reason: "end_contract",
  });

  const invoices = contract?.invoices || [];
  const vehicles = contract?.vehicles || [];
  const payments = contract?.payments || [];
  const latestInvoice = invoices[0];

  const invoicesMap = useMemo(() => {
    const map = new Map();
    invoices.forEach((i: any) => map.set(String(i.id), i));
    return map;
  }, [invoices]);

  /* ---------------- actions ---------------- */
  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const invoiceRentalId = paymentForm.data.invoice_id
      ? invoicesMap.get(String(paymentForm.data.invoice_id))?.rental_id
      : contractId;

    paymentForm.post(
      route("rentals.longTerm.recordPayment", invoiceRentalId || contractId),
      {
        onSuccess: () => {
          setShowPaymentDialog(false);
          paymentForm.reset();
          router.reload();
        },
      }
    );
  };

  const submitEndRental = (e: React.FormEvent) => {
    e.preventDefault();
    endForm.post(route("rentals.longTerm.end", endTargetId), {
      onSuccess: () => setShowEndDialog(false),
    });
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Contrat LLD #{contractId}
          </h1>

          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={route("rentals.longTerm.index")}>Retour</Link>
            </Button>

            {/* PAYMENT */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Enregistrer un paiement</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Paiement reçu</DialogTitle>
                  <DialogDescription>
                    Saisissez le règlement et associez-le à une facture si nécessaire.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={submitPayment} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Montant</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentForm.data.amount}
                      onChange={(e) =>
                        paymentForm.setData("amount", e.target.value)
                      }
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Méthode</Label>
                      <Select
                        value={paymentForm.data.method}
                        onValueChange={(v) =>
                          paymentForm.setData("method", v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choisir la méthode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Espèces</SelectItem>
                          <SelectItem value="virement">Virement</SelectItem>
                          <SelectItem value="cheque">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Facture (optionnel)</Label>
                      <Select
                        value={paymentForm.data.invoice_id || "none"}
                        onValueChange={(v) =>
                          paymentForm.setData(
                            "invoice_id",
                            v === "none" ? "" : v
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Aucune facture" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune</SelectItem>
                          {invoices.map((i: any) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              Facture #{i.id} — {formatDate(i.due_date)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Référence</Label>
                    <Input
                      value={paymentForm.data.reference}
                      onChange={(e) =>
                        paymentForm.setData("reference", e.target.value)
                      }
                    />
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button type="submit">Valider</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* END CONTRACT */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Clôturer le contrat
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clôturer le contrat</DialogTitle>
                  <DialogDescription>
                    Définissez la date de fin et le motif de clôture.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={submitEndRental} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={endForm.data.end_date}
                      onChange={(e) =>
                        endForm.setData("end_date", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Motif de clôture</Label>
                    <Select
                      value={endForm.data.reason}
                      onValueChange={(v) =>
                        endForm.setData("reason", v)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choisir un motif" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="end_contract">Fin de contrat</SelectItem>
                        <SelectItem value="client_request">Demande du client</SelectItem>
                        <SelectItem value="vehicle_issue">Problème véhicule</SelectItem>
                        <SelectItem value="non_payment">Impayé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button type="submit" variant="destructive">
                      Confirmer
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* STATUS */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Suivi des échéances
            </CardTitle>
            <Badge variant={overdueVariant(contract?.overdue_status)}>
              {contract?.overdue_status === "overdue"
                ? "En retard"
                : contract?.overdue_status === "due_soon"
                ? "Échéance proche"
                : "À jour"}
            </Badge>
          </CardHeader>

          <CardContent className="grid md:grid-cols-3 gap-6 text-sm">
            <Info label="Prochaine échéance">
              {formatDate(contract?.next_payment_due_date)}
            </Info>
            <Info label="Cycle">
              {cycleLabel(contract?.payment_cycle_days)}
            </Info>
            <Info label="Mensuel">
              <div className="space-y-1">
                <p className="font-semibold">{formatCurrency(contract?.monthly_total_ttc ?? contract?.monthly_total)}</p>
                <p className="text-xs text-muted-foreground">
                  HT {formatCurrency(contract?.monthly_total_ht)} · TVA {formatCurrency(contract?.monthly_total_tva)}
                </p>
              </div>
            </Info>
          </CardContent>
        </Card>

        <VehiclesTable
          vehicles={vehicles}
          setEndTargetId={setEndTargetId}
          setShowEndDialog={setShowEndDialog}
        />

        <InvoicesTable
          invoices={invoices}
          paymentForm={paymentForm}
          setShowPaymentDialog={setShowPaymentDialog}
        />

        <PaymentsTable payments={payments} />
      </div>
    </AuthenticatedLayout>
  );
}

/* ---------------- reusable ---------------- */

function Info({ label, children }: any) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-semibold">{children}</p>
    </div>
  );
}

function VehiclesTable({ vehicles, setEndTargetId, setShowEndDialog }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Véhicules du contrat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modèle</TableHead>
              <TableHead>Plaque</TableHead>
              <TableHead>Loyer</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {vehicles.map((v: any) => (
                <TableRow key={v.id} className={v.status === "active" ? "bg-muted/50" : undefined}>
                  <TableCell>{v?.carModel?.brand} {v?.carModel?.model}</TableCell>
                  <TableCell>{v?.car?.license_plate}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{formatCurrency(v?.monthly_price_ttc ?? v?.monthly_price)}</span>
                      <span className="text-xs text-muted-foreground">
                        HT {formatCurrency(v?.monthly_price_ht)} · TVA {formatCurrency(v?.monthly_tva_amount)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{formatDate(v?.start_date)}</span>
                      <span className="text-xs text-muted-foreground">
                        {v?.end_date ? formatDate(v.end_date) : "En cours"}
                      </span>
                    </div>
                  </TableCell>
                <TableCell>
                  <Badge variant={vehicleStatusVariant(v.status)}>
                    {v.status}
                  </Badge>
                </TableCell>
                <TableCell>#{v.id}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline" className="mr-2">
                    <Link href={route("rentals.show", v.id)}>
                      Voir la location
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEndTargetId(v.id);
                      setShowEndDialog(true);
                    }}
                  >
                    Retirer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function InvoicesTable({ invoices, paymentForm, setShowPaymentDialog }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Factures
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {invoices.map((i: any) => (
              <TableRow key={i.id}>
                <TableCell>#{i.id}</TableCell>
                <TableCell>
                  {formatDate(i.period_start)} → {formatDate(i.period_end)}
                </TableCell>
                <TableCell>{formatCurrency(i.amount_due)}</TableCell>
                <TableCell>{formatDate(i.due_date)}</TableCell>
                <TableCell>
                  <Badge variant={i.status === "paid" ? "success" : "secondary"}>
                    {i.status === "paid" ? "Payée" : "En attente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={route("rentals.longTerm.invoice.show", i.id)}>
                      Voir
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      paymentForm.setData("invoice_id", String(i.id));
                      setShowPaymentDialog(true);
                    }}
                  >
                    Encaisser
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PaymentsTable({ payments }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Historique des paiements
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Méthode</TableHead>
              <TableHead>Référence</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {payments.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>{formatDate(p.date)}</TableCell>
                <TableCell>{formatCurrency(p.amount)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{p.method}</Badge>
                </TableCell>
                <TableCell>{p.reference || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
