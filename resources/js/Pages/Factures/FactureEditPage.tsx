import React, { useMemo } from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { useForm, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Head } from "@inertiajs/react";

interface FactureItemForm {
  description: string;
  period: {
    from: string | null;
    to: string | null;
  };
  quantity: number | string;
  unit_price: number | string;
}

interface FactureEditPageProps {
  auth: { user: any };
  facture: {
    id: number;
    invoice_number: string;
    client_name: string;
    client_address?: string | null;
    client_rc?: string | null;
    client_ice?: string | null;
    tax_rate: number;
    date: string;
    notes?: string | null;
    payment_status: string;
    items: FactureItemForm[];
  };
  statuses: string[];
}

const PAYMENT_STATUS_FALLBACK = ["Payée", "Pas encore payée"];

export default function FactureEditPage({ auth, facture, statuses }: FactureEditPageProps) {
  const statusOptions = statuses?.length ? statuses : PAYMENT_STATUS_FALLBACK;

  const initialItems = useMemo(() => {
    if (!facture?.items || facture.items.length === 0) {
      return [
        {
          description: "",
          period: { from: null, to: null },
          quantity: 1,
          unit_price: 0,
        },
      ];
    }

    return facture.items.map((item) => ({
      description: item.description ?? "",
      period: {
        from: item.period?.from ?? null,
        to: item.period?.to ?? null,
      },
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price ?? 0,
    }));
  }, [facture?.items]);

  const { data, setData, put, processing, errors } = useForm({
    invoice_number: facture?.invoice_number ?? "",
    client_name: facture?.client_name ?? "",
    client_address: facture?.client_address ?? "",
    client_rc: facture?.client_rc ?? "",
    client_ice: facture?.client_ice ?? "",
    tax_rate: facture?.tax_rate ?? 0,
    date: facture?.date ?? "",
    notes: facture?.notes ?? "",
    payment_status: facture?.payment_status ?? statusOptions[0],
    items: initialItems,
  });

  const safeNumber = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === "") {
      return 0;
    }
    const parsed = typeof value === "number" ? value : parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const subtotal = useMemo(
    () =>
      data.items.reduce(
        (sum: number, item: FactureItemForm) =>
          sum + safeNumber(item.quantity) * safeNumber(item.unit_price),
        0
      ),
    [data.items]
  );

  const taxAmount = subtotal * (safeNumber(data.tax_rate) / 100);
  const total = subtotal + taxAmount;

  const updateItem = (index: number, field: keyof FactureItemForm, value: any) => {
    const nextItems = data.items.map((item, idx) => {
      if (idx !== index) return item;
      if (field === "period") {
        return {
          ...item,
          period: value,
        };
      }
      return {
        ...item,
        [field]: value,
      };
    });

    setData("items", nextItems);
  };

  const updateItemPeriod = (index: number, key: "from" | "to", value: string) => {
    const nextValue = value === "" ? null : value;
    const targetItem = data.items[index];
    updateItem(index, "period", {
      ...targetItem.period,
      [key]: nextValue,
    });
  };

  const addItem = () => {
    setData("items", [
      ...data.items,
      {
        description: "",
        period: { from: null, to: null },
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) return;
    setData(
      "items",
      data.items.filter((_, idx) => idx !== index)
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    put(route("factures.update", facture.id));
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={`Modifier Facture #${facture.invoice_number}`} />
      <div className="flex justify-center min-h-screen">
        <Card className="w-full max-w-4xl shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-xl font-semibold">Modifier la facture</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="invoice_number" className="text-sm text-muted-foreground">
                  Facture #
                </Label>
                <Input
                  id="invoice_number"
                  value={data.invoice_number}
                  onChange={(event) => setData("invoice_number", event.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <form onSubmit={handleSubmit} className="space-y-6">
            <CardContent className="space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1 text-muted-foreground">
                  <p>RC: 158687</p>
                  <p>ICE: 003030322000030</p>
                  <p>99 lot Haj Slimane CYM Rabat - Yacoub El Mansour</p>
                  <p>Téléphone: 06 30 04 40 28</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Facturé le</Label>
                  <Input
                    id="date"
                    type="date"
                    value={data.date}
                    onChange={(event) => setData("date", event.target.value)}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
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
                    <Label htmlFor="client_address">Adresse</Label>
                    <Textarea
                      id="client_address"
                      value={data.client_address || ""}
                      onChange={(event) => setData("client_address", event.target.value)}
                      rows={3}
                    />
                    {errors.client_address && (
                      <p className="text-sm text-destructive">{errors.client_address}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_rc">RC</Label>
                    <Input
                      id="client_rc"
                      value={data.client_rc || ""}
                      onChange={(event) => setData("client_rc", event.target.value)}
                    />
                    {errors.client_rc && (
                      <p className="text-sm text-destructive">{errors.client_rc}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_ice">ICE</Label>
                    <Input
                      id="client_ice"
                      value={data.client_ice || ""}
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
                <div className="space-y-4">
                  {data.items.map((item, index) => (
                    <div key={index} className="rounded-md border p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={item.description}
                            onChange={(event) => updateItem(index, "description", event.target.value)}
                            placeholder="Libellé de l'article"
                          />
                          {errors[`items.${index}.description` as keyof typeof errors] && (
                            <p className="text-sm text-destructive">
                              {errors[`items.${index}.description` as keyof typeof errors] as string}
                            </p>
                          )}
                        </div>
                        <div className="flex md:justify-end">
                          {data.items.length > 1 && (
                            <Button type="button" variant="ghost" onClick={() => removeItem(index)}>
                              Supprimer
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Période - début</Label>
                          <Input
                            type="date"
                            value={item.period?.from ?? ""}
                            onChange={(event) => updateItemPeriod(index, "from", event.target.value)}
                          />
                          {errors[`items.${index}.period.from` as keyof typeof errors] && (
                            <p className="text-sm text-destructive">
                              {errors[`items.${index}.period.from` as keyof typeof errors] as string}
                            </p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label>Période - fin</Label>
                          <Input
                            type="date"
                            value={item.period?.to ?? ""}
                            onChange={(event) => updateItemPeriod(index, "to", event.target.value)}
                          />
                          {errors[`items.${index}.period.to` as keyof typeof errors] && (
                            <p className="text-sm text-destructive">
                              {errors[`items.${index}.period.to` as keyof typeof errors] as string}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="grid gap-2">
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) => updateItem(index, "quantity", event.target.value)}
                          />
                          {errors[`items.${index}.quantity` as keyof typeof errors] && (
                            <p className="text-sm text-destructive">
                              {errors[`items.${index}.quantity` as keyof typeof errors] as string}
                            </p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label>PU (HT)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) => updateItem(index, "unit_price", event.target.value)}
                          />
                          {errors[`items.${index}.unit_price` as keyof typeof errors] && (
                            <p className="text-sm text-destructive">
                              {errors[`items.${index}.unit_price` as keyof typeof errors] as string}
                            </p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label>Prix HT</Label>
                          <div className="flex h-10 items-center rounded-md border px-3 text-sm">
                            {(safeNumber(item.quantity) * safeNumber(item.unit_price)).toFixed(2)} DH
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold">Notes</h2>
                <Textarea
                  value={data.notes || ""}
                  onChange={(event) => setData("notes", event.target.value)}
                  rows={4}
                />
                {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold">Taxe &amp; statut</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">Taxe (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={data.tax_rate}
                      readOnly
                      aria-readonly
                      className="bg-muted/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      La TVA est verrouillée pour les factures existantes.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_status">Statut de paiement</Label>
                    <Select value={data.payment_status} disabled>
                      <SelectTrigger
                        id="payment_status"
                        className="w-full"
                        disabled
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Le statut de paiement ne peut pas être modifié depuis cette page.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">Récapitulatif</h2>
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
              </section>
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button asChild variant="ghost" type="button" disabled={processing}>
                <Link href={route("factures.show", facture.id)}>Annuler</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
