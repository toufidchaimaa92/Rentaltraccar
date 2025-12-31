import React, { useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Calendar } from "@/Components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface Props {
  car: { id: number; license_plate: string };
  expense: {
    id: number;
    type: string;
    invoice_number?: string;
    amount: number;
    expense_date?: string;
    notes?: string;
  };
  allowedTypes?: string[];
}

const TYPE_OPTIONS = [
  { value: "mecanique", label: "Réparation mécanique" },
  { value: "carrosserie", label: "Carrosserie" },
  { value: "entretien", label: "Entretien" },
  { value: "lavage", label: "Lavage" },
];

const Edit: React.FC<Props> = ({ car, expense, allowedTypes }) => {
  const safeTypes =
    allowedTypes?.length
      ? TYPE_OPTIONS.filter((t) => allowedTypes.includes(t.value))
      : TYPE_OPTIONS;

  const { props } = usePage();
  const errors = (props as any)?.errors || {};

  const [date, setDate] = useState<Date | undefined>(
    expense.expense_date ? parseISO(expense.expense_date) : undefined
  );

  const [form, setForm] = useState({
    type: expense.type || "",
    invoice_number: expense.invoice_number || "",
    amount: expense.amount.toString(),
    notes: expense.notes || "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    router.put(
      route("car-expenses.update", [car.id, expense.id]),
      {
        ...form,
        expense_date: date ? format(date, "dd/MM/yyyy") : "",
      },
      {
        onFinish: () => setSubmitting(false),
        onSuccess: () => {
          // ✅ go back to the car show page after update
          router.visit(route("cars.show", car.id));
        },
      }
    );
  };

  return (
    <AuthenticatedLayout>
      <Head title="Modifier une dépense" />

      <div className="w-full flex justify-center py-10 px-4">
        <Card className="w-full max-w-2xl shadow-lg rounded-2xl flex flex-col min-h-[560px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Modifier la dépense pour {car.license_plate}
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
            <CardContent className="space-y-4 flex-1">
              {/* Type (Select) */}
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm({ ...form, type: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>

              {/* Invoice number */}
              <div>
                <label className="block text-sm font-medium mb-1">Numéro de facture</label>
                <Input
                  name="invoice_number"
                  type="text"
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                />
                {errors.invoice_number && <p className="text-red-500 text-xs mt-1">{errors.invoice_number}</p>}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1">Montant (Dh)</label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Date de dépense</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.expense_date && <p className="text-red-500 text-xs mt-1">{errors.expense_date}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  name="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Informations supplémentaires..."
                />
                {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 pt-4">
              <Button type="submit" className="px-6 py-2 rounded-xl" disabled={submitting}>
                {submitting ? "⏳ Mise à jour..." : "Mettre à jour"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default Edit;
