import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CalendarDays, ArrowLeft, Pencil } from 'lucide-react';
import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PaginatorLink = { url: string | null; label: string; active: boolean };

interface Benefit {
  id: number;
  rental_id: number;
  amount: string | number;
  start_date: string; // ISO (YYYY-MM-DD)
  end_date: string;   // ISO (YYYY-MM-DD)
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

function fmtMoney(n: number | string | null | undefined) {
  const num = Number(n ?? 0);
  return `${num.toFixed(2)} Dh`;
}
function fmtDateISO(iso?: string) {
  if (!iso) return 'N/A';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, y, mm, dd] = m;
  return `${dd}/${mm}/${y}`;
}

export default function BenefitsPage() {
  const { auth, car, benefits, totals, filters } = usePage<PageProps>().props;

  const onChangePerPage = (value: string) => {
    router.get(
      route('cars.benefits.index', car.id),
      { per_page: Number(value) },
      { preserveScroll: true, preserveState: true }
    );
  };

  const handlePaginationClick = (e: React.MouseEvent, url: string | null) => {
    e.preventDefault();
    if (url) {
      router.get(url, {}, { preserveScroll: true, preserveState: true });
    }
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={`Bénéfices – Voiture #${car.id}`} />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={route('cars.show', car.id)}>
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              Bénéfices – Voiture #{car.id}{' '}
              <span className="text-muted-foreground">
                {car.license_plate || car.wwlicense_plate || ''}
                {car.car_model ? ` · ${car.car_model.brand ?? ''} ${car.car_model.model ?? ''}` : ''}
              </span>
            </h1>
          </div>

          <Link href={route('cars.edit', car.id)}>
            <Button size="icon" variant="outline" aria-label={`Modifier la voiture #${car.id}`} title={`Modifier la voiture #${car.id}`}>
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Totals */}
        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
              Résumé
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <p className="font-semibold text-green-700">Bénéfice (Ce mois)</p>
              <p className="text-lg font-bold">{fmtMoney(totals.monthlyBenefit)}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="font-semibold text-blue-700">Jours loués (Ce mois)</p>
              <p className="text-lg font-bold">{totals.monthlyRentedDays}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl text-center">
              <p className="font-semibold text-amber-700">Bénéfice (Total)</p>
              <p className="text-lg font-bold">{fmtMoney(totals.totalBenefit)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground" htmlFor="perPage">
              Par page
            </Label>
            <Select value={String(filters?.per_page ?? 15)} onValueChange={onChangePerPage}>
              <SelectTrigger id="perPage" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 25, 50].map((n) => (
                  <SelectItem value={String(n)} key={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Période</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Jours</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Montant</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Montant / jour</th>

              </tr>
            </thead>
            <tbody>
              {benefits.data.length > 0 ? (
                benefits.data.map((b) => {
                  const daily = (Number(b.amount) && b.days > 0) ? Number(b.amount) / b.days : 0;
                  return (
                    <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
<td className="py-3 px-4">
  <Link href={route('rentals.show', b.rental_id)}>
    <Button
      variant="link"
      size="sm"
      aria-label={`Voir la location #${b.rental_id}`}
      title={`Voir la location #${b.rental_id}`}
    >
      #{b.rental_id}
    </Button>
  </Link>
</td>
                      <td className="py-3 px-4">
                        {fmtDateISO(b.start_date)} → {fmtDateISO(b.end_date)}
                      </td>
                      <td className="py-3 px-4">{b.days}</td>
                      <td className="py-3 px-4 font-semibold text-green-700">{fmtMoney(b.amount)}</td>
                      <td className="py-3 px-4">{fmtMoney(daily)}</td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">Aucun bénéfice trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <ShadcnPagination className="mt-6 flex justify-center">
          <PaginationContent>
            {benefits.links.map((link, index) => {
              if (link.label.includes('Précédent') || link.label.includes('Previous')) {
                return (
                  <PaginationItem key={index}>
                    <PaginationPrevious href={link.url || '#'} onClick={(e) => handlePaginationClick(e, link.url)} />
                  </PaginationItem>
                );
              }
              if (link.label.includes('Suivant') || link.label.includes('Next')) {
                return (
                  <PaginationItem key={index}>
                    <PaginationNext href={link.url || '#'} onClick={(e) => handlePaginationClick(e, link.url)} />
                  </PaginationItem>
                );
              }
              if (link.label.includes('...')) {
                return (
                  <PaginationItem key={index}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return (
                <PaginationItem key={index}>
                  <PaginationLink
                    href={link.url || '#'}
                    isActive={link.active}
                    onClick={(e) => handlePaginationClick(e, link.url)}
                  >
                    {link.label}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
          </PaginationContent>
        </ShadcnPagination>
      </div>
    </AuthenticatedLayout>
  );
}
