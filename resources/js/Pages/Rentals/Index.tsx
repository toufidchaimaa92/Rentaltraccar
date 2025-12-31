import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Check, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

// Helper to format date
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

// Helper to format currency without decimals
function formatCurrency(amount: number) {
  return `${Math.round(amount)} MAD`;
}

// Status badge color mapping
function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return `
        bg-yellow-100 text-yellow-800
        dark:bg-yellow-900/30 dark:text-yellow-300
        border border-yellow-200 dark:border-yellow-800
      `;

    case 'confirmed':
      return `
        bg-blue-100 text-blue-800
        dark:bg-blue-900/30 dark:text-blue-300
        border border-blue-200 dark:border-blue-800
      `;

    case 'active':
      return `
        bg-emerald-100 text-emerald-800
        dark:bg-emerald-900/30 dark:text-emerald-300
        border border-emerald-200 dark:border-emerald-800
      `;

    case 'completed':
      return `
        bg-muted text-muted-foreground
        border border-border
      `;

    case 'cancelled':
      return `
        bg-red-100 text-red-800
        dark:bg-red-900/30 dark:text-red-300
        border border-red-200 dark:border-red-800
      `;

    default:
      return `
        bg-muted text-muted-foreground
        border border-border
      `;
  }
}



const DEFAULT_SORT: AdminSortState = { by: 'id', dir: 'desc' };

function parseSortParam(sort?: string): AdminSortState {
  if (!sort) return DEFAULT_SORT;
  const [by, dir] = sort.split('_');
  return { by: by || DEFAULT_SORT.by, dir: (dir as 'asc' | 'desc') || DEFAULT_SORT.dir };
}

function stringifySort(sort?: AdminSortState) {
  if (!sort?.by) return undefined;
  return `${sort.by}_${sort.dir ?? 'asc'}`;
}

