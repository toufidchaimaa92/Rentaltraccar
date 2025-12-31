import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Inertia } from "@inertiajs/inertia";
import { Link } from "@inertiajs/react";
import { format, parseISO } from "date-fns";

// shadcn/ui
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// icons
import { Download, RefreshCcw, Pencil } from "lucide-react";

export default function FacturePage({ auth, facture }) {
  const [openRenew, setOpenRenew] = useState(false);
  const [renewDate, setRenewDate] = useState(() => suggestNextDate(facture?.date));
  const [loadingRenew, setLoadingRenew] = useState(false);

  const { subtotal, taxAmount, total } = useMemo(() => {
    const st = (facture?.items || []).reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
    const tax = st * (Number(facture?.tax_rate || 0) / 100);
    return { subtotal: st, taxAmount: tax, total: st + tax };
  }, [facture]);

  const paid = facture?.payment_status === "Payée";

  const formatPeriod = (period) => {
    if (!period) return "—";
    try {
      const p = typeof period === "string" ? JSON.parse(period) : period;
      const from = p?.from ? format(parseISO(p.from), "dd/MM/yyyy") : "";
      const to = p?.to ? format(parseISO(p.to), "dd/MM/yyyy") : "";
      if (from && to) return `${from} - ${to}`;
      if (from) return from;
      return "—";
    } catch {
      return String(period);
    }
  };

  const formatMoney = (n) => `${Number(n || 0).toFixed(2)} DH`;

  const calculateAmount = (q, up) => Number(q) * Number(up);

  const onConfirmRenew = () => {
    if (loadingRenew) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(renewDate)) return alert("Format de date invalide (YYYY-MM-DD)");

    setLoadingRenew(true);
    Inertia.post(
      // If using Ziggy, route helper supports an object param: { facture: facture.id }
      route("factures.renew", facture.id),
      { date: renewDate, invoice_number: "" },
      {
        onFinish: () => setLoadingRenew(false),
        onSuccess: (page) => {
          // best-effort navigate to the new facture if backend returns it
          if (page?.props?.facture?.id) {
            Inertia.visit(route("factures.show", page.props.facture.id));
          } else {
            setOpenRenew(false);
          }
        },
        onError: (errors) => {
          console.error(errors);
          alert(errors?.date?.[0] || errors?.message || "Erreur lors du renouvellement");
        },
      }
    );
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <div className="flex justify-center min-h-screen">
        <div className="w-full max-w-4xl space-y-6">
          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href={route("factures.edit", facture.id)}>
                <Pencil className="mr-2 h-4 w-4" /> Modifier la facture
              </Link>
            </Button>

            {/* Server-rendered PDF download */}
            <Button asChild variant="secondary">
              <a href={route("factures.download", { facture: facture.id })} target="_blank" rel="noopener">
                <Download className="mr-2 h-4 w-4" /> Télécharger PDF
              </a>
            </Button>

            {/* Renew dialog */}
            <Dialog open={openRenew} onOpenChange={setOpenRenew}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Renouveler la facture
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Renouveler la facture</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="renew-date" className="text-right">Date</Label>
                    <Input
                      id="renew-date"
                      type="date"
                      value={renewDate}
                      onChange={(e) => setRenewDate(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Annuler</Button>
                  </DialogClose>
                  <Button onClick={onConfirmRenew} disabled={loadingRenew}>
                    {loadingRenew ? "Renouvellement…" : "Confirmer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Invoice */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Taliani Auto</CardTitle>
                <div className="text-sm">Facture # <strong>{facture.invoice_number}</strong></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company + Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <p>RC: 158687</p>
                  <p>ICE: 003030322000030</p>
                </div>
                <div className="flex sm:justify-end">
                  <div className="text-right space-y-1">
                    <p className="text-muted-foreground">Facturé le :</p>
                    <p className="font-medium">{facture.date}</p>
                    <div className="pt-1">
                      <Badge variant={paid ? "secondary" : "destructive"}>
                        {paid ? "Payée" : "Pas encore payée"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Client */}
              <div className="space-y-2">
                <div className="text-base font-semibold">Client</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <p><span className="font-semibold">Nom de la société :</span> {facture.client_name}</p>
                    <p><span className="font-semibold">Adresse :</span> {facture.client_address || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="font-semibold">RC :</span> {facture.client_rc || "—"}</p>
                    <p><span className="font-semibold">ICE :</span> {facture.client_ice || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="text-base font-semibold">Articles</div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead className="text-center w-[70px]">Qté</TableHead>
                        <TableHead className="text-center w-[90px]">PU(HT)</TableHead>
                        <TableHead className="text-center w-[100px]">PRIX HT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(facture.items || []).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="max-w-[240px] truncate leading-tight text-xs whitespace-nowrap">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-xs">{formatPeriod(item.period)}</TableCell>
                          <TableCell className="text-center text-xs">{item.quantity}</TableCell>
                          <TableCell className="text-center text-xs">{Number(item.unit_price).toFixed(2)}</TableCell>
                          <TableCell className="text-center text-xs">{calculateAmount(item.quantity, item.unit_price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes */}
              {facture?.notes && String(facture.notes).trim() !== "" && (
                <div className="space-y-1">
                  <div className="font-medium text-sm">Notes</div>
                  <p className="whitespace-pre-wrap text-xs text-muted-foreground">{facture.notes}</p>
                </div>
              )}

              {/* Summary */}
              <div className="flex justify-end">
                <div className="rounded-md border text-xs">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Sous-total</TableCell>
                        <TableCell className="text-right min-w-[120px]">{formatMoney(subtotal)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Taxe ({Number(facture.tax_rate).toFixed(0)}%)</TableCell>
                        <TableCell className="text-right">{formatMoney(taxAmount)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold text-sm">Total</TableCell>
                        <TableCell className="font-semibold text-sm text-right">{formatMoney(total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
            <CardFooter />
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function suggestNextDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const n = new Date(d);
    n.setMonth(d.getMonth() + 1);
    return n.toISOString().split("T")[0];
  } catch {
    return "";
  }
}
