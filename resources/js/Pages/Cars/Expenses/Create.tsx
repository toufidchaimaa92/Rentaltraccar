import React, { useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Calendar } from "@/Components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Save } from "lucide-react";

/* ================= TYPES ================= */

interface Props {
  car: { id: number; license_plate: string };
  allowedTypes?: string[];
}

/* ================= CONSTANTS ================= */

const TYPE_OPTIONS = [
  { value: "mecanique", label: "Réparation mécanique" },
  { value: "carrosserie", label: "Carrosserie" },
  { value: "entretien", label: "Entretien" },
  { value: "lavage", label: "Lavage" },
];

/* ================= PAGE ================= */

const Create: React.FC<Props> = ({ car, allowedTypes }) => {
  const safeTypes =
    allowedTypes?.length
      ? TYPE_OPTIONS.filter((t) => allowedTypes.includes(t.value))
      : TYPE_OPTIONS;

  const { props } = usePage();
  const errors = (props as any)?.errors || {};

  const [form, setForm] = useState({
    type: "",
    invoice_number: "",
    amount: "",
    notes: "",
  });

  // ✅ Default date = today
  const [date, setDate] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    router.post(
      route("car-expenses.store", car.id),
      {
        ...form,
        expense_date: format(date, "dd/MM/yyyy"),
      },
      {
        onFinish: () => setSubmitting(false),
        onSuccess: () => {
          router.visit(route("cars.show", car.id));
        },
      }
    );
  };

  return (
    <AuthenticatedLayout>
      <Head title="Ajouter une dépense" />

      <div className="w-full flex justify-center">
        <Card className="w-full max-w-2xl shadow-lg rounded-2xl flex flex-col min-h-[560px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Ajouter une dépense pour {car.license_plate}
            </CardTitle>
          </CardHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col"
            noValidate
          >
            <CardContent className="space-y-4 flex-1">

              {/* ================= TYPE ================= */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Type
                </label>
                <Select
                  value={form.type}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      type: val,
                      // ✅ Auto-fill amount for lavage
                      amount: val === "lavage" ? "40" : prev.amount,
                    }))
                  }
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
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.type}
                  </p>
                )}
              </div>

              {/* ================= INVOICE ================= */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Numéro de facture
                </label>
                <Input
                  name="invoice_number"
                  type="text"
                  value={form.invoice_number}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      invoice_number: e.target.value,
                    })
                  }
                  placeholder="Facultatif"
                />
                {errors.invoice_number && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.invoice_number}
                  </p>
                )}
              </div>

              {/* ================= AMOUNT ================= */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Montant (Dh)
                </label>
                <Input
                  name="amount"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.amount}
                  </p>
                )}
              </div>

              {/* ================= DATE ================= */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date de dépense
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.expense_date && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.expense_date}
                  </p>
                )}
              </div>

              {/* ================= NOTES ================= */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <Textarea
                  name="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="Informations supplémentaires..."
                />
                {errors.notes && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.notes}
                  </p>
                )}
              </div>
            </CardContent>

            {/* ================= FOOTER ================= */}
            <CardFooter className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={submitting}
              >
                <Save className="w-4 h-4" />
                {submitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default Create;