export default function RentalsIndex({ auth, rentals, filters }: any) {
  const RentalsIcon = resourceIcons.rentals;
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [filterStatus, setFilterStatus] = useState(filters?.status || 'All Status');
  const [startDate, setStartDate] = useState(filters?.start_date || '');
  const [endDate, setEndDate] = useState(filters?.end_date || '');
  const [clientSearch, setClientSearch] = useState(filters?.client_search || '');
  const [carSearch, setCarSearch] = useState(filters?.car_search || '');
  const [licensePlateSearch, setLicensePlateSearch] = useState(filters?.license_plate_search || '');
  const [sortState, setSortState] = useState<AdminSortState>(() => parseSortParam(filters?.sort));
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);

  const rentalData = rentals.data || [];

  const applyFilters = (nextSort?: AdminSortState) => {
    const params: any = {};
    const sortToUse = nextSort ?? sortState;

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (filterStatus && filterStatus !== 'All Status') params.status = filterStatus.toLowerCase();
    if (clientSearch.trim()) params.client_search = clientSearch.trim();
    if (carSearch.trim()) params.car_search = carSearch.trim();
    if (licensePlateSearch.trim()) params.license_plate_search = licensePlateSearch.trim();
    if (stringifySort(sortToUse)) params.sort = stringifySort(sortToUse);

    router.get(route('rentals.index'), params, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterStatus('All Status');
    setClientSearch('');
    setCarSearch('');
    setLicensePlateSearch('');
    setSearchTerm('');
    setSortState(DEFAULT_SORT);

    router.get(route('rentals.index'), {}, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const sortIsDefault = sortState.by === DEFAULT_SORT.by && sortState.dir === DEFAULT_SORT.dir;
  const hasActiveFilters =
    startDate ||
    endDate ||
    filterStatus !== 'All Status' ||
    clientSearch ||
    carSearch ||
    licensePlateSearch ||
    searchTerm ||
    !sortIsDefault;

  const filterBadgeCount = [
    startDate,
    endDate,
    filterStatus !== 'All Status' ? filterStatus : null,
    clientSearch,
    carSearch,
    licensePlateSearch,
    searchTerm,
    !sortIsDefault ? stringifySort(sortState) : null,
  ].filter(Boolean).length;

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
      { id: 'id', label: 'ID', sortable: true, headerClassName: 'w-16 whitespace-nowrap' },
      { id: 'client', label: 'Client', headerClassName: 'whitespace-nowrap' },
      { id: 'car', label: 'Voiture', headerClassName: 'whitespace-nowrap' },
      { id: 'start_date', label: 'Dates', sortable: true, headerClassName: 'whitespace-nowrap' },
      { id: 'total_price', label: 'Total', headerClassName: 'whitespace-nowrap' },
      { id: 'status', label: 'Statut', sortable: true, headerClassName: 'whitespace-nowrap' },
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

  const renderRow = (rental: any): AdminTableRow => {
    const totalPaidRaw = rental.payments
      ? rental.payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
      : 0;
    const totalPaid = isNaN(totalPaidRaw) ? 0 : totalPaidRaw;
    const remainingToPay = Math.max(rental.total_price - totalPaid, 0);
    const client = rental.client || {};
    const carModel = rental.carModel || {};
    const car = rental.car || {};

    return {
      key: rental.id,
      onClick: () => router.get(route('rentals.show', rental.id)),
      cells: [
        <span className="font-medium">#{rental.id}</span>,
        <span>{client.name || '—'}</span>,
        <span>
          {(carModel.brand ?? 'Marque inconnue') + ' ' + (carModel.model ?? 'Modèle inconnu')} {car.license_plate || '❌'}
        </span>,
        <span className="whitespace-nowrap">{formatDate(rental.start_date)} - {formatDate(rental.end_date)}</span>,
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{formatCurrency(rental.total_price)}</span>
          {totalPaid > 0 && <span className="text-xs text-green-600">Payé: {formatCurrency(totalPaid)}</span>}
          {remainingToPay > 0 && <span className="text-xs text-red-600">Reste: {formatCurrency(remainingToPay)}</span>}
        </div>,
        <Badge className={getStatusColor(rental.status)}>{rental.status ?? '—'}</Badge>,
      ],
    };
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <div className="space-y-4">
        <div className="space-y-4 md:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm">
              <RentalsIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Liste des locations</h1>
              <AdminFilterTrigger
                badgeCount={hasActiveFilters ? filterBadgeCount : undefined}
                onClick={() => setShowFiltersDialog(true)}
              />
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-2">
                <AdminSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={() => applyFilters()}
                  onReset={hasActiveFilters ? clearFilters : undefined}
                  resetVisible={hasActiveFilters}
                />

              </div>
            </div>
          </div>

          {rentalData.length > 0 ? (
            rentalData.map((rental: any) => {
              const totalPaidRaw = rental.payments
                ? rental.payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
                : 0;
              const totalPaid = isNaN(totalPaidRaw) ? 0 : totalPaidRaw;
              const remainingToPay = Math.max(rental.total_price - totalPaid, 0);
              const client = rental.client || {};
              const carModel = rental.carModel || {};
              const car = rental.car || {};

              return (
                <AdminMobileCard
                  key={rental.id}
                  onClick={() => router.get(route('rentals.show', rental.id))}
                  items={[
                    { label: "Location", value: `#${rental.id}`, emphasis: true },
                    { label: "Client", value: client.name || "—" },
                    {
                      label: "Voiture",
                      value: `${carModel.brand ?? "Marque inconnue"} ${carModel.model ?? "Modèle inconnu"}`,
                    },
                    { label: "Plaque", value: car.license_plate || "—" },
                    { label: "Dates", value: `${formatDate(rental.start_date)} - ${formatDate(rental.end_date)}` },
                    { label: "Statut", value: <Badge className={getStatusColor(rental.status)}>{rental.status ?? "—"}</Badge> },
                    { label: "Total", value: formatCurrency(rental.total_price), emphasis: true },
                    {
                      label: "Payé",
                      value: totalPaid > 0 ? <span className="text-green-600">{formatCurrency(totalPaid)}</span> : "—",
                    },
                    {
                      label: "Reste",
                      value: remainingToPay > 0 ? <span className="text-red-600">{formatCurrency(remainingToPay)}</span> : "—",
                      emphasis: true,
                    },
                  ]}
                />
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">Aucune location trouvée.</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              )}
            </div>
          )}
          {pagination.next && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => pagination.onPaginate({ preventDefault() { } } as React.MouseEvent<HTMLAnchorElement>, pagination.next)}
            >
              Charger plus
            </Button>
          )}
        </div>

        <div className="hidden md:block">
          <AdminResourceCard
            title="Liste des locations"
            icon={<RentalsIcon className="h-5 w-5" />}
            actions={
              <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
                <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <AdminSearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={() => applyFilters()}
                    onReset={hasActiveFilters ? clearFilters : undefined}
                    resetVisible={hasActiveFilters}
                  />

                  <AdminFilterTrigger badgeCount={hasActiveFilters ? filterBadgeCount : undefined} />
                </div>

                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Affiner les résultats</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        Période de location
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          placeholder="Date début"
                        />
                        <input
                          type="date"
                          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          placeholder="Date fin"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Affiche les locations actives pendant cette période.</p>
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium">Statut</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All Status">All Status</SelectItem>
                          <SelectItem value="pending">pending</SelectItem>
                          <SelectItem value="confirmed">confirmed</SelectItem>
                          <SelectItem value="active">active</SelectItem>
                          <SelectItem value="completed">completed</SelectItem>
                          <SelectItem value="cancelled">cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2">Client</label>
                      <input
                        type="text"
                        placeholder="Nom ou téléphone..."
                        className="w-full px-3 py-2 text-sm border  rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Voiture</label>
                      <input
                        type="text"
                        placeholder="Marque ou modèle..."
                        className="w-full px-3 py-2 text-sm border  rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={carSearch}
                        onChange={(e) => setCarSearch(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Immatriculation</label>
                      <input
                        type="text"
                        placeholder="Plaque d'immatriculation..."
                        className="w-full px-3 py-2 text-sm border  rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={licensePlateSearch}
                        onChange={(e) => setLicensePlateSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {startDate && endDate ? (
                      <span className="bg-blue-100 text-muted-foreground px-2 py-1 rounded">
                        Du {formatDate(startDate)} au {formatDate(endDate)}
                      </span>
                    ) : startDate ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Locations actives le {formatDate(startDate)}
                      </span>
                    ) : endDate ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Locations actives le {formatDate(endDate)}
                      </span>
                    ) : (
                      <span></span>
                    )}
                  </div>
                  <DialogFooter
                    className="
                      flex flex-col-reverse gap-2
                      sm:flex-row sm:items-center sm:justify-between
                    "
                  >
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="
                        w-full sm:w-auto
                        justify-center
                        text-destructive
                        hover:bg-destructive/10
                        hover:text-destructive
                      "
                    >
                      <X className="h-4 w-4 mr-1" />
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={() => {
                        applyFilters();
                        setShowFiltersDialog(false);
                      }}
                      className="w-full sm:w-auto"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Appliquer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            }
          >
            <AdminTable
              columns={columns}
              data={rentalData}
              renderRow={renderRow}
              sort={sortState}
              onSort={handleSort}
              emptyMessage="Aucune location trouvée."
              pagination={rentalData.length > 0 ? pagination : undefined}
            />
          </AdminResourceCard>
        </div>

        {hasActiveFilters && rentalData.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-900">{rentalData.length}</div>
                <div className="text-blue-700">Locations trouvées</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-900">
                  {rentalData.filter((r: any) => r.status === 'active').length}
                </div>
                <div className="text-green-700">Actives</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-900">
                  {rentalData.filter((r: any) => r.status === 'pending').length}
                </div>
                <div className="text-yellow-700">En attente</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-foreground">
                  {formatCurrency(
                    rentalData.reduce((sum: number, r: any) => {
                      const price = Number(r.total_price) || 0;
                      return sum + price;
                    }, 0)
                  )}
                </div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}