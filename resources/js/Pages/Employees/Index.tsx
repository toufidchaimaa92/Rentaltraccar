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
import { resourceIcons } from "@/constants/resource-icons";

interface PeriodLite {
  label: string;
  start: string;
  end: string;
}

interface EmployeeDto {
  id: number;
  name: string;
  employee_type: "coffee" | "location";
  pay_schedule: "monthly" | "weekly" | "daily";
  monthly_day?: number | null;
  weekly_day?: number | null;
  monthly_salary?: number | null;
  weekly_salary?: number | null;
  daily_rate?: number | null;
  is_active: boolean;
  payments_count: number;
  next_pay_date?: string | null;
  period: PeriodLite;
  target_amount?: number | null;
  paid_in_period?: number | null;
  reste_in_period?: number | null;
  prev_period: PeriodLite;
  prev_reste?: number | null;
  due_with_carry?: number | null;
  total_expected_to_date?: number | null;
  total_paid_to_date?: number | null;
}

interface Filters {
  search?: string;
  employee_type?: string;
  pay_schedule?: string;
  status?: string;
  sort?: string | AdminSortState | null;
}

interface Props {
  auth: { user: any };
  employees: { data: EmployeeDto[]; links: any[] };
  filters: Filters;
}

const DEFAULT_SORT: AdminSortState = { by: "name", dir: "asc" };

const TYPE_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "coffee", label: "Café" },
  { value: "location", label: "Location" },
];

