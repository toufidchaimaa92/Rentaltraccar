import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Edit, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
} from "@/components/admin/admin-table";
import AdminMobileCard from "@/components/admin/AdminMobileCard";
import { resourceIcons } from "@/constants/resource-icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Facture {
  id: number;
  invoice_number: string;
  client_name: string;
  created_at: string;
  total_amount: number;
  payment_status: string;
}

interface FactureIndexPageProps extends PageProps {
  factures: {
    data: Facture[];
    links?: any[];
  };
  filters: {
    search?: string;
    month?: string;
    year?: string;
    payment_status?: string;
    sort?: string | AdminSortState | null;
  };
}

const DEFAULT_SORT: AdminSortState = { by: "created_at", dir: "desc" };

function parseSortParam(sort?: string | AdminSortState | null): AdminSortState {
  if (!sort) return DEFAULT_SORT;

  if (typeof sort === "object") {
    return {
      by: sort.by ?? DEFAULT_SORT.by,
      dir: sort.dir ?? DEFAULT_SORT.dir,
    };
  }

  if (typeof sort === "string") {
    const [by, dir] = sort.split("_");
    return { by: by || DEFAULT_SORT.by, dir: (dir as "asc" | "desc") || DEFAULT_SORT.dir };
  }

  return DEFAULT_SORT;
}

function stringifySort(sort?: AdminSortState) {
  if (!sort?.by) return undefined;
  return `${sort.by}_${sort.dir ?? "asc"}`;
}

