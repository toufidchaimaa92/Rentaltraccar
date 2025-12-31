import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Check, Edit, Eye, Printer, Trash2, X } from "lucide-react";

import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface CarModel {
  brand?: string | null;
  model?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  finish?: string | null;
  price_per_day?: number | string | null;
}

interface Car {
  id: number;
  car_model_id?: number | null;
  car_model?: CarModel | null;
  license_plate?: string | null;
  wwlicense_plate?: string | null;
  status?: string | null;
  monthly_benefit?: number;
  monthly_expense?: number;
  monthly_result?: number;
}

interface Filters {
  search?: string;
  status?: string;
  sort?: string | AdminSortState | null;
}

interface Props {
  auth: { user: any };
  cars: { data: Car[]; links: any[] };
  filters: Filters;
  flash?: { success?: string };
  printCars: Car[];
}

const DEFAULT_SORT: AdminSortState = { by: "brand", dir: "asc" };
const STATUS_OPTIONS = [
  { label: "Tous les statuts", value: "" },
  { label: "Disponible", value: "available" },
  { label: "Louée", value: "rented" },
  { label: "Réservée", value: "reserved" },
  { label: "Maintenance", value: "maintenance" },
];

type PrintableField = {
  key: string;
  label: string;
  accessor: (car: Car) => string | number | null | undefined;
};

function getStatusDisplay(status?: string | null) {
  const normalized = (status || "").toLowerCase();

  const map: Record<string, { label: string; color: [number, number, number] }> = {
    available: { label: "Disponible", color: [16, 128, 67] },
    rented: { label: "Louée", color: [200, 0, 0] },
    reserved: { label: "Réservée", color: [17, 94, 250] },
    maintenance: { label: "Maintenance", color: [20, 20, 20] },
  };

  return (
    map[normalized] || {
      label: status || "—",
      color: [60, 60, 60],
    }
  );
}

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

function formatCurrency(amount?: number | null) {
  const value = Number(amount ?? 0);
  return `${value.toFixed(0)}`;
}

function statusBadge(status?: string | null) {
  const normalized = (status || "").toLowerCase();
  const map: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-800",
    rented: "bg-blue-100 text-blue-800",
    reserved: "bg-amber-100 text-amber-800",
    maintenance: "bg-rose-100 text-rose-800",
  };

  return map[normalized] || "bg-gray-100 text-foreground";
}

const PRINT_FIELD_GROUPS: { title: string; fields: PrintableField[] }[] = [
  {
    title: "Champs requis pour l'impression",
    fields: [
      { key: "id", label: "ID", accessor: (car) => car.id },
      { key: "brand", label: "Marque", accessor: (car) => car.car_model?.brand || "—" },
      { key: "model", label: "Modèle", accessor: (car) => car.car_model?.model || "—" },
      { key: "finish", label: "Finition", accessor: (car) => car.car_model?.finish || "—" },
      { key: "fuel_type", label: "Carburant", accessor: (car) => car.car_model?.fuel_type || "—" },
      { key: "transmission", label: "Transmission", accessor: (car) => car.car_model?.transmission || "—" },
      { key: "license_plate", label: "Matricule", accessor: (car) => car.license_plate || "—" },
      { key: "wwlicense_plate", label: "WW Matri", accessor: (car) => car.wwlicense_plate || "—" },
      {
        key: "price_per_day",
        label: "Prix",
        accessor: (car) =>
          car.car_model?.price_per_day !== undefined && car.car_model?.price_per_day !== null
            ? formatCurrency(Number(car.car_model.price_per_day))
            : "—",
      },
      {
        key: "status",
        label: "Statut",
        accessor: (car) => getStatusDisplay(car.status).label,
      },
    ],
  },
];

const ALL_PRINT_FIELDS: PrintableField[] = PRINT_FIELD_GROUPS.flatMap((group) => group.fields);

