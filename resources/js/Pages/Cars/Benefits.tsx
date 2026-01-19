import React, { useMemo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  CalendarDays,
  ArrowLeft,
  Wallet,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminPagination,
  AdminTable,
  AdminTableColumn,
  AdminTableRow,
  adminPaginationFromLinks,
  buildPaginationModel,
} from '@/components/admin/admin-table';
import AdminMobileCard from '@/components/admin/AdminMobileCard';

/* ================= TYPES ================= */

type PaginatorLink = { url: string | null; label: string; active: boolean };

interface Benefit {
  id: number;
  rental_id: number;
  amount: string | number;
  start_date: string;
  end_date: string;
  days: number;
}

interface CarModel {
  id: number;
  brand?: string;
  model?: string;
}

interface CarI {
  id: number;
  license_plate?: string | null;
  wwlicense_plate?: string | null;
  car_model?: CarModel | null;
}

interface PageProps {
  auth: any;
  car: CarI;
  benefits: {
    data: Benefit[];
    links: PaginatorLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
  };
  totals: {
    monthlyBenefit: number;
    totalBenefit: number;
    monthlyRentedDays: number;
  };
  filters: {
    per_page?: number;
  };
}

/* ================= HELPERS ================= */

function fmtMoney(n: number | string | null | undefined) {
  const num = Number(n ?? 0);

  const isInteger = Number.isInteger(num);

  return isInteger
    ? `${num} Dh`
    : `${num.toFixed(2)} Dh`;
}


function fmtDateISO(iso?: string) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mm, dd] = m;
  return `${dd}/${mm}/${y}`;
}

/* ================= PAGE ================= */

export default function BenefitsPage() {
  const { auth, car, benefits, totals, filters } =
    usePage<PageProps>().props;

  const onChangePerPage = (value: string) => {
    router.get(
      route('cars.benefits.index', car.id),
      { per_page: Number(value) },
      { preserveScroll: true, preserveState: true }
    );
  };

  const columns = useMemo<AdminTableColumn[]>(
    () => [
      { id: 'rental', label: 'Location' },
      { id: 'period', label: 'Période' },
      { id: 'days', label: 'Jours' },
      { id: 'amount', label: 'Montant' },
      { id: 'daily', label: 'Montant / jour' },
    ],
    []
  );

  const renderRow = (benefit: Benefit): AdminTableRow => {
    const daily =
      Number(benefit.amount) && benefit.days > 0
        ? Number(benefit.amount) / benefit.days
        : 0;

    return {
      key: benefit.id,
      cells: [
        <Link key={`rental-${benefit.id}`} href={route('rentals.show', benefit.rental_id)}>
          <Button variant="link" size="sm">
            #{benefit.rental_id}
          </Button>
        </Link>,
        <span key={`period-${benefit.id}`}>
          {fmtDateISO(benefit.start_date)} → {fmtDateISO(benefit.end_date)}
        </span>,
        <span key={`days-${benefit.id}`}>{benefit.days}</span>,
        <span
          key={`amount-${benefit.id}`}
          className="font-semibold text-green-700"
        >
          {fmtMoney(benefit.amount)}
        </span>,
        <span key={`daily-${benefit.id}`} className="text-muted-foreground">
          {fmtMoney(daily)}
        </span>,
      ],
    };
  };

  const paginationMeta = useMemo(
    () => adminPaginationFromLinks(benefits.links),
    [benefits.links]
  );

  const pagination: AdminPagination = useMemo(
    () => ({
      ...paginationMeta,
      model: buildPaginationModel(
        paginationMeta.current ?? 1,
        paginationMeta.last ?? 1
      ),
      onPaginate: (e, url) => {
        e.preventDefault();
        if (!url) return;
        router.get(url, {}, { preserveScroll: true, preserveState: true });
      },
    }),
    [paginationMeta]
  );

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Bénéfices Voiture" />

      <div className="space-y-6">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between gap-4">
          {/* LEFT: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href={route('cars.show', car.id)}>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight truncate">
                Bénéfices voiture
              </h1>
            </div>
          </div>

          {/* RIGHT: Car info */}
          <div className="hidden sm:flex items-center gap-3 text-right">
            <div className="leading-tight">
              <p className="text-sm font-semibold">
                {car.license_plate || car.wwlicense_plate || '—'}
              </p>
              {car.car_model && (
                <p className="text-xs text-muted-foreground">
                  {car.car_model.brand} {car.car_model.model}
                </p>
              )}
            </div>
          </div>
        </div>


        {/* ================= SUMMARY ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100 text-green-700">
                <Wallet />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Bénéfice (ce mois)
                </p>
                <p className="text-xl font-bold">
                  {fmtMoney(totals.monthlyBenefit)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-700">
                <Clock />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Jours loués (ce mois)
                </p>
                <p className="text-xl font-bold">
                  {totals.monthlyRentedDays}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
                <TrendingUp />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Bénéfice total
                </p>
                <p className="text-xl font-bold">
                  {fmtMoney(totals.totalBenefit)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= MOBILE ================= */}
        <div className="space-y-4 md:hidden">
          {benefits.data.length ? (
            benefits.data.map((benefit) => {
              const daily =
                Number(benefit.amount) && benefit.days > 0
                  ? Number(benefit.amount) / benefit.days
                  : 0;

              return (
                <AdminMobileCard
                  key={benefit.id}
                  onClick={() => router.visit(route('rentals.show', benefit.rental_id))}
                  items={[
                    {
                      label: 'Location',
                      value: `#${benefit.rental_id}`,
                      emphasis: true,
                    },
                    {
                      label: 'Période',
                      value: `${fmtDateISO(
                        benefit.start_date
                      )} → ${fmtDateISO(benefit.end_date)}`,
                    },
                    { label: 'Jours', value: benefit.days },
                    {
                      label: 'Montant',
                      value: fmtMoney(benefit.amount),
                      emphasis: true,
                    },
                    { label: 'Montant / jour', value: fmtMoney(daily) },
                  ]}
                />
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun bénéfice trouvé.
            </p>
          )}

          {pagination.next && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                pagination.onPaginate(
                  { preventDefault() { } } as React.MouseEvent<HTMLAnchorElement>,
                  pagination.next
                )
              }
            >
              Charger plus
            </Button>
          )}
        </div>

        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden md:block">
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                Historique des bénéfices
              </CardTitle>
            </CardHeader>

            <CardContent>
              <AdminTable
                columns={columns}
                data={benefits.data || []}
                renderRow={renderRow}
                emptyMessage="Aucun bénéfice trouvé."
                pagination={pagination}
              />
            </CardContent>
          </Card>
        </div>

      </div>
    </AuthenticatedLayout>
  );
}
