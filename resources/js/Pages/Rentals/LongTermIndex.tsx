import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import {
  AdminPagination,
  AdminResourceCard,
  AdminFilterTrigger,
  AdminSearchInput,
  AdminSortState,
  AdminTable,
  AdminTableColumn,
  AdminTableRow,
  adminPaginationFromLinks,
  buildPaginationModel,
} from '@/components/admin/admin-table';
import AdminMobileCard from '@/components/admin/AdminMobileCard';
import { resourceIcons } from '@/constants/resource-icons';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
}

function formatCurrency(amount?: number | string | null) {
  if (amount === null || amount === undefined) return '—';
  const parsed = Number(amount);
  if (Number.isNaN(parsed)) return '—';
  return `${Math.round(parsed)} MAD`;
}

function cycleLabel(days?: number | null) {
  switch (days) {
    case 30:
      return 'Mensuel';
    case 15:
      return 'Tous les 15 jours';
    case 10:
      return 'Tous les 10 jours';
    default:
      return days ? `Tous les ${days} jours` : '—';
  }
}

function overdueBadge(status?: string | null) {
  switch (status) {
    case 'overdue':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'due_soon':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    default:
      return 'bg-green-100 text-green-800 border border-green-200';
  }
}

const DEFAULT_SORT: AdminSortState = { by: 'next_payment_due_date', dir: 'asc' };

function parseSortParam(sort?: string | AdminSortState | string[] | null): AdminSortState {
  if (!sort) return DEFAULT_SORT;

  // Handle structured sort objects that might come from the server
  if (typeof sort === 'object' && !Array.isArray(sort)) {
    return {
      by: sort.by || DEFAULT_SORT.by,
      dir: (sort.dir as 'asc' | 'desc') || DEFAULT_SORT.dir,
    };
  }

  // Handle multi-value query params that Inertia can pass as arrays
  const sortValue = Array.isArray(sort) ? sort[0] : sort;
  const [by, dir] = String(sortValue).split('_');

  return { by: by || DEFAULT_SORT.by, dir: (dir as 'asc' | 'desc') || DEFAULT_SORT.dir };
}

function stringifySort(sort?: AdminSortState) {
  if (!sort?.by) return undefined;
  return `${sort.by}_${sort.dir ?? 'asc'}`;
}

