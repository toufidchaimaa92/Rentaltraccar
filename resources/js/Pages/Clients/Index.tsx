import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
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
import { Check, Plus, X } from "lucide-react";
import { Rating, RatingButton } from "@/components/ui/shadcn-io/rating";
import { resourceIcons } from "@/constants/resource-icons";

interface ClientDto {
  id: number;
  name: string;
  phone?: string | null;
  rating?: number | null;
  identity_card_number?: string | null;
  license_number?: string | null;
  created_at?: string;
}

interface Filters {
  search?: string;
  sort?: string | AdminSortState | null;
}

interface Props {
  auth: { user: any };
  clients: { data: ClientDto[]; links: any[] };
  filters: Filters;
}

const DEFAULT_SORT: AdminSortState = { by: "name", dir: "asc" };

function parseSortParam(sort?: string | AdminSortState | null): AdminSortState {
  if (!sort) return DEFAULT_SORT;
  if (typeof sort === "object") {
    return { by: sort.by ?? DEFAULT_SORT.by, dir: sort.dir ?? DEFAULT_SORT.dir };
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function ClientsIndex() {
  const { auth, clients, filters } = usePage<Props>().props;
  const ClientsIcon = resourceIcons.clients;

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [sortState, setSortState] = useState<AdminSortState>(() => parseSortParam(filters.sort));
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = (nextSort?: AdminSortState) => {
    const params: Record<string, any> = {};
    const sortToUse = nextSort ?? sortState;

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (stringifySort(sortToUse)) params.sort = stringifySort(sortToUse);

    router.get(route("clients.index"), params, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortState(DEFAULT_SORT);

    router.get(route("clients.index"), {}, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const sortIsDefault = sortState.by === DEFAULT_SORT.by && sortState.dir === DEFAULT_SORT.dir;
  const filterBadgeCount = [searchTerm || null, !sortIsDefault ? stringifySort(sortState) : null].filter(Boolean).length;

  const paginationMeta = useMemo(() => adminPaginationFromLinks(clients.links), [clients.links]);
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
      { id: "name", label: "Nom", sortable: true },
      { id: "phone", label: "Téléphone", sortable: true },
      { id: "identity_card_number", label: "Carte d'identité", sortable: false },
      { id: "license_number", label: "Numéro de permis", sortable: false },
      { id: "rating", label: "Note", sortable: true },
    ],
    [],
  );

  const renderRating = (value?: number | null) => {
    if (!Number.isFinite(value)) {
      return <span className="text-muted-foreground">—</span>;
    }

    return (
      <Rating value={value} readOnly>
        {Array.from({ length: 5 }).map((_, index) => (
          <RatingButton
            key={index}  size={15}
            className="text-yellow-500 fill-yellow-500"
          />
        ))}
      </Rating>
    );
  };

  const handleSort = (column: string) => {
    const nextSort: AdminSortState =
      sortState.by === column
        ? { by: column, dir: sortState.dir === "asc" ? "desc" : "asc" }
        : { by: column, dir: "asc" };

    setSortState(nextSort);
    applyFilters(nextSort);
  };

  const handleDelete = (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce client ?")) {
      router.delete(route("clients.destroy", id));
    }
  };

  const renderRow = (client: ClientDto): AdminTableRow => ({
    key: client.id,
    onClick: () => router.get(route("clients.show", client.id)),
    cells: [
      <span className="font-medium">{client.name}</span>,
      <span>{client.phone || "—"}</span>,
      <span>{client.identity_card_number || "—"}</span>,
      <span>{client.license_number || "—"}</span>,
      renderRating(client?.rating ?? null),
    ],
  });

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Clients" />

      <div>
        <div className="space-y-4 md:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm">
              <ClientsIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
              <AdminFilterTrigger
                badgeCount={filterBadgeCount}
                onClick={() => setShowFilters(true)}
              />
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <Link href={route("clients.create")}>
                <Button className="w-full gap-2" size="sm">
                  <Plus className="h-4 w-4" />
                  Nouveau
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-2">
                <AdminSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={() => applyFilters()}
                  onReset={clearFilters}
                  resetVisible={Boolean(filterBadgeCount)}
                  placeholder="Rechercher par nom, téléphone, CIN ou permis…"
                />
              </div>
            </div>
          </div>

          {(clients.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun client trouvé.</p>
          ) : (
            (clients.data || []).map((client) => (
              <AdminMobileCard
                key={client.id}
                onClick={() => router.visit(route("clients.show", client.id))}
                items={[
                  { label: "Client", value: client.name ?? "—", emphasis: true },
                  { label: "Téléphone", value: client.phone || "—" },
                  { label: "Carte d'identité", value: client.identity_card_number || "—" },
                  { label: "Numéro de permis", value: client.license_number || "—" },
                  { label: "Note", value: renderRating(client?.rating ?? null) },
                ]}
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
            title="Clients"
            icon={<ClientsIcon className="h-5 w-5" />}
            actions={
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Dialog open={showFilters} onOpenChange={setShowFilters}>
                  <div className="flex flex-col-reverse gap-2 sm:w-full sm:flex-row sm:items-center sm:justify-between">
                    <AdminSearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      onSearch={() => applyFilters()}
                      onReset={clearFilters}
                      resetVisible={Boolean(filterBadgeCount)}
                      placeholder="Rechercher par nom, téléphone, CIN ou permis…"
                    />

                    <AdminFilterTrigger badgeCount={filterBadgeCount} />
                  </div>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Affiner les résultats</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Tri</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[{ value: "name_asc", label: "Nom A-Z" }, { value: "name_desc", label: "Nom Z-A" }, { value: "phone_asc", label: "Téléphone A-Z" }, { value: "phone_desc", label: "Téléphone Z-A" }, { value: "rating_desc", label: "Note (haut - bas)" }, { value: "rating_asc", label: "Note (bas - haut)" }].map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant={stringifySort(sortState) === option.value ? "default" : "outline"}
                              className="justify-start"
                              onClick={() => setSortState(parseSortParam(option.value))}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <DialogFooter
                      className="
    flex flex-col-reverse gap-2
    sm:flex-row sm:items-center sm:justify-between
  "
                    >
                      {/* Reset / Réinitialiser */}
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

                      {/* Apply / Appliquer */}
                      <Button
                        onClick={() => {
                          setShowFilters(false);
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

                <Link href={route("clients.create")}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau client
                  </Button>
                </Link>
              </div>
            }
          >
            <AdminTable
              columns={columns}
              data={clients.data || []}
              renderRow={renderRow}
              sort={sortState}
              onSort={handleSort}
              emptyMessage="Aucun client trouvé."
              pagination={pagination}
            />
          </AdminResourceCard>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