export default function CarsIndex({ auth, cars, filters, printCars }: Props) {
  const { flash } = usePage<Props>().props;
  const CarsIcon = resourceIcons.cars;

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
  }, [flash]);

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [status, setStatus] = useState(filters.status || "");
  const [sortState, setSortState] = useState<AdminSortState>(() => parseSortParam(filters.sort));
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(() => ALL_PRINT_FIELDS.map((field) => field.key));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("car-print-fields");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const validFields = parsed.filter((key) => ALL_PRINT_FIELDS.some((field) => field.key === key));
        if (validFields.length) {
          setSelectedFields(validFields);
        }
      }
    } catch (error) {
      console.error("Unable to parse saved print fields", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("car-print-fields", JSON.stringify(selectedFields));
  }, [selectedFields]);

  const applyFilters = (nextSort?: AdminSortState) => {
    const params: Record<string, any> = {};
    const sortToUse = nextSort ?? sortState;

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (status) params.status = status;
    if (stringifySort(sortToUse)) params.sort = stringifySort(sortToUse);

    router.get(route("cars.index"), params, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatus("");
    setSortState(DEFAULT_SORT);

    router.get(route("cars.index"), {}, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const sortIsDefault = sortState.by === DEFAULT_SORT.by && sortState.dir === DEFAULT_SORT.dir;
  const hasActiveFilters = Boolean(searchTerm || status || !sortIsDefault);
  const filterBadgeCount = [searchTerm || null, status || null, !sortIsDefault ? stringifySort(sortState) : null]
    .filter(Boolean)
    .length;

  const paginationMeta = useMemo(() => adminPaginationFromLinks(cars.links), [cars.links]);
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

  const printableCars = useMemo(() => printCars || [], [printCars]);
  const selectedFieldDefinitions = useMemo(
    () => ALL_PRINT_FIELDS.filter((field) => selectedFields.includes(field.key)),
    [selectedFields],
  );

  const allFieldsSelected = selectedFields.length === ALL_PRINT_FIELDS.length;

  const toggleField = (key: string, checked: boolean) => {
    setSelectedFields((prev) => {
      if (checked) {
        return prev.includes(key) ? prev : [...prev, key];
      }

      return prev.filter((fieldKey) => fieldKey !== key);
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedFields(checked ? ALL_PRINT_FIELDS.map((field) => field.key) : []);
  };

  const handlePrintPdf = async () => {
    if (!selectedFieldDefinitions.length) {
      toast.error("Sélectionnez au moins un champ à inclure dans le PDF.");
      return;
    }

    const statusColumnIndex = selectedFieldDefinitions.findIndex((field) => field.key === "status");

    const loadImageAsDataUrl = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Impossible de charger l'image: ${response.status}`);
      }
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const doc = new jsPDF({ format: "a4", unit: "pt", orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    try {
      const backgroundUrl = new URL("/images/A5.png", window.location.origin).toString();
      const imageDataUrl = await loadImageAsDataUrl(backgroundUrl);
      doc.addImage(imageDataUrl, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    } catch (error) {
      console.error("Impossible de charger le fond A4", error);
    }

    const topMargin = 40;
    const titleY = topMargin + 90;
    const tableStartY = titleY + 30;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 40, topMargin, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Liste des voitures", 40, titleY);

    const head = [selectedFieldDefinitions.map((field) => field.label)];
    const body = printableCars.map((car) =>
      selectedFieldDefinitions.map((field) => {
        if (field.key === "status") {
          const display = getStatusDisplay(car.status);
          return display.label;
        }

        return field.accessor(car) ?? "—";
      }),
    );

    autoTable(doc, {
      startY: tableStartY,
      head,
      body,
      styles: {
        font: "helvetica",
        fontSize: 10,
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        cellPadding: 6,
        fillColor: false,
      },
      headStyles: {
        textColor: 20,
        fontStyle: "bold",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        fillColor: false,
      },
      alternateRowStyles: { fillColor: false },
      margin: { left: 40, right: 40 },
      theme: "grid",
      tableWidth: "auto",
      didParseCell: (data) => {
        if (statusColumnIndex === -1) return;
        if (data.section !== "body" || data.column.index !== statusColumnIndex) return;

        const car = printableCars[data.row.index];
        if (!car) return;

        const { color } = getStatusDisplay(car.status);
        data.cell.styles.textColor = color;
      },
    });

    const pdfBlobUrl = doc.output("bloburl");
    window.open(pdfBlobUrl, "_blank", "noopener,noreferrer");
    setShowPrintDialog(false);
  };

  const columns = useMemo<AdminTableColumn[]>(
    () => [
      { id: "brand", label: "Marque", sortable: true },
      { id: "model", label: "Modèle", sortable: true },
      { id: "plate", label: "Plaque", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "status", label: "Statut", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "benefit", label: "Bénéfice (mois)", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "expense", label: "Dépense (mois)", sortable: true, headerClassName: "whitespace-nowrap" },
      { id: "result", label: "Résultat (mois)", sortable: true, headerClassName: "whitespace-nowrap" },
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

  const renderRow = (car: Car): AdminTableRow => {
    const carModel = car.car_model || {};
    const plate = car.license_plate || car.wwlicense_plate || "—";

    return {
      key: car.id,
      onClick: () => router.get(route("cars.show", car.id)),
      cells: [
        <span className="font-medium">{carModel.brand || "—"}</span>,
        <span>{carModel.model || "—"}</span>,
        <span className="whitespace-nowrap">{plate}</span>,
        <span>
          <Badge className={statusBadge(car.status)}>{car.status || "—"}</Badge>
        </span>,
        <span className="text-emerald-700 font-semibold">{formatCurrency(car.monthly_benefit)}</span>,
        <span className="text-rose-700 font-semibold">{formatCurrency(car.monthly_expense)}</span>,
        <span className={`${Number(car.monthly_result ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"} font-semibold`}>
          {formatCurrency(car.monthly_result)}
        </span>,
      ],
    };
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Liste des voitures" />

      <div className="space-y-4">
        <div className="space-y-4 md:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm">
              <CarsIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Liste des voitures</h1>
              <AdminFilterTrigger
                badgeCount={filterBadgeCount}
                onClick={() => setShowFiltersDialog(true)}
              />
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowPrintDialog(true)}
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-2">
                <AdminSearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSearch={() => applyFilters()}
                  onReset={clearFilters}
                  resetVisible={hasActiveFilters}
                />
              </div>
            </div>
          </div>

          {(cars.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune voiture trouvée.</p>
          ) : (
            (cars.data || []).map((car) => {
              const carModel = car.car_model || {};
              const plate = car.license_plate || car.wwlicense_plate || "—";
              return (
                <AdminMobileCard
                  key={car.id}
                  onClick={() => router.get(route("cars.show", car.id))}
                  items={[
                    { label: "Marque", value: carModel.brand || "—", emphasis: true },
                    { label: "Modèle", value: carModel.model || "—" },
                    { label: "Plaque", value: plate },
                    { label: "Statut", value: <Badge className={statusBadge(car.status)}>{car.status || "—"}</Badge> },
                    { label: "Bénéfice", value: formatCurrency(car.monthly_benefit), emphasis: true },
                    { label: "Dépense", value: formatCurrency(car.monthly_expense) },
                    {
                      label: "Résultat",
                      value: (
                        <span className={`${Number(car.monthly_result ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"} font-semibold`}>
                          {formatCurrency(car.monthly_result)}
                        </span>
                      ),
                      emphasis: true,
                    },
                  ]}
                />
              );
            })
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
            title="Liste des voitures"
            icon={<CarsIcon className="h-5 w-5" />}
            actions={
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
                  <div className="flex flex-col-reverse gap-2 sm:w-full sm:flex-row sm:items-center sm:justify-between">
                    <AdminSearchInput
                      value={searchTerm}
                      onChange={setSearchTerm}
                      onSearch={() => applyFilters()}
                      onReset={clearFilters}
                      resetVisible={hasActiveFilters}
                    />

                    <AdminFilterTrigger badgeCount={filterBadgeCount} />
                  </div>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Affiner les résultats</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Statut</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {STATUS_OPTIONS.map((option) => (
                            <Button
                              key={option.value || "all"}
                              type="button"
                              variant={status === option.value ? "default" : "outline"}
                              className="justify-start"
                              onClick={() => setStatus(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Recherche rapide</h4>
                        <Input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Marque, modèle ou plaque"
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
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setShowFiltersDialog(false);
                          applyFilters();
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Appliquer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Choisir les champs à imprimer</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="flex items-center gap-3 rounded-md border p-3">
                        <Checkbox
                          id="select-all-print-fields"
                          checked={allFieldsSelected}
                          onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                        />
                        <label htmlFor="select-all-print-fields" className="text-sm font-medium leading-none">
                          Tout sélectionner
                        </label>
                      </div>

                      {PRINT_FIELD_GROUPS.map((group) => (
                        <div key={group.title} className="space-y-2">
                          <h4 className="text-sm font-semibold">{group.title}</h4>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {group.fields.map((field) => (
                              <label
                                key={field.key}
                                htmlFor={`print-field-${field.key}`}
                                className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm"
                              >
                                <Checkbox
                                  id={`print-field-${field.key}`}
                                  checked={selectedFields.includes(field.key)}
                                  onCheckedChange={(checked) => toggleField(field.key, checked === true)}
                                />
                                <span className="leading-none">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <Button className="gap-2 w-full sm:w-auto" onClick={handlePrintPdf}>
                        <Printer className="h-4 w-4" />
                        Imprimer
                      </Button>
                    </DialogFooter>

                  </DialogContent>
                </Dialog>
              </div>
            }
          >
            <AdminTable
              columns={columns}
              data={cars.data || []}
              renderRow={renderRow}
              sort={sortState}
              onSort={handleSort}
              emptyMessage="Aucune voiture trouvée."
              pagination={pagination}
            />
          </AdminResourceCard>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}