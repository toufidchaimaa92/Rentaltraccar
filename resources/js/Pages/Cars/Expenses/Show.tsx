import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  notes?: string;
}

interface Employee {
  id: number;
  name: string;
  monthly_salary: number;
  payments?: Payment[];
}

interface Props {
  auth: { user: any };
  employee: Employee;
}

export default function ShowEmployee({ auth, employee }: Props) {
  const [openDialog, setOpenDialog] = useState(false);

  const { data, setData, post, processing, reset, errors } = useForm({
    amount: '',
    payment_date: '',
    notes: '',
  });

  const handleAddPayment = () => {
    post(`/admin/employees/${employee.id}/payments`, {
      onSuccess: () => {
        reset('amount', 'payment_date', 'notes');
        setOpenDialog(false);
        router.reload();
      },
    });
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Employé: ${employee.name}`} />

      <div>
        {/* Info & Add Payment */}
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Informations sur l'employé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><span className="font-semibold">Nom:</span> {employee.name}</p>
            <p><span className="font-semibold">Salaire mensuel:</span> {employee.monthly_salary} MAD</p>

            {/* Dialog Ajouter Paiement */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button variant="default" className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un paiement
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Ajouter un paiement</DialogTitle>
                  <DialogDescription>Remplissez les informations ci-dessous pour ajouter un paiement.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Montant (MAD)</label>
                    <Input
                      type="number"
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
                      placeholder="Ex: 500"
                    />
                    {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                    <Input
                      type="date"
                      value={data.payment_date}
                      onChange={(e) => setData('payment_date', e.target.value)}
                    />
                    {errors.payment_date && <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Notes</label>
                    <Input
                      type="text"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      placeholder="Ex: paiement hebdomadaire"
                    />
                    {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes}</p>}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleAddPayment} disabled={processing}>
                      Ajouter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Historique des Paiements */}
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle>Historique des paiements</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {employee.payments && employee.payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant (MAD)</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.id}</TableCell>
                      <TableCell>{payment.payment_date}</TableCell>
                      <TableCell>{payment.amount}</TableCell>
                      <TableCell>{payment.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground italic">Aucun paiement enregistré.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