export default function FactureIndexPage({ auth, factures, filters }: FactureIndexPageProps) {
  const FacturesIcon = resourceIcons.invoices;
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const EMPTY_FILTER_VALUE = "all";
  const [month, setMonth] = useState(filters.month || EMPTY_FILTER_VALUE);
  const [year, setYear] = useState(filters.year || EMPTY_FILTER_VALUE);
  const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || EMPTY_FILTER_VALUE);
  const [sortState, setSortState] = useState<AdminSortState>(() => parseSortParam(filters.sort));
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [newStatus, setNewStatus] = useState<string>("Pas encore payée");

  const normalizeFilterValue = (value: string) => (value === EMPTY_FILTER_VALUE ? "" : value);

  const applyFilters = (nextSort?: AdminSortState) => {
    const params: any = {};
    const sortToUse = nextSort ?? sortState;

    if (searchTerm.trim()) params.search = searchTerm.trim();
    const normalizedMonth = normalizeFilterValue(month);
    const normalizedYear = normalizeFilterValue(year);
    const normalizedStatus = normalizeFilterValue(paymentStatus);

    if (normalizedMonth) params.month = normalizedMonth;
    if (normalizedYear) params.year = normalizedYear;
    if (normalizedStatus) params.payment_status = normalizedStatus;
    if (stringifySort(sortToUse)) params.sort = stringifySort(sortToUse);

    router.get(route("factures.index"), params, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMonth(EMPTY_FILTER_VALUE);
    setYear(EMPTY_FILTER_VALUE);
    setPaymentStatus(EMPTY_FILTER_VALUE);
    setSortState(DEFAULT_SORT);

    router.get(route("factures.index"), {}, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const sortIsDefault = sortState.by === DEFAULT_SORT.by && sortState.dir === DEFAULT_SORT.dir;
  const hasActiveFilters = [
    searchTerm,
    normalizeFilterValue(month),
    normalizeFilterValue(year),
    normalizeFilterValue(paymentStatus),
    !sortIsDefault ? stringifySort(sortState) : null,
  ].filter(Boolean).length > 0;

  const paginationMeta = useMemo(() => adminPaginationFromLinks(factures.links), [factures.links]);
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
      { id: "invoice_number", label: "N°", sortable: true, headerClassName: "w-28 whitespace-nowrap" },
      { id: "client_name", label: "Client", sortable: true },
      { id: "created_at", label: "Date", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "total_amount", label: "Total", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "payment_status", label: "Statut", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "actions", label: "Actions", headerClassName: "w-28 text-center" },
    ],
    [],
  );

  const handleSort = (column: string) => {
    const nextSort: AdminSortState =
      sortState.by === column
        ? { by: column, dir: sortState.dir === "asc" ? "desc" : "asc" }
        : { by: column, dir: "asc" };

    setSortState(nextSort);
    applyFilters(nextSort);
  };

  const openEditDialog = (facture: Facture) => {
    setEditingFacture(facture);
    setNewStatus(facture.payment_status);
  };

  const closeEditDialog = () => {
    setEditingFacture(null);
    setNewStatus("Pas encore payée");
  };

  const saveStatus = async () => {
    if (!editingFacture) return;

    await router.patch(route("factures.updatePaymentStatus", editingFacture.id), {
      payment_status: newStatus,
    });

    closeEditDialog();
    router.reload({ only: ["factures", "filters"] });
  };

  const renderRow = (facture: Facture): AdminTableRow => {
    return {
      key: facture.id,
      onClick: () => router.get(route("factures.show", facture.id)),
      cells: [
        <span className="font-medium">{facture.invoice_number}</span>,
        <span>{facture.client_name}</span>,
        <span className="whitespace-nowrap">
          {new Date(facture.created_at).toLocaleDateString("fr-FR")}
        </span>,
        <span className="font-semibold">{facture.total_amount?.toFixed(2)} DH</span>,
        <Badge
          variant="secondary"
          className={
            facture.payment_status === "Payée"
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }
        >
          {facture.payment_status}
        </Badge>,
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="secondary"
            className="p-2"
            onClick={() => openEditDialog(facture)}
            aria-label="Modifier le statut de paiement"
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>,
      ],
    };
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Factures" />

      <div className="space-y-4">
        <div className="space-y-4 md:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm">
              <FacturesIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Liste des factures</h1>
              <AdminFilterTrigger
                badgeCount={[searchTerm, month, year, paymentStatus, !sortIsDefault ? "sort" : null]
                  .filter(Boolean)
                  .length || undefined}
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

          {(factures.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune facture trouvée.</p>
          ) : (
            (factures.data || []).map((facture) => (
              <AdminMobileCard
                key={facture.id}
                onClick={() => router.visit(route("factures.show", facture.id))}
                items={[
                  { label: "Facture", value: facture.invoice_number, emphasis: true },
                  { label: "Client", value: facture.client_name },
                  { label: "Date", value: new Date(facture.created_at).toLocaleDateString("fr-FR") },
                  { label: "Total", value: `${facture.total_amount?.toFixed(2)} DH`, emphasis: true },
                  {
                    label: "Statut",
                    value: (
                      <Badge
                        variant="secondary"
                        className={
                          facture.payment_status === "Payée"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        {facture.payment_status}
                      </Badge>
                    ),
                  },
                ]}
                footer={(
                  <Button
                    size="sm"
                    variant="secondary"
                    className="p-2"
                    onClick={() => openEditDialog(facture)}
                    aria-label="Modifier le statut de paiement"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              />
            ))
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
            title="Liste des factures"
            icon={<FacturesIcon className="h-5 w-5" />}
            actions={
              <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
                <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <AdminSearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSearch={() => applyFilters()}
                    onReset={hasActiveFilters ? clearFilters : undefined}
                    resetVisible={hasActiveFilters}
                  />

                  <AdminFilterTrigger
                    badgeCount={[searchTerm, month, year, paymentStatus, !sortIsDefault ? "sort" : null]
                      .filter(Boolean)
                      .length || undefined}
                  />
                </div>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Affiner les résultats</DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mois</Label>
                      <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tous les mois" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_FILTER_VALUE}>Tous les mois</SelectItem>
                          {Array.from({ length: 12 }, (_, i) => {
                            const date = new Date(0, i);
                            return (
                              <SelectItem key={i + 1} value={(i + 1).toString().padStart(2, "0")}>
                                {date.toLocaleString("fr-FR", { month: "long" })}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Année</Label>
                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Toutes les années" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_FILTER_VALUE}>Toutes les années</SelectItem>
                          {Array.from({ length: 5 }, (_, i) => {
                            const y = new Date().getFullYear() - i;
                            return (
                              <SelectItem key={y} value={String(y)}>
                                {y}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Statut de paiement</Label>
                      <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_FILTER_VALUE}>Tous les statuts</SelectItem>
                          <SelectItem value="Pas encore payée">Pas encore payée</SelectItem>
                          <SelectItem value="Payée">Payée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tri</Label>
                      <Select
                        value={stringifySort(sortState)}
                        onValueChange={(value) => {
                          const next = parseSortParam(value);
                          setSortState(next);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at_desc">Date (récent - ancien)</SelectItem>
                          <SelectItem value="created_at_asc">Date (ancien - récent)</SelectItem>
                          <SelectItem value="invoice_number_asc">N° facture (croissant)</SelectItem>
                          <SelectItem value="invoice_number_desc">N° facture (décroissant)</SelectItem>
                          <SelectItem value="client_name_asc">Client (A-Z)</SelectItem>
                          <SelectItem value="client_name_desc">Client (Z-A)</SelectItem>
                          <SelectItem value="total_amount_desc">Montant (haut - bas)</SelectItem>
                          <SelectItem value="total_amount_asc">Montant (bas - haut)</SelectItem>
                          <SelectItem value="payment_status_asc">Statut (A-Z)</SelectItem>
                          <SelectItem value="payment_status_desc">Statut (Z-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                        setShowFiltersDialog(false);
                        applyFilters();
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
              data={factures.data}
              renderRow={renderRow}
              sort={sortState}
              onSort={handleSort}
              pagination={pagination}
              emptyMessage="Aucune facture trouvée."
            />
          </AdminResourceCard>
        </div>
      </div>

      <Dialog open={!!editingFacture} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le statut de paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_status">Statut de paiement</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pas encore payée">Pas encore payée</SelectItem>
                  <SelectItem value="Payée">Payée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Annuler
            </Button>
            <Button onClick={saveStatus}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