export default function LongTermIndex({ auth, rentals, filters }: any) {
  const RentalsIcon = resourceIcons.rentals;
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [statusFilter, setStatusFilter] = useState(filters?.status || 'All Status');
  const [cycleFilter, setCycleFilter] = useState(filters?.cycle || 'All Cycles');
  const [sortState, setSortState] = useState<AdminSortState>(() => parseSortParam(filters?.sort));
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);

  const rentalData = rentals?.data || [];

  const applyFilters = (nextSort?: AdminSortState) => {
    const params: Record<string, string> = {};
    const sortToUse = nextSort ?? sortState;

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (statusFilter && statusFilter !== 'All Status') params.status = statusFilter;
    if (cycleFilter && cycleFilter !== 'All Cycles') params.cycle = cycleFilter;
    if (stringifySort(sortToUse)) params.sort = stringifySort(sortToUse)!;

    router.get(route('rentals.longTerm.index'), params, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All Status');
    setCycleFilter('All Cycles');
    setSortState(DEFAULT_SORT);

    router.get(route('rentals.longTerm.index'), {}, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const paginationMeta = useMemo(() => adminPaginationFromLinks(rentals.links), [rentals.links]);
  const pagination: AdminPagination = useMemo(
    () => ({
      ...paginationMeta,
      model: buildPaginationModel(paginationMeta.current ?? 1, paginationMeta.last ?? 1),
      onPaginate: (e, url) => {
        e.preventDefault();
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: true });
      },
    }),
    [paginationMeta],
  );

  const columns = useMemo<AdminTableColumn[]>(
    () => [
      { id: 'id', label: 'Contrat', sortable: true, headerClassName: 'w-24 whitespace-nowrap' },
      { id: 'client', label: 'Client', headerClassName: 'whitespace-nowrap' },
      { id: 'vehicles', label: 'Véhicules', headerClassName: 'whitespace-nowrap' },
      { id: 'start_date', label: 'Début', sortable: true, headerClassName: 'whitespace-nowrap' },
      { id: 'next_payment_due_date', label: 'Échéance', sortable: true, headerClassName: 'whitespace-nowrap' },
      { id: 'monthly_total', label: 'Loyer mensuel', sortable: true, headerClassName: 'whitespace-nowrap' },
      { id: 'status', label: 'Paiement', sortable: false, headerClassName: 'whitespace-nowrap' },
    ],
    [],
  );

  const handleSort = (column: string) => {
    const nextSort: AdminSortState =
      sortState.by === column
        ? { by: column, dir: sortState.dir === 'asc' ? 'desc' : 'asc' }
        : { by: column, dir: 'asc' };

    setSortState(nextSort);
    applyFilters(nextSort);
  };

  const renderRow = (contract: any): AdminTableRow => {
    const client = contract.client || {};
    const vehicles = contract.vehicles || [];
    const firstVehicle = vehicles[0] || {};
    const firstModel = firstVehicle.carModel || {};
    const vehiclesLabel = vehicles
      .map((vehicle: any) => `${vehicle?.carModel?.brand ?? ''} ${vehicle?.carModel?.model ?? ''}`.trim())
      .filter(Boolean)
      .join(', ');

    return {
      key: contract.contract_id,
      onClick: () => router.get(route('rentals.longTerm.show', contract.contract_id)),
      cells: [
        <span className="font-medium">#{contract.contract_id}</span>,
        <div className="flex flex-col">
          <span className="font-medium">{client.name || '—'}</span>
          <span className="text-xs text-muted-foreground">{client.phone || '—'}</span>
        </div>,
        <div className="flex flex-col">
          <span>{vehiclesLabel || `${firstModel.brand ?? '—'} ${firstModel.model ?? ''}`}</span>
          <span className="text-xs text-muted-foreground">{contract.vehicles_count} véhicule(s)</span>
        </div>,
        <span className="whitespace-nowrap">{formatDate(contract.start_date)}</span>,
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{formatDate(contract.next_payment_due_date)}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {cycleLabel(contract.payment_cycle_days)}
          </span>
        </div>,
        <span className="font-medium">{formatCurrency(contract.monthly_total)}</span>,
        <Badge className={overdueBadge(contract.overdue_status)}>
          {contract.overdue_status === 'overdue'
            ? 'En retard'
            : contract.overdue_status === 'due_soon'
              ? 'Échéance proche'
              : 'À jour'}
        </Badge>,
      ],
    };
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== 'All Status' ||
    cycleFilter !== 'All Cycles' ||
    sortState.by !== DEFAULT_SORT.by ||
    sortState.dir !== DEFAULT_SORT.dir;

  const filterBadgeCount = [
    searchTerm,
    statusFilter !== 'All Status' ? statusFilter : null,
    cycleFilter !== 'All Cycles' ? cycleFilter : null,
    stringifySort(sortState),
  ].filter(Boolean).length;


  return (
    <AuthenticatedLayout user={auth.user}>
      <div className="space-y-4">
        <div className="space-y-4 md:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm">
              <RentalsIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Locations Longue Durée</h1>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-2">
                <AdminSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={() => applyFilters()}
                  onReset={hasActiveFilters ? clearFilters : undefined}
                  resetVisible={hasActiveFilters}
                  hideResetIcon
                />

                <AdminFilterTrigger
                  badgeCount={hasActiveFilters ? filterBadgeCount : undefined}
                  onClick={() => setShowFiltersDialog((v) => !v)}
                />
              </div>
            </div>
          </div>

          {showFiltersDialog && (
            <div className="p-4 border rounded-lg bg-muted/40 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block text-sm font-medium" htmlFor="statusFilter-mobile">
                    Statut de paiement
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="statusFilter-mobile" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Status">All Status</SelectItem>
                      <SelectItem value="on_time">À jour</SelectItem>
                      <SelectItem value="due_soon">Échéance proche</SelectItem>
                      <SelectItem value="overdue">En retard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium" htmlFor="cycleFilter-mobile">
                    Cycle de paiement
                  </Label>
                  <Select value={cycleFilter} onValueChange={setCycleFilter}>
                    <SelectTrigger id="cycleFilter-mobile" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Cycles">All Cycles</SelectItem>
                      <SelectItem value="30">Mensuel</SelectItem>
                      <SelectItem value="15">Tous les 15 jours</SelectItem>
                      <SelectItem value="10">Tous les 10 jours</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium" htmlFor="sortSelect-mobile">
                    Tri
                  </Label>
                  <Select
                    value={stringifySort(sortState)}
                    onValueChange={(value) => {
                      const next = parseSortParam(value);
                      setSortState(next);
                      applyFilters(next);
                    }}
                  >
                    <SelectTrigger id="sortSelect-mobile" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="next_payment_due_date_asc">Échéance croissante</SelectItem>
                      <SelectItem value="next_payment_due_date_desc">Échéance décroissante</SelectItem>
                      <SelectItem value="start_date_desc">Début le plus récent</SelectItem>
                      <SelectItem value="start_date_asc">Début le plus ancien</SelectItem>
                      <SelectItem value="monthly_price_desc">Loyer décroissant</SelectItem>
                      <SelectItem value="monthly_price_asc">Loyer croissant</SelectItem>
                      <SelectItem value="id_desc">ID décroissant</SelectItem>
                      <SelectItem value="id_asc">ID croissant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Surveillez les échéances pour prioriser les encaissements.
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                    <X className="w-3 h-3" />
                    Effacer
                  </Button>
                  <Button size="sm" onClick={() => applyFilters()}>
                    Appliquer
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {rentalData.length > 0 ? (
              rentalData.map((rental: any) => {
                const client = rental.client || {};
                const carModel = rental.carModel || {};
                const car = rental.car || {};
                const vehiclesLabel = rental.vehicles?.length
                  ? rental.vehicles
                    .map((vehicle: any) => `${vehicle.car_model?.brand ?? ''} ${vehicle.car_model?.model ?? ''}`.trim())
                    .filter(Boolean)
                    .join(', ')
                  : '';
                const firstModel = rental.carModel || {};

                return (
                  <AdminMobileCard
                    key={rental.contract_id}
                    onClick={() => router.visit(route('rentals.longTerm.show', rental.contract_id))}
                    items={[
                      { label: "Contrat", value: `#${rental.contract_id}`, emphasis: true },
                      { label: "Client", value: client.name || "Client inconnu" },
                      { label: "Téléphone", value: client.phone || "—" },
                      {
                        label: "Véhicule",
                        value: vehiclesLabel || `${firstModel.brand ?? '—'} ${firstModel.model ?? ''}`,
                      },
                      { label: "Plaque", value: car.license_plate || "—" },
                      { label: "Début", value: formatDate(rental.start_date) },
                      { label: "Prochaine échéance", value: formatDate(rental.next_payment_due_date) },
                      { label: "Cycle", value: cycleLabel(rental.payment_cycle_days) },
                      { label: "Mensuel", value: formatCurrency(rental.monthly_price), emphasis: true },
                      {
                        label: "Statut",
                        value: (
                          <Badge className={overdueBadge(rental.overdue_status)}>
                            {rental.overdue_status === 'overdue'
                              ? 'En retard'
                              : rental.overdue_status === 'due_soon'
                                ? 'Échéance proche'
                                : 'À jour'}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                );
              })
            ) : (
              <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
            )}
            {pagination.next && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => pagination.onPaginate({ preventDefault() {} } as React.MouseEvent<HTMLAnchorElement>, pagination.next)}
              >
                Charger plus
              </Button>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <AdminResourceCard
            title="Locations Longue Durée"
            description="Vue dédiée aux contrats LLD avec suivi des échéances et retards."
            icon={<RentalsIcon className="h-5 w-5" />}
            actions={
              <>
                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <AdminSearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={() => applyFilters()}
                    onReset={hasActiveFilters ? clearFilters : undefined}
                    resetVisible={hasActiveFilters}
                    hideResetIcon
                  />

                  <AdminFilterTrigger
                    badgeCount={hasActiveFilters ? filterBadgeCount : undefined}
                    onClick={() => setShowFiltersDialog((v) => !v)}
                  />
                </div>
              </>
            }
          >
            {showFiltersDialog && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/40 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium" htmlFor="statusFilter">
                      Statut de paiement
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="statusFilter" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Status">All Status</SelectItem>
                        <SelectItem value="on_time">À jour</SelectItem>
                        <SelectItem value="due_soon">Échéance proche</SelectItem>
                        <SelectItem value="overdue">En retard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium" htmlFor="cycleFilter">
                      Cycle de paiement
                    </Label>
                    <Select value={cycleFilter} onValueChange={setCycleFilter}>
                      <SelectTrigger id="cycleFilter" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Cycles">All Cycles</SelectItem>
                        <SelectItem value="30">Mensuel</SelectItem>
                        <SelectItem value="15">Tous les 15 jours</SelectItem>
                        <SelectItem value="10">Tous les 10 jours</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium" htmlFor="sortSelect">
                      Tri
                    </Label>
                    <Select
                      value={stringifySort(sortState)}
                      onValueChange={(value) => {
                        const next = parseSortParam(value);
                        setSortState(next);
                        applyFilters(next);
                      }}
                    >
                      <SelectTrigger id="sortSelect" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="next_payment_due_date_asc">Échéance croissante</SelectItem>
                        <SelectItem value="next_payment_due_date_desc">Échéance décroissante</SelectItem>
                        <SelectItem value="start_date_desc">Début le plus récent</SelectItem>
                        <SelectItem value="start_date_asc">Début le plus ancien</SelectItem>
                        <SelectItem value="monthly_price_desc">Loyer décroissant</SelectItem>
                        <SelectItem value="monthly_price_asc">Loyer croissant</SelectItem>
                        <SelectItem value="id_desc">ID décroissant</SelectItem>
                        <SelectItem value="id_asc">ID croissant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Surveillez les échéances pour prioriser les encaissements.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-1">
                      <X className="w-3 h-3" />
                      Effacer
                    </Button>
                    <Button size="sm" onClick={() => applyFilters()}>
                      Appliquer
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <AdminTable
              columns={columns}
              data={rentalData}
              renderRow={renderRow}
              sort={sortState}
              onSort={handleSort}
              emptyMessage="Aucun contrat LLD trouvé."
              pagination={rentalData.length > 0 ? pagination : undefined}
            />
          </AdminResourceCard>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground mb-2">Aucun contrat LLD trouvé.</p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Effacer les filtres
        </Button>
      )}
    </div>
  );
}
