import React, { useMemo } from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";


type Period = { from: string | null; to: string | null };

type FactureItemForm = {
  description: string;
  period: Period;
  quantity: number | string;
  unit_price: number | string;
};

const PAYMENT_STATUS_OPTIONS = ["Payée", "Pas encore payée"];

export default function FactureCreatePage({ auth }) {
  const { data, setData, post, processing, errors } = useForm({
    invoice_number: "",
    client_name: "",
    client_address: "",
    client_rc: "",
    client_ice: "",
    items: [
      {
        description: "",
        period: { from: null, to: null },
        quantity: 1,
        unit_price: 0,
      },
    ] as FactureItemForm[],
    tax_rate: 20,
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    payment_status: PAYMENT_STATUS_OPTIONS[1],
  });

  const safeNumber = (val: number | string | null | undefined) => {
    if (val === "" || val === null || val === undefined) return 0;
    const parsed = typeof val === "number" ? val : parseFloat(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const subtotal = useMemo(
    () =>
      data.items.reduce(
        (sum: number, item: FactureItemForm) => sum + safeNumber(item.quantity) * safeNumber(item.unit_price),
        0,
      ),
    [data.items],
  );

  const taxAmount = subtotal * (safeNumber(data.tax_rate) / 100);
  const total = subtotal + taxAmount;

  const updateItem = (index: number, field: keyof FactureItemForm, value: any) => {
    const nextItems = data.items.map((item, idx) => {
      if (idx !== index) return item;
      if (field === "period") {
        return { ...item, period: value };
      }
      return { ...item, [field]: value };
    });

    setData("items", nextItems);
  };

  const updateItemPeriod = (index: number, key: keyof Period, value: string) => {
    const nextValue = value === "" ? null : value;
    const targetItem = data.items[index];
    updateItem(index, "period", { ...targetItem.period, [key]: nextValue });
  };

  const addItem = () => {
    setData("items", [
      ...data.items,
      { description: "", period: { from: null, to: null }, quantity: 1, unit_price: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    setData(
      "items",
      data.items.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    post(route("factures.store"));
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Créer une facture" />
      <div className="flex justify-center min-h-screen">
        <Card className="w-full max-w-4xl shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-xl font-semibold">Nouvelle facture</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="invoice_number" className="text-sm text-muted-foreground">
                  Facture #
                </Label>
                <Input
                  id="invoice_number"
                  value={data.invoice_number}
                  onChange={(event) => setData("invoice_number", event.target.value)}
                  className="w-28"
                />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <form onSubmit={handleSubmit} className="space-y-6">
            <CardContent className="space-y-6">

              {/* ------------------ UPDATED DATE SECTION ------------------ */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1 text-muted-foreground">
                  <p>RC: 158687</p>
                  <p>ICE: 003030322000030</p>
                  <p>99 lot Haj Slimane CYM Rabat - Yacoub El Mansour</p>
                  <p>Téléphone: 06 30 04 40 28</p>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="date" className="whitespace-nowrap text-sm">
                      Facturé le
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={data.date}
                      onChange={(event) => setData("date", event.target.value)}
                      className="w-40"
                    />
                  </div>
                  {errors.date && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.date}
                    </p>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold">Client</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_name">Nom de la société</Label>
                    <Input
                      id="client_name"
                      value={data.client_name}
                      onChange={(event) => setData("client_name", event.target.value)}
                    />
                    {errors.client_name && (
                      <p className="text-sm text-destructive">{errors.client_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_rc">RC</Label>
                    <Input
                      id="client_rc"
                      value={data.client_rc}
                      onChange={(event) => setData("client_rc", event.target.value)}
                    />
                    {errors.client_rc && (
                      <p className="text-sm text-destructive">{errors.client_rc}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_address">Adresse</Label>
                    <Textarea
                      id="client_address"
                      value={data.client_address}
                      onChange={(event) => setData("client_address", event.target.value)}
                      rows={3}
                    />
                    {errors.client_address && (
                      <p className="text-sm text-destructive">{errors.client_address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_ice">ICE</Label>
                    <Input
                      id="client_ice"
                      value={data.client_ice}
                      onChange={(event) => setData("client_ice", event.target.value)}
                    />
                    {errors.client_ice && (
                      <p className="text-sm text-destructive">{errors.client_ice}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-3">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <h2 className="text-base font-semibold">Articles</h2>
    <Button type="button" variant="outline" onClick={addItem}>
      Ajouter un article
    </Button>
  </div>

  {/* FULL TABLE CONTAINER */}
  <div className="border rounded-md overflow-hidden">

    {/* HEADER (Desktop only) */}
    <div className="hidden md:grid grid-cols-[2fr_repeat(5,1fr)_auto] px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 border-b">
      <span>Description</span>
      <span>Début</span>
      <span>Fin</span>
      <span>Qté</span>
      <span>PU HT</span>
      <span>Total HT</span>
      <span></span>
    </div>

    {/* ROWS */}
    {data.items.map((item, index) => (
      <div
        key={index}
        className="grid grid-cols-1 md:grid-cols-[2fr_repeat(5,1fr)_auto] gap-2 items-center px-3 py-2 border-b last:border-0"
      >

        {/* Description */}
        <Textarea
          value={item.description}
          onChange={(e) => updateItem(index, "description", e.target.value)}
          placeholder="Description..."
          rows={2}
          className="resize-none h-[44px] leading-tight text-sm"
        />

        {/* Début */}
        <Input
          type="date"
          value={item.period?.from ?? ""}
          onChange={(e) => updateItemPeriod(index, "from", e.target.value)}
          className="h-[44px] text-center"
        />

        {/* Fin */}
        <Input
          type="date"
          value={item.period?.to ?? ""}
          onChange={(e) => updateItemPeriod(index, "to", e.target.value)}
          className="h-[44px] text-center"
        />

        {/* Qté */}
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => updateItem(index, "quantity", e.target.value)}
          className="h-[44px] text-right"
        />

        {/* PU HT */}
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.unit_price}
          onChange={(e) => updateItem(index, "unit_price", e.target.value)}
          placeholder="0.00"
          className="h-[44px] text-right"
        />

        {/* Total HT */}
        <div className="flex h-[44px] items-center justify-end font-semibold text-sm">
          {(safeNumber(item.quantity) * safeNumber(item.unit_price)).toFixed(2)} DH
        </div>

        {/* Delete */}
        <div className="flex justify-end">
          {data.items.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="text-red-500 hover:bg-red-100/40 dark:hover:bg-red-500/10 hover:rotate-12 transition-transform"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    ))}
  </div>
</section>



              <section className="space-y-3">
                <h2 className="text-base font-semibold">Informations finales</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notes */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Notes</h3>
                    <Textarea
                      value={data.notes}
                      onChange={(event) => setData("notes", event.target.value)}
                      rows={5}
                      placeholder="Notes supplémentaires (conditions de paiement, etc.)"
                    />
                    {errors.notes && (
                      <p className="text-sm text-destructive">{errors.notes}</p>
                    )}
                  </div>

                  {/* Récapitulatif */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Récapitulatif</h3>
                    <div className="rounded-md border p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Sous-total</span>
                        <span>{subtotal.toFixed(2)} DH</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Taxe ({safeNumber(data.tax_rate).toFixed(0)}%)</span>
                        <span>{taxAmount.toFixed(2)} DH</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between font-semibold">
                        <span>Total</span>
                        <span>{total.toFixed(2)} DH</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button asChild variant="ghost" type="button" disabled={processing}>
                <Link href={route("factures.index")}>Annuler</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Enregistrement..." : "Créer la facture"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}