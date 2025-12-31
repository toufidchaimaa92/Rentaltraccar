import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type MetaProps = {
  employee_types: string[];
  pay_schedules: string[];
  weekdays: { value: number; label: string }[];
  monthly_days: number[];
};

export default function CreateEmployee({ meta }: { meta?: MetaProps }) {
  const defaults: MetaProps = {
    employee_types: ['coffee', 'location'],
    pay_schedules: ['monthly', 'weekly', 'daily'],
    weekdays: [
      { value: 0, label: 'Dimanche' },
      { value: 1, label: 'Lundi' },
      { value: 2, label: 'Mardi' },
      { value: 3, label: 'Mercredi' },
      { value: 4, label: 'Jeudi' },
      { value: 5, label: 'Vendredi' },
      { value: 6, label: 'Samedi' },
    ],
    monthly_days: Array.from({ length: 28 }, (_, i) => i + 1),
  };

  const m = meta ?? defaults;

  const { data, setData, post, errors, processing, reset } = useForm({
    name: '',
    employee_type: 'coffee',
    pay_schedule: 'monthly',
    monthly_day: '',
    weekly_day: '',
    monthly_salary: '',
    weekly_salary: '',
    daily_rate: '',
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/employees', {
      preserveScroll: true,
      onSuccess: () => {
        reset(
          'name',
          'monthly_salary',
          'weekly_salary',
          'daily_rate',
          'monthly_day',
          'weekly_day'
        );
      },
    });
  };

  const isMonthly = data.pay_schedule === 'monthly';
  const isWeekly = data.pay_schedule === 'weekly';
  const isDaily = data.pay_schedule === 'daily';

  return (
    <AuthenticatedLayout>
      <Head title="Créer un employé" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl md:p-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouvel employé</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nom
                </label>
                <Input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="Nom de l'employé"
                  className="w-full"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Type d’employé */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Type d’employé
                </label>
                <Select
                  value={data.employee_type}
                  onValueChange={(val) => setData('employee_type', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {m.employee_types.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t === 'coffee' ? 'Coffee' : 'Location'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employee_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.employee_type}
                  </p>
                )}
              </div>

              {/* Fréquence de paiement */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Fréquence de paiement
                </label>
                <Select
                  value={data.pay_schedule}
                  onValueChange={(val) => {
                    setData('pay_schedule', val);
                    setData('monthly_day', '');
                    setData('weekly_day', '');
                    setData('monthly_salary', '');
                    setData('weekly_salary', '');
                    setData('daily_rate', '');
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    {m.pay_schedules.map((ps) => (
                      <SelectItem key={ps} value={ps}>
                        {ps === 'monthly'
                          ? 'Mensuel'
                          : ps === 'weekly'
                          ? 'Hebdomadaire'
                          : 'Quotidien'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pay_schedule && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.pay_schedule}
                  </p>
                )}
              </div>

              {/* Jour du mois (si Mensuel) */}
              {isMonthly && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Jour du mois (1–28)
                  </label>
                  <Select
                    value={String(data.monthly_day ?? '')}
                    onValueChange={(val) => setData('monthly_day', val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner le jour du mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {m.monthly_days.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.monthly_day && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.monthly_day}
                    </p>
                  )}
                </div>
              )}

              {/* Jour de la semaine (si Hebdomadaire) */}
              {isWeekly && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Jour de la semaine
                  </label>
                  <Select
                    value={data.weekly_day === '' ? '' : String(data.weekly_day)}
                    onValueChange={(val) => setData('weekly_day', val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner le jour de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      {m.weekdays.map((w) => (
                        <SelectItem key={w.value} value={String(w.value)}>
                          {w.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.weekly_day && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.weekly_day}
                    </p>
                  )}
                </div>
              )}

              {/* Salaire mensuel */}
              {isMonthly && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Salaire mensuel (MAD)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.monthly_salary}
                    onChange={(e) => setData('monthly_salary', e.target.value)}
                    placeholder="Ex: 4500.00"
                    className="w-full"
                  />
                  {errors.monthly_salary && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.monthly_salary}
                    </p>
                  )}
                </div>
              )}

              {/* Salaire hebdomadaire */}
              {isWeekly && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Salaire hebdomadaire (MAD)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.weekly_salary}
                    onChange={(e) => setData('weekly_salary', e.target.value)}
                    placeholder="Ex: 1200.00"
                    className="w-full"
                  />
                  {errors.weekly_salary && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.weekly_salary}
                    </p>
                  )}
                </div>
              )}

              {/* Salaire journalier */}
              {isDaily && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Salaire journalier (MAD)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={data.daily_rate}
                    onChange={(e) => setData('daily_rate', e.target.value)}
                    placeholder="Ex: 300.00"
                    className="w-full"
                  />
                  {errors.daily_rate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.daily_rate}
                    </p>
                  )}
                </div>
              )}

              {/* Actif */}
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={!!data.is_active}
                  onChange={(e) => setData('is_active', e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm text-muted-foreground">
                  Actif
                </label>
              </div>
              {errors.is_active && (
                <p className="text-red-500 text-sm -mt-2">{errors.is_active}</p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                  Créer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </AuthenticatedLayout>
  );
}
