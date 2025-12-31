import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { fr } from 'date-fns/locale';

type PaySchedule = 'monthly' | 'weekly' | 'daily';

interface Payment {
  id: number;
  amount: number;
  payment_date: string;
  notes?: string;
}

interface BreakdownRow {
  key: string;               // e.g. "2025-34" for week or "YYYY-MM-DD" for day
  start_date: string;        // always present
  end_date?: string | null;  // present for weekly breakdown, absent for daily
  total: number;
}

interface Employee {
  id: number;
  name: string;
  employee_type: 'coffee' | 'location';
  pay_schedule: PaySchedule;
  monthly_day: number | null;
  weekly_day: number | null;
  monthly_salary: number | null;
  weekly_salary: number | null;
  daily_rate: number | null;
  payments?: Payment[];
}

interface Period {
  label: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

interface Props {
  auth: { user: any };
  employee: Employee;
  period: Period;
  targetAmount: number | null;
  paidInPeriod: number;
  reste: number;
  breakdownLabel: string;      // e.g. "Récap par semaine (mois en cours)" or "Récap par jour (semaine en cours)"
  breakdown: BreakdownRow[];
  payments: Payment[];         // controller also provides flat payments
}

export default function ShowEmployee({
  auth,
  employee,
  period,
  targetAmount,
  paidInPeriod,
  reste,
  breakdownLabel,
  breakdown,
  payments,
}: Props) {
  const [openDialog, setOpenDialog] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  // helper to get local YYYY-MM-DD (no timezone shift surprises)
  const toLocalISO = (d: Date = new Date()) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const { data, setData, post, processing, reset, errors } = useForm({
    amount: '',
    payment_date: toLocalISO(), // default to today
    notes: '',
  });

  // If dialog is opened and date got cleared, re-seed to today
  useEffect(() => {
    if (openDialog && !data.payment_date) {
      setData('payment_date', toLocalISO());
    }
  }, [openDialog]); // eslint-disable-line react-hooks/exhaustive-deps

  const allPayments = payments?.length ? payments : (employee.payments ?? []);
  const sortedPayments = [...allPayments].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  );
  const displayedPayments = showAllPayments ? sortedPayments : sortedPayments.slice(0, 5);

  const handleAddPayment = () => {
    post(`/admin/employees/${employee.id}/payments`, {
      onSuccess: () => {
        reset('amount', 'notes');               // reset text fields
        setData('payment_date', toLocalISO());  // re-seed date to today
        setOpenDialog(false);
        router.reload(); // refresh summaries
      },
    });
  };

  const handleDeleteEmployee = (id: number) => {
    if (confirm("Supprimer cet employé ? Cette action est irréversible.")) {
      router.delete(`/admin/employees/${id}`, {
        onSuccess: () => router.visit('/admin/employees'),
      });
    }
  };

  const formatMAD = (value: number | null | undefined) =>
    value == null
      ? '—'
      : Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const scheduleLabel: Record<PaySchedule, string> = {
    monthly: 'Mensuel',
    weekly: 'Hebdomadaire',
    daily: 'Quotidien',
  };

  const salaryLabel: Record<PaySchedule, string> = {
    monthly: 'Salaire mensuel',
    weekly: 'Salaire hebdomadaire',
    daily: 'Salaire journalier',
  };

  const displayedSalary =
    employee.pay_schedule === 'monthly'
      ? employee.monthly_salary
      : employee.pay_schedule === 'weekly'
      ? employee.weekly_salary
      : employee.daily_rate;

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Employé: ${employee.name}`} />

      <div className="px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: Employee card */}
        <Card className="shadow-lg border rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Informations employé
            </CardTitle>

            {/* Header actions: edit / delete */}
            <div className="flex items-center gap-2">
              <Link href={`/admin/employees/${employee.id}/edit`} title="Modifier l'employé">
                <Button size="icon" variant="ghost">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                title="Supprimer l'employé"
                onClick={() => handleDeleteEmployee(employee.id)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between pt-2">
              <span className="font-medium">Nom:</span>
              <span>{employee.name}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="font-medium">Type:</span>
              <span>{employee.employee_type === 'coffee' ? 'Coffee' : 'Location'}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="font-medium">Fréquence:</span>
              <span>{scheduleLabel[employee.pay_schedule]}</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="font-medium">{salaryLabel[employee.pay_schedule]}:</span>
              <span>{formatMAD(displayedSalary)} MAD</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="font-medium">Période en cours:</span>
              <span>
                {period.start} → {period.end}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="font-medium">Montant attendu (période):</span>
              <span className="font-semibold">{formatMAD(targetAmount)} MAD</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="font-medium">Déjà payé (période):</span>
              <span className="text-green-600 font-semibold">{formatMAD(paidInPeriod)} MAD</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="font-medium">Reste à payer:</span>
              <span className="text-red-600 font-semibold">{formatMAD(reste)} MAD</span>
            </div>

            {/* Add Payment Dialog */}
            <div className="pt-4">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un paiement
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>Ajouter un paiement</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations ci-dessous pour ajouter un paiement.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 mt-4">
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
                      <div className="flex justify-center">
                        <Calendar
                          mode="single"
                          selected={data.payment_date ? new Date(data.payment_date) : new Date()} // default to today
                          onSelect={(date: Date | undefined) => {
                            if (date) {
                              const isoDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                                .toISOString()
                                .split('T')[0];
                              setData('payment_date', isoDate);
                            }
                          }}
                          locale={fr}
                          weekStartsOn={1}
                          className="rounded-lg border shadow-sm text-sm"
                        />
                      </div>
                      {errors.payment_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>
                      )}
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
            </div>
          </CardContent>
        </Card>

        {/* Right column: Tables */}
        <div className="space-y-8">
          {/* Historique des paiements */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Historique des paiements</h2>
            {sortedPayments.length > 0 ? (
              <>
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
                    {displayedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.id}</TableCell>
                        <TableCell>{payment.payment_date}</TableCell>
                        <TableCell>{formatMAD(payment.amount)}</TableCell>
                        <TableCell>{payment.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sortedPayments.length > 5 && (
                  <div className="mt-2 text-center">
                    <Button variant="outline" size="sm" onClick={() => setShowAllPayments(!showAllPayments)}>
                      {showAllPayments ? 'Afficher moins' : 'Afficher plus'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground italic">Aucun paiement enregistré.</p>
            )}
          </div>

          {/* Breakdown (weekly for monthly schedule, daily for weekly/daily) */}
          <div>
            <h2 className="text-xl font-semibold mb-1">{breakdownLabel}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Période: {period.start} → {period.end}
            </p>

            {breakdown && breakdown.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{employee.pay_schedule === 'monthly' ? 'Semaine' : 'Jour'}</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Total (MAD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{row.key}</TableCell>
                      <TableCell>
                        {row.end_date ? (
                          <span>{row.start_date} → {row.end_date}</span>
                        ) : (
                          <span>{row.start_date}</span>
                        )}
                      </TableCell>
                      <TableCell>{formatMAD(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground italic">Aucun élément trouvé pour cette période.</p>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