const SCHEDULE_OPTIONS = [
  { value: "", label: "Tous les cycles" },
  { value: "monthly", label: "Mensuel" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "daily", label: "Quotidien" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
];

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

function formatCurrency(amount?: number | null) {
  const value = Number(amount ?? 0);
  return `${value.toFixed(2)} MAD`;
}

function scheduleLabel(schedule?: string | null) {
  const map: Record<string, string> = {
    monthly: "Mensuel",
    weekly: "Hebdomadaire",
    daily: "Quotidien",
  };
  return map[schedule || ""] || "—";
}

function typeLabel(type?: string | null) {
  const map: Record<string, string> = {
    coffee: "Café",
    location: "Location",
  };
  return map[type || ""] || "—";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function EmployeesIndex() {
  const { auth, employees, filters } = usePage<Props>().props;
  const EmployeesIcon = resourceIcons.adminEmployees;

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [employeeType, setEmployeeType] = useState(filters.employee_type || "");
  const [paySchedule, setPaySchedule] = useState(filters.pay_schedule || "");
  const [status, setStatus] = useState(filters.status || "");
  const [sortState, setSortState] = useState<AdminSortState>(() => parseSortParam(filters.sort));
  const [showFilters, setShowFilters] = useState(false);

  const applyFilters = (nextSort?: AdminSortState) => {
    const params: Record<string, any> = {};
    const sortToUse = nextSort ?? sortState;

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (employeeType) params.employee_type = employeeType;
    if (paySchedule) params.pay_schedule = paySchedule;
    if (status) params.status = status;
    if (stringifySort(sortToUse)) params.sort = stringifySort(sortToUse);

    router.get(route("admin.employees.index"), params, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setEmployeeType("");
    setPaySchedule("");
    setStatus("");
    setSortState(DEFAULT_SORT);

    router.get(route("admin.employees.index"), {}, {
      preserveState: false,
      preserveScroll: true,
    });
  };

  const sortIsDefault = sortState.by === DEFAULT_SORT.by && sortState.dir === DEFAULT_SORT.dir;
  const filterBadgeCount = [
    searchTerm || null,
    employeeType || null,
    paySchedule || null,
    status || null,
    !sortIsDefault ? stringifySort(sortState) : null,
  ]
    .filter(Boolean)
    .length;

  const paginationMeta = useMemo(() => adminPaginationFromLinks(employees.links), [employees.links]);
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
      { id: "type", label: "Type", sortable: true },
      { id: "schedule", label: "Cycle", sortable: true },
      { id: "next", label: "Prochain paiement" },
      { id: "due", label: "Dû cumulé" },
      { id: "reste", label: "Reste période" },
      { id: "payments", label: "Paiements", sortable: true },
      { id: "status", label: "Statut", sortable: true },
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

  const renderRow = (employee: EmployeeDto): AdminTableRow => {
    const due = Number(employee.due_with_carry ?? 0);
    const reste = Number(employee.reste_in_period ?? 0);

    return {
      key: employee.id,
      onClick: () => router.get(route("admin.employees.edit", employee.id)),
      cells: [
        <span className="font-medium">{employee.name}</span>,
        <span>{typeLabel(employee.employee_type)}</span>,
        <span>{scheduleLabel(employee.pay_schedule)}</span>,
        <span className="whitespace-nowrap">{formatDate(employee.next_pay_date)}</span>,
        <span className={due > 0 ? "text-rose-700 font-semibold" : "text-muted-foreground"}>
          {formatCurrency(employee.due_with_carry)}
        </span>,
        <span className={reste > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>
          {formatCurrency(employee.reste_in_period)}
        </span>,
        <span>{employee.payments_count}</span>,
        <span>
          <Badge variant={employee.is_active ? "default" : "secondary"}>
            {employee.is_active ? "Actif" : "Inactif"}
          </Badge>
        </span>,
      ],
    };
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Employés" />

      <div className="space-y-4">
        <div className="space-y-4 md:hidden">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm">
              <EmployeesIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-tight">Employés</h1>
              <AdminFilterTrigger
                badgeCount={filterBadgeCount}
                onClick={() => setShowFilters(true)}
              />
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <Link href={route("admin.employees.create")}>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvel employé
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
                />
              </div>
            </div>
          </div>

          {(employees.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun employé trouvé.</p>
          ) : (
            (employees.data || []).map((employee) => {
              const due = Number(employee.due_with_carry ?? 0);
              const reste = Number(employee.reste_in_period ?? 0);
              return (
                <AdminMobileCard
                  key={employee.id}
                  onClick={() => router.get(route("admin.employees.edit", employee.id))}
                  items={[
                    { label: "Employé", value: employee.name, emphasis: true },
                    { label: "Type", value: typeLabel(employee.employee_type) },
                    { label: "Paiement", value: scheduleLabel(employee.pay_schedule) },
                    { label: "Prochaine paie", value: formatDate(employee.next_pay_date) },
                    {
                      label: "Dû",
                      value: (
                        <span className={due > 0 ? "text-rose-700 font-semibold" : "text-muted-foreground"}>
                          {formatCurrency(employee.due_with_carry)}
                        </span>
                      ),
                      emphasis: true,
                    },
                    {
                      label: "Reste",
                      value: (
                        <span className={reste > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground"}>
                          {formatCurrency(employee.reste_in_period)}
                        </span>
                      ),
                      emphasis: true,
                    },
                    { label: "Paiements", value: employee.payments_count },
                    {
                      label: "Statut",
                      value: (
                        <Badge variant={employee.is_active ? "default" : "secondary"}>
                          {employee.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      ),
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
              onClick={() => pagination.onPaginate({ preventDefault() {} } as React.MouseEvent<HTMLAnchorElement>, pagination.next)}
            >
              Charger plus
            </Button>
          )}
        </div>

        <div className="hidden md:block">
          <AdminResourceCard
            title="Employés"
            icon={<EmployeesIcon className="h-5 w-5" />}
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
                    />

                    <AdminFilterTrigger badgeCount={filterBadgeCount} />
                  </div>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Affiner les résultats</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Type</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {TYPE_OPTIONS.map((option) => (
                            <Button
                              key={option.value || "all-types"}
                              type="button"
                              variant={employeeType === option.value ? "default" : "outline"}
                              className="justify-start"
                              onClick={() => setEmployeeType(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Cycle de paie</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {SCHEDULE_OPTIONS.map((option) => (
                            <Button
                              key={option.value || "all-schedules"}
                              type="button"
                              variant={paySchedule === option.value ? "default" : "outline"}
                              className="justify-start"
                              onClick={() => setPaySchedule(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Statut</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {STATUS_OPTIONS.map((option) => (
                            <Button
                              key={option.value || "all-status"}
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
                          placeholder="Nom ou type d'employé"
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
                        className="
                          w-full sm:w-auto
                          justify-center
                          text-destructive
                          hover:bg-destructive/10
                          hover:text-destructive
                        "
                        onClick={clearFilters}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Réinitialiser
                      </Button>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setShowFilters(false);
                          applyFilters();
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Appliquer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Link href={route("admin.employees.create")}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvel employé
                  </Button>
                </Link>
              </div>
            }
          >
            <AdminTable
              columns={columns}
              data={employees.data || []}
              renderRow={renderRow}
              sort={sortState}
              onSort={handleSort}
              emptyMessage="Aucun employé trouvé."
              pagination={pagination}
            />
          </AdminResourceCard>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}