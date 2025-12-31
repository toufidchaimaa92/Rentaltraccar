import React from "react";
// ❌ import { Inertia } from "@inertiajs/inertia";
import { Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/Components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

interface Expense {
  id: number;
  type: string;
  invoice_number?: string;
  amount: number;
  expense_date?: string; // may be ISO like 2025-08-28T00:00:00.000000Z
  notes?: string;
}

interface Props {
  car: {
    id: number;
    license_plate: string;
  };
  expenses: Expense[];
}

function formatDate(value?: string) {
  if (!value) return "-";
  try {
    // Works for both 'YYYY-MM-DD' and full ISO strings with Z
    const d = parseISO(value);
    if (!isValid(d)) return value;
    return format(d, "dd/MM/yyyy");
  } catch {
    return value;
  }
}

const Index: React.FC<Props> = ({ car, expenses }) => {
  const handleDelete = (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette dépense ?")) {
      router.delete(route("car-expenses.destroy", [car.id, id]));
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Dépenses de la voiture ${car.license_plate}`} />

      <div className="w-full px-4 py-8">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Dépenses pour {car.license_plate || `Voiture #${car.id}`}
          </h1>
          <Link href={route("car-expenses.create", car.id)}>
            <Button variant="default">Ajouter une dépense</Button>
          </Link>
        </div>

        {/* Carte pleine largeur */}
        <Card className="w-full shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Liste des dépenses</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {expenses.length > 0 ? (
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp, index) => (
                    <TableRow key={exp.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{exp.type}</TableCell>
                      <TableCell>{exp.invoice_number || "-"}</TableCell>
                      <TableCell>{exp.amount} Dh</TableCell>
                      <TableCell>{formatDate(exp.expense_date)}</TableCell>
                      <TableCell>{exp.notes || "-"}</TableCell>
                      <TableCell className="space-x-2 flex">
                        <Link
                          href={route("car-expenses.edit", [car.id, exp.id])}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 transition"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground italic">Aucune dépense enregistrée.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default Index;
