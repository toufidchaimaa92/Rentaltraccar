import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";

import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type CarModel = {
  id: number;
  brand: string;
  model: string;
  fuel_type: string;
  price_per_day: number;
  transmission?: string | null;
  finish?: string | null;
};

type Filters = {
  search?: string;
  fuel_type?: string;
  transmission?: string;
  sort?: string | AdminSortState | null;
};

type Props = {
  auth: { user: any };
  carModels: { data: CarModel[]; links: any[] };
  filters: Filters;
  flash?: { success?: string };
};

const DEFAULT_SORT: AdminSortState = { by: "brand", dir: "asc" };

function parseSortParam(sort?: string | AdminSortState | null): AdminSortState {
  if (!sort) return DEFAULT_SORT;

  if (typeof sort === "object") {
    return {
      by: sort.by ?? DEFAULT_SORT.by,
      dir: sort.dir ?? DEFAULT_SORT.dir,
    };
  }

  const [by, dir] = sort.split("_");
  return { by: by || DEFAULT_SORT.by, dir: (dir as "asc" | "desc") || DEFAULT_SORT.dir };
}

function stringifySort(sort?: AdminSortState) {
  if (!sort?.by) return undefined;
  return `${sort.by}_${sort.dir ?? "asc"}`;
}

export default function CarModelsIndex({ auth, carModels, filters }: Props) {
  const { flash } = usePage<Props>().props;
  const CarModelsIcon = resourceIcons.carModels;

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
  }, [flash]);

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [fuelType, setFuelType] = useState(filters.fuel_type || "");
  const [transmission, setTransmission] = useState(filters.transmission || "");
  const [sortState, setSortState] = useState<AdminSortState>(() => parseSortParam(filters.sort));
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);

  const applyFilters = (nextSort?: AdminSortState) => {
    const params: any = {};
    const sortToUse = nextSort ?? sortState;

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (fuelType) params.fuel_type = fuelType;
    if (transmission) params.transmission = transmission;
    if (stringifySort(sortToUse)) params.sort = stringifySort(sortToUse);

    router.get(route("car-models.index"), params, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFuelType("");
    setTransmission("");
    setSortState(DEFAULT_SORT);

    router.get(route("car-models.index"), {}, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const sortIsDefault = sortState.by === DEFAULT_SORT.by && sortState.dir === DEFAULT_SORT.dir;
  const hasActiveFilters = [
    searchTerm,
    fuelType,
    transmission,
    !sortIsDefault ? stringifySort(sortState) : null,
  ].filter(Boolean).length > 0;

  const filterBadgeCount = [
    searchTerm,
    fuelType,
    transmission,
    !sortIsDefault ? stringifySort(sortState) : null,
  ].filter(Boolean).length;

  const paginationMeta = useMemo(() => adminPaginationFromLinks(carModels.links), [carModels.links]);
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
      { id: "brand", label: "Marque", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "model", label: "Modèle", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "fuel_type", label: "Carburant", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "price_per_day", label: "Prix / Jour", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "transmission", label: "Transmission", headerClassName: "whitespace-nowrap" },
      { id: "finish", label: "Finition", headerClassName: "whitespace-nowrap" },
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

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      router.delete(route("car-models.destroy", id), {
        preserveScroll: true,
        onSuccess: () => toast.success("Modèle supprimé avec succès"),
      });
    }
  };

  const renderRow = (model: CarModel): AdminTableRow => {
    return {
      key: model.id,
      onClick: () => router.get(route("car-models.show", model.id)),
      cells: [
        <span className="font-medium">{model.brand}</span>,
        <span>{model.model}</span>,
        <span>{model.fuel_type}</span>,
        <span className="whitespace-nowrap">{Math.round(model.price_per_day)} MAD</span>,
        <span>{model.transmission || "—"}</span>,
        <span>{model.finish || "—"}</span>,
      ],
    };
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Liste des modèles de voitures" />

      <div className="space-y-4">
        <div className="space-y-4 md:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm">
              <CarModelsIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Liste des modèles</h1>
              <AdminFilterTrigger
                badgeCount={filterBadgeCount}
                onClick={() => setShowFiltersDialog(true)}
              />
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <Link href={route("car-models.create")}>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau modèle
                </Button>
              </Link>
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

          {(carModels.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun modèle trouvé.</p>
          ) : (
            (carModels.data || []).map((model) => (
              <AdminMobileCard
                key={model.id}
                onClick={() => router.get(route("car-models.show", model.id))}
                items={[
                  { label: "Marque", value: model.brand, emphasis: true },
                  { label: "Modèle", value: model.model },
                  { label: "Carburant", value: model.fuel_type },
                  { label: "Transmission", value: model.transmission || "—" },
                  { label: "Finition", value: model.finish || "—" },
                  { label: "Prix/jour", value: `${Math.round(model.price_per_day)} MAD`, emphasis: true },
                ]}
              />
            ))
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

        <div className="hidden md:block">
          <AdminResourceCard
            title="Liste des modèles"
            icon={<CarModelsIcon className="h-5 w-5" />}
            actions={
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
                  <div className="flex flex-col-reverse gap-2 sm:w-full sm:flex-row sm:items-center sm:justify-between">
                    <AdminSearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      onSearch={() => applyFilters()}
                      onReset={hasActiveFilters ? clearFilters : undefined}
                      resetVisible={hasActiveFilters}
                    />

                    <AdminFilterTrigger badgeCount={filterBadgeCount} />
                  </div>

                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Filtrer et trier</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label>Carburant</label>
                        <Input
                          placeholder="Ex: Diesel, Essence, Hybride"
                          value={fuelType}
                          onChange={(e) => setFuelType(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label>Transmission</label>
                        <Input
                          placeholder="Ex: Automatique, Manuelle"
                          value={transmission}
                          onChange={(e) => setTransmission(e.target.value)}
                        />
                      </div>
                    </div>

                    <DialogFooter
                      className="
                        flex flex-col-reverse gap-2
                        sm:flex-row sm:items-center sm:justify-between
                      "
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        className="
                          w-full sm:w-auto
                          justify-center
                          text-destructive
                          hover:bg-destructive/10
                          hover:text-destructive
                        "
                        onClick={clearFilters}
                      >
                        <X className="mr-1 h-4 w-4" />
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

                <Link href={route("car-models.create")}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau modèle
                  </Button>
                </Link>
              </div>
            }
          >
            <AdminTable
              columns={columns}
              data={carModels.data || []}
              renderRow={renderRow}
              sort={sortState}
              onSort={handleSort}
              emptyMessage="Aucun modèle trouvé."
              pagination={pagination}
            />
          </AdminResourceCard>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}