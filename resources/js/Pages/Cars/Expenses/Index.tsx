import React, { useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import {
  AdminTable,
  AdminTableColumn,
  AdminTableRow,
} from "@/components/admin/admin-table";
import AdminMobileCard from "@/components/admin/AdminMobileCard";
import {
  Edit,
  Trash2,
  ArrowLeft,
  CalendarDays,
  Plus,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

/* ================= TYPES ================= */

interface Expense {
  id: number;
  type: string;
  invoice_number?: string;
  amount: number;
  expense_date?: string;
  notes?: string;
}

interface ExpenseRow extends Expense {
  rowIndex: number;
}

interface Props {
  car: {
    id: number;
    license_plate: string;
  };
  expenses: Expense[];
}

/* ================= HELPERS ================= */

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    const d = parseISO(value);
    if (!isValid(d)) return value;
    return format(d, "dd/MM/yyyy");
  } catch {
    return value;
  }
}

function fmtMoney(n: number | string | null | undefined) {
  const num = Number(n ?? 0);
  return Number.isInteger(num) ? `${num} Dh` : `${num.toFixed(2)} Dh`;
}

/* ================= PAGE ================= */

const Index: React.FC<Props> = ({ car, expenses }) => {
  const handleDelete = (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette dépense ?")) {
      router.delete(route("car-expenses.destroy", [car.id, id]));
    }
  };

  const columns = useMemo<AdminTableColumn[]>(
    () => [
      { id: "index", label: "#" },
      { id: "type", label: "Type" },
      { id: "invoice", label: "Facture" },
      { id: "amount", label: "Montant" },
      { id: "date", label: "Date" },
      { id: "notes", label: "Notes" },
      { id: "actions", label: "Actions" },
    ],
    []
  );

  const rows = useMemo<ExpenseRow[]>(
    () => expenses.map((exp, index) => ({ ...exp, rowIndex: index + 1 })),
    [expenses]
  );

  const renderRow = (exp: ExpenseRow): AdminTableRow => ({
    key: exp.id,
    cells: [
      <span>{exp.rowIndex}</span>,
      <span>{exp.type}</span>,
      <span>{exp.invoice_number || "—"}</span>,
      <span className="font-semibold text-red-600">
        {fmtMoney(exp.amount)}
      </span>,
      <span>{formatDate(exp.expense_date)}</span>,
      <span className="text-muted-foreground">{exp.notes || "—"}</span>,
      <div className="flex items-center gap-3">
        <Link
          href={route("car-expenses.edit", [car.id, exp.id])}
          className="text-yellow-600 hover:text-yellow-700 transition"
          title="Modifier"
        >
          <Edit size={18} />
        </Link>
        <button
          onClick={() => handleDelete(exp.id)}
          className="text-red-600 hover:text-red-700 transition"
          title="Supprimer"
        >
          <Trash2 size={18} />
        </button>
      </div>,
    ],
  });

  return (
    <AuthenticatedLayout>
      <Head title={`Dépenses – ${car.license_plate}`} />

      <div className="space-y-6">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between gap-4">
          {/* LEFT */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href={route("cars.show", car.id)}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <h1 className="text-2xl font-bold tracking-tight truncate">
              Dépenses voiture
            </h1>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-sm font-semibold">{car.license_plate}</p>
              <p className="text-xs text-muted-foreground">
                Gestion des dépenses
              </p>
            </div>

            <Link href={route("car-expenses.create", car.id)}>
              <Button className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            </Link>
          </div>
        </div>


        {/* ================= CONTENT ================= */}
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
              Historique des dépenses
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* ================= MOBILE ================= */}
            <div className="space-y-4 md:hidden">
              {rows.length ? (
                rows.map((exp) => (
                  <AdminMobileCard
                    key={exp.id}
                    onClick={() => router.visit(route("car-expenses.edit", [car.id, exp.id]))}
                    items={[
                      { label: "#", value: exp.rowIndex, emphasis: true },
                      { label: "Type", value: exp.type },
                      { label: "Facture", value: exp.invoice_number || "—" },
                      {
                        label: "Montant",
                        value: fmtMoney(exp.amount),
                        emphasis: true,
                      },
                      { label: "Date", value: formatDate(exp.expense_date) },
                      { label: "Notes", value: exp.notes || "—" },
                    ]}
                    footer={
                      <>
                        <Link
                          href={route("car-expenses.edit", [car.id, exp.id])}
                          className="text-yellow-600 hover:text-yellow-700 transition"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="text-red-600 hover:text-red-700 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Aucune dépense enregistrée.
                </p>
              )}
            </div>

            {/* ================= DESKTOP ================= */}
            <div className="hidden md:block">
              <AdminTable
                columns={columns}
                data={rows}
                renderRow={renderRow}
                emptyMessage="Aucune dépense enregistrée."
              />
            </div>

          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default Index;
