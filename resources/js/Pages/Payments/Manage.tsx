import React, { useState } from 'react'; 
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { motion } from 'framer-motion';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface Payment {
  id: number;
  amount: number;
  method: string;
  date: string;
  reference?: string;
  user_name?: string;
}

interface Rental {
  id: number;
  client_name: string;
  car_model_name: string;
  total_price: number;
  advance_payment?: number;
  client: { id: number; first_name: string; last_name: string };
}

interface Props {
  auth: any;
  rental: Rental;
  payments: Payment[];
  client: { id: number; first_name: string; last_name: string };
  totalPaid: number;
  remainingAmount: number;
}

export default function Manage({ auth, rental, payments, client, totalPaid, remainingAmount }: Props) {
  const [form, setForm] = useState({
    rental_id: rental.id,
    client_id: client.id,
    amount: '',
    method: 'cash',
    reference: '',
  });

  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // État local pour erreur spécifique montant (validation immédiate)
  const [amountError, setAmountError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'amount') {
      const amountNum = parseFloat(value);
      if (isNaN(amountNum) || amountNum <= 0) {
        setAmountError('Le montant doit être un nombre positif.');
      } else if (amountNum > remainingAmount) {
        setAmountError('Le montant dépasse le reste à payer.');
      } else {
        setAmountError(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrors({ amount: ['Le montant doit être un nombre positif.'] });
      return;
    }
    if (amountNum > remainingAmount) {
      setErrors({ amount: ['Le montant dépasse le reste à payer. Location déjà totalement payée ou paiement trop élevé.'] });
      return;
    }

    setProcessing(true);
    setSuccess(null);
    setErrors({});
    setAmountError(null);

    router.post('/payments', form, {
      onSuccess: () => {
        setSuccess('Paiement ajouté !');
        setForm({ ...form, amount: '', reference: '' });
        setDialogOpen(false);
      },
      onError: (errs) => {
        setErrors(errs);
      },
      onFinish: () => {
        setProcessing(false);
      },
    });
  };

  const showReference = form.method === 'virement' || form.method === 'cheque';

  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0,00';
    return num.toFixed(2).replace('.', ',');
  };

  const sortedPayments = [...payments].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const amountNum = parseFloat(form.amount);
  const isAmountValid = !amountError && !isNaN(amountNum) && amountNum > 0 && amountNum <= remainingAmount;

  return (
    <AuthenticatedLayout user={auth.user}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow p-6 max-w-7xl mx-auto mt-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            Gestion des paiements - Location #{rental.id}
          </h2>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Ajouter un paiement</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Ajouter un paiement</DialogTitle>
                  <DialogDescription>
                    Remplissez ce formulaire pour ajouter un paiement.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                  {success && (
                    <div className="text-green-600 text-center">{success}</div>
                  )}

                  <div className="grid gap-3">
                    <Label htmlFor="amount">Montant</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={handleChange}
                      required
                      disabled={processing}
                      className={amountError ? 'border-red-600 focus:ring-red-600' : ''}
                    />
                    {amountError && (
                      <p className="text-red-600 text-sm">{amountError}</p>
                    )}
                    {errors.amount && (
                      <p className="text-red-600 text-sm">{errors.amount.join(', ')}</p>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="method">Méthode</Label>
                    <Select
                      value={form.method}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, method: value }))}
                      disabled={processing}
                    >
                      <SelectTrigger id="method" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="virement">Virement</SelectItem>
                        <SelectItem value="cheque">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.method && (
                      <p className="text-red-600 text-sm">{errors.method.join(', ')}</p>
                    )}
                  </div>

                  {showReference && (
                    <div className="grid gap-3">
                      <Label htmlFor="reference">Référence</Label>
                      <Input
                        id="reference"
                        name="reference"
                        value={form.reference}
                        onChange={handleChange}
                        disabled={processing}
                        required
                      />
                      {errors.reference && (
                        <p className="text-red-600 text-sm">{errors.reference.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="mt-4">
                  <DialogClose asChild>
                    <Button variant="outline" type="button" disabled={processing}>
                      Annuler
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={processing || !isAmountValid}>
                    {processing ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Affichage Total payé / Reste à payer */}
        <div className="mb-6 flex gap-6 text-lg font-semibold text-foreground">
          <p>Total payé : {formatAmount(totalPaid)} MAD</p>
          <p>Reste à payer : {formatAmount(remainingAmount)} MAD</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des paiements</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedPayments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Aucun paiement enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-3 text-left">ID</th>
                      <th className="py-2 px-3 text-left">Montant</th>
                      <th className="py-2 px-3 text-left">Méthode</th>
                      <th className="py-2 px-3 text-left">Date</th>
                      <th className="py-2 px-3 text-left">Référence</th>
                      <th className="py-2 px-3 text-left">Saisi par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3">#{payment.id}</td>
                        <td className="py-2 px-3">{formatAmount(payment.amount)} MAD</td>
                        <td className="py-2 px-3 capitalize">{payment.method}</td>
                        <td className="py-2 px-3">
                          {new Date(payment.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-2 px-3">{payment.reference || '—'}</td>
                        <td className="py-2 px-3">{payment.user_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AuthenticatedLayout>
  );
}
