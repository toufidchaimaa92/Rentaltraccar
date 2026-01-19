import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Car, Calendar, AlertTriangle, Clock, Check, Play, CheckCircle, XCircle, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AdminResourceCard,
  AdminSortState,
  AdminTable,
  AdminTableColumn,
  AdminTableRow,
} from '@/components/admin/admin-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { resourceIcons } from '@/constants/resource-icons';
import CompletionDialogs from '@/components/rentals/CompletionDialogs';
import useRentalCompletionFlow from '@/hooks/useRentalCompletionFlow';
import RentalStatusBadge from '@/components/rentals/RentalStatusBadge';

interface CarModel {
  brand?: string;
  model?: string;
}

interface CarInfo {
  id: number;
  license_plate?: string;
}

interface ClientInfo {
  id?: number | string;
  name: string;
  phone?: string;
}

interface Rental {
  id: number;
  start_date: string;
  end_date: string;
  return_time: string;
  status: string;
  client?: ClientInfo;
  client_id?: number | string | null;
  car?: CarInfo;
  carModel?: CarModel;
  paid_amount?: number;
  total_amount?: number;
  reste_a_payer?: number;
  has_payment_due?: boolean;
  payment_status?: string | null;
}

interface AvailableCar {
  id: number;
  make: string;
  model: string;
  license_plate: string;
}

interface DashboardProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      is_admin?: boolean;
      role?: string;
    };
  };
  carsAvailable: number;
  bookingsStartToday: number;
  bookingsEndToday: number;
  pendingConfirmedCount: number;
  activeOverdueCount: number;
  activeOverdueRentals: Rental[];
  availableCars: AvailableCar[];
}

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
};

const formatMAD = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(value ?? 0));

const formatMADNoDecimals = (value: number | string | null | undefined) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
    .format(Number(value ?? 0));

const formatRemaining = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return '-';
  return formatMADNoDecimals(numeric);
};

function pluralize(count: number, singular: string, plural?: string) {
  if (count === 1) return singular;
  return plural || singular + 's';
}

const statusOptions = [
  { value: 'completed', label: 'Completed', color: 'text-emerald-600', Icon: CheckCircle },
];

const statusOptionsForContext = (isReturn: boolean) =>
  isReturn
    ? statusOptions.filter((option) => ['completed'].includes(option.value))
    : statusOptions;

const resolveStatusForContext = (status: string, isReturn: boolean) => {
  const allowedValues = new Set(statusOptionsForContext(isReturn).map((option) => option.value));
  return allowedValues.has(status) ? status : 'completed';
};


const ActionRow = ({
  icon: Icon,
  label,
  color,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center justify-between rounded border px-3 py-2 transition
      ${active ? 'border-border bg-muted' : 'border-transparent hover:border-border'}
      bg-card text-card-foreground`}
  >
    <div className="flex items-center gap-2">
      <Icon className={`h-5 w-5 ${color}`} />
      <span className={`font-semibold ${color}`}>{label}</span>
    </div>

    {active && (
      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Actuel
      </span>
    )}
  </button>
);


// --- helpers for mobile cards ---
const toJJMM = (iso: string) => {
  // "YYYY-MM-DD" -> "dd/mm"
  const [y, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const daysDiff = (fromISO: string, toISO?: string) => {
  const a = new Date(fromISO);
  const b = toISO ? new Date(toISO) : new Date();
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

const defaultSort: AdminSortState = { by: 'end_date', dir: 'desc' };

const isReturnRental = (rental: Rental) => rental.status?.toLowerCase() === 'active';

interface StatCardProps {
  title?: string;
  label?: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconAccent?: string;
  accent?: string;
  className?: string;
  glowColor?: string;
}

function StatCard({
  title,
  label,
  value,
  description,
  icon: Icon,
  iconAccent = 'bg-primary/10 text-primary',
  className,
  accent,
  glowColor,
}: StatCardProps) {
  const heading = title ?? label ?? '';
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border border-border/60 bg-background/80 p-5 backdrop-blur transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/10',
        accent,
        className
      )}
    >
      {glowColor ? (
        <motion.div
          className="absolute -top-16 -left-16 h-56 w-56 rounded-full blur-3xl opacity-50"
          style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
          animate={{ x: [0, 15, -10, 0], y: [0, -10, 10, 0] }}
          transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
        />
      ) : null}

      <div className="absolute inset-x-6 top-1 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{heading}</p>
          <h3 className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-foreground">{value}</h3>
        </div>

        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconAccent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {description && <div className="text-xs text-muted-foreground">{description}</div>}
    </Card>
  );
}

const tableColumns: AdminTableColumn[] = [
  { id: 'car', label: 'Voiture', sortable: true },
  { id: 'client', label: 'Client', sortable: true },
  { id: 'phone', label: 'Téléphone', sortable: true },
  { id: 'end_date', label: 'Date de fin', sortable: true },
  { id: 'return_time', label: 'Heure', sortable: true },
  { id: 'remaining', label: 'Reste à payer', sortable: true },
  { id: 'status', label: 'Statut', sortable: true, headerClassName: 'w-32' },
  { id: 'actions', label: 'Action' },
];

const sortRentals = (list: Rental[], sort: AdminSortState = defaultSort) => {
  const dir = sort.dir === 'asc' ? 1 : -1;

  return [...list].sort((a, b) => {
    const compare = (valA: string | number, valB: string | number) => {
      if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
      return String(valA ?? '').localeCompare(String(valB ?? ''));
    };

    switch (sort.by) {
      case 'car':
        return (
          compare(
            `${a.carModel?.model ?? ''} ${a.car?.license_plate ?? ''}`.trim(),
            `${b.carModel?.model ?? ''} ${b.car?.license_plate ?? ''}`.trim()
          ) * dir
        );
      case 'client':
        return compare(a.client?.name ?? '', b.client?.name ?? '') * dir;
      case 'phone':
        return compare(a.client?.phone ?? '', b.client?.phone ?? '') * dir;
      case 'return_time':
        return compare(a.return_time ?? '', b.return_time ?? '') * dir;
      case 'remaining':
        return compare(a.reste_a_payer ?? 0, b.reste_a_payer ?? 0) * dir;
      case 'status':
        return compare(a.status ?? '', b.status ?? '') * dir;
      case 'end_date':
      default:
        return (
          compare(new Date(a.end_date).getTime(), new Date(b.end_date).getTime()) * dir ||
          compare(a.id, b.id)
        );
    }
  });
};

export default function Dashboard({
  auth,
  carsAvailable,
  bookingsStartToday,
  bookingsEndToday,
  pendingConfirmedCount,
  activeOverdueCount,
  activeOverdueRentals,
  availableCars = [],
}: DashboardProps) {
  const RentalsIcon = resourceIcons.rentals;
  // Use local date to avoid timezone shifting the day
  const today = new Date().toLocaleDateString('fr-CA'); // YYYY-MM-DD

  const [sortState, setSortState] = useState<AdminSortState>(defaultSort);
  const [rentals, setRentals] = useState<Rental[]>(sortRentals(activeOverdueRentals, defaultSort));
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReturnContext, setIsReturnContext] = useState(false);
  const isAdmin = Boolean(auth?.user?.is_admin || auth?.user?.role === 'admin');

  const statCards: Array<
    StatCardProps & {
      key: string;
      onClick?: () => void;
    }
  > = [
      {
        key: 'cars',
        title: 'Flotte disponible',
        value: `${carsAvailable} ${pluralize(carsAvailable, 'voiture')}`,
        description: `${availableCars.length} véhicules prêts à partir`,
        icon: Car,
        iconAccent: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/25 dark:text-blue-100',
        accent: 'bg-gradient-to-br from-blue-500/5 via-transparent to-transparent',
      },
      {
        key: 'departures',
        title: 'Départs aujourd’hui',
        value: `${bookingsStartToday} ${pluralize(bookingsStartToday, 'location')}`,
        description: 'Voir les départs dans le calendrier',
        icon: Calendar,
        iconAccent: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-100',
        accent: 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent',
        onClick: () => router.visit(`/calendar?view=day&date=${today}`),
      },
      {
        key: 'returns',
        title: 'Retours aujourd’hui',
        value: `${bookingsEndToday} ${pluralize(bookingsEndToday, 'location')}`,
        description: 'Préparer les check-out du jour',
        icon: Calendar,
        iconAccent: 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-100',
        accent: 'bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent',
        onClick: () => router.visit(`/calendar?view=day&date=${today}`),
      },
      {
        key: 'pending',
        title: 'Locations à activer',
        value: `${pendingConfirmedCount} ${pluralize(pendingConfirmedCount, 'location')}`,
        description:
          pendingConfirmedCount > 0 ? 'Statuts Pending / Confirmed à traiter' : 'Aucune action en attente',
        icon: AlertTriangle,
        iconAccent:
          pendingConfirmedCount > 0
            ? 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/25 dark:text-amber-100'
            : 'bg-muted text-muted-foreground',
        accent:
          pendingConfirmedCount > 0
            ? 'bg-gradient-to-br from-amber-500/10 via-transparent to-transparent'
            : 'bg-gradient-to-br from-muted/60 via-transparent to-transparent',
        glowColor: pendingConfirmedCount > 0 ? 'rgba(245, 158, 11, 0.45)' : undefined,
      },
      {
        key: 'overdue',
        title: 'Voitures non reprises',
        value: `${activeOverdueCount} ${pluralize(activeOverdueCount, 'location')}`,
        description:
          activeOverdueCount > 0 ? 'Date de fin dépassée (Active)' : 'Tout est à jour',
        icon: AlertTriangle,
        iconAccent:
          activeOverdueCount > 0
            ? 'bg-rose-500/15 text-rose-800 dark:bg-rose-500/25 dark:text-rose-100'
            : 'bg-muted text-muted-foreground',
        accent:
          activeOverdueCount > 0
            ? 'bg-gradient-to-br from-rose-500/15 via-transparent to-transparent'
            : 'bg-gradient-to-br from-muted/60 via-transparent to-transparent',
        glowColor: activeOverdueCount > 0 ? 'rgba(244, 63, 94, 0.45)' : undefined,
      },
    ];

  const exportOverduePDF = () => {
    if (!rentals.length) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
    const marginLeft = 36;
    const marginTop = 36;
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = 'Voitures non reprises à temps';
    const todayLabel = new Date().toLocaleString('fr-FR');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, marginLeft, marginTop);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Imprimé le ${todayLabel}`, pageWidth - marginLeft, marginTop, { align: 'right' });


    const formatMADPdf = (value: number | string | null | undefined) => {
      const n = Math.round(Number(value ?? 0));
      return Number.isFinite(n) ? String(n) : '0';
    };
    
      
    const body = rentals.map((r) => [
      `${r.carModel?.model ?? 'Modèle inconnu'}${r.car?.license_plate ? ` - ${r.car.license_plate}` : ''}`,
      r.client?.name ?? 'Inconnu',
      r.client?.phone ?? '—',
      new Date(r.end_date).toLocaleDateString('fr-FR', dateOptions),
      r.return_time?.slice(0, 5) ?? '—',
      formatMADPdf(r.reste_a_payer ?? 0),
      r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—',
    ]);

    (autoTable as any)(doc, {
      head: [['Voiture', 'Client', 'Téléphone', 'Date de fin', 'Heure', 'Reste à payer', 'Statut']],
      body,
      startY: marginTop + 12,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [239, 68, 68] },
      didParseCell: (data: any) => {
        if (data.section !== 'body') return;
        if (data.column.index !== 5) return;
        const rental = rentals[data.row.index];
        if ((rental?.reste_a_payer ?? 0) > 0) {
          data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });

    const url = doc.output('bloburl');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openDialog = (rental: Rental) => {
    const isReturn = isReturnRental(rental);
    setSelectedRental(rental);
    setShowStatusDialog(true);
    setIsReturnContext(isReturn);
    setSelectedStatus(resolveStatusForContext(rental.status, isReturn));
    setSelectedCarId(rental.car?.id ?? null);
    setErrorMessage(null);
  };

  const closeDialog = (clearSelection = true) => {
    setShowStatusDialog(false);
    if (clearSelection) {
      setSelectedRental(null);
    }
    setSelectedStatus('');
    setSelectedCarId(null);
    setErrorMessage(null);
    setIsUpdating(false);
    setIsReturnContext(false);
  };

  const patchRentalStatus = async ({
    rental,
    status,
    carId,
    extraPayload = {},
    closeDialogOnSuccess = false,
  }: {
    rental: Rental;
    status: string;
    carId?: number | null;
    extraPayload?: Record<string, unknown>;
    closeDialogOnSuccess?: boolean;
  }) => {
    setErrorMessage(null);

    if (status === 'active' && !carId) {
      setErrorMessage('Veuillez sélectionner une voiture pour activer la location.');
      return;
    }

    setIsUpdating(true);

    const payload: { status: string; car_id?: number } & Record<string, unknown> = {
      status,
      ...extraPayload,
    };
    if (status === 'active' && carId) {
      payload.car_id = carId;
    }

    const prevRentals = rentals;

    const optimisticRental: Rental = (() => {
      let nextCar: CarInfo | undefined = rental.car;

      if (status === 'active' && carId) {
        const picked = availableCars.find((c) => c.id === carId);
        nextCar = {
          id: carId,
          license_plate: picked?.license_plate ?? rental.car?.license_plate,
        };
      }

      return {
        ...rental,
        status,
        car: nextCar,
      };
    })();

    setRentals((prev) => {
      const next = prev.map((r) => (r.id === optimisticRental.id ? optimisticRental : r));
      const filtered = status === 'completed' ? next.filter((r) => r.status !== 'completed') : next;
      return sortRentals(filtered, sortState);
    });
    if (status === 'completed') {
      setSelectedRental(null);
    }

    const url = `/rentals/${rental.id}/status`;

    router.patch(
      url,
      payload,
      {
        preserveScroll: true,
        onError: (errors: any) => {
          setRentals(prevRentals);
          const first =
            errors?.message ||
            errors?.status ||
            (typeof errors === 'string' ? errors : null);
          setErrorMessage(first || 'Erreur lors de la mise à jour du statut.');
          setIsUpdating(false);
        },
        onSuccess: () => {
          setIsUpdating(false);
          if (closeDialogOnSuccess) {
            closeDialog();
          }
        },
        onFinish: () => {
          setIsUpdating(false);
        },
      }
    );
  };

  const updateRentalStatus = async () => {
    if (!selectedRental) return;

    const finalStatus = isReturnContext ? 'completed' : selectedStatus;

    if (finalStatus === 'completed') {
      closeDialog(false);
      openCompletionFlow(selectedRental);
      return;
    }

    patchRentalStatus({
      rental: selectedRental,
      status: finalStatus,
      carId: finalStatus === 'active' ? selectedCarId : null,
      closeDialogOnSuccess: true,
    });
  };

  // --- end updated block ---
  const {
    showPaymentDialog,
    setShowPaymentDialog,
    showRatingDialog,
    setShowRatingDialog,
    customPaymentAmount,
    setCustomPaymentAmount,
    paymentError,
    paymentProcessing,
    ratingValue,
    setRatingValue,
    clientNote,
    setClientNote,
    paymentSummary,
    openCompletionFlow,
    submitPayment,
    finalizeRental,
  } = useRentalCompletionFlow<Rental>({
    selectedItem: selectedRental,
    setSelectedItem: setSelectedRental,
    setItems: setRentals,
    onFinalizeStatus: (rental, payload) =>
      patchRentalStatus({
        rental,
        status: 'completed',
        extraPayload: payload,
        closeDialogOnSuccess: true,
      }),
  });

  return (
    <AuthenticatedLayout user={auth.user}>
      <div>
        <div>
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
          </header>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-3">
            {statCards.map((card) => {
              const Wrapper: any = card.onClick ? 'button' : 'div';

              return (
                <Wrapper
                  key={card.key}
                  type={card.onClick ? 'button' : undefined}
                  onClick={card.onClick}
                  className={cn(
                    'text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60',
                    card.onClick ? 'hover:-translate-y-0.5 transition' : ''
                  )}
                >
                  <StatCard {...card} />
                </Wrapper>
              );
            })}
          </div>

          {/* Active Overdue Rentals - MOBILE CARDS */}
          <section className="md:hidden space-y-3">
            <h2 className="text-lg font-semibold text-red-700 mb-2">⚠️ En retard</h2>

            {rentals.length === 0 ? (
              <p className="text-muted-foreground">Aucune location en retard.</p>
            ) : (
              rentals.map((r) => {
                const overdueDays = Math.max(0, daysDiff(r.end_date));
                const dateFR = new Date(r.end_date).toLocaleDateString('fr-FR', dateOptions);
                const timeFR = r.return_time?.slice(0, 5) ?? '—';

                return (
                  <Card key={r.id} className="rounded-lg border border-border bg-card text-card-foreground shadow">
                    <CardContent className="p-4">
                      {/* Top row */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">
                            {r.carModel?.model || 'Modèle inconnu'}
                            {r.car?.license_plate && (
                              <span className="ml-1 text-muted-foreground">• {r.car.license_plate}</span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {r.client?.name || 'Client inconnu'}
                            {r.client?.phone ? ` • ${r.client.phone}` : ''}
                          </p>
                        </div>

                        <Button variant="ghost" className="p-0 h-auto" onClick={() => openDialog(r)}>
                          <RentalStatusBadge status={r.status} />
                        </Button>
                      </div>

                      {/* Dates */}
                      <div className="mt-3 text-sm flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 bg-red-50 text-red-700 ring-red-200">
                          Fin: {dateFR} {timeFR}
                        </span>
                        {overdueDays > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 bg-amber-50 text-amber-700 ring-amber-200">
                            {overdueDays} {pluralize(overdueDays, 'jour')} de retard
                          </span>
                        )}
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1',
                            (r.reste_a_payer ?? 0) > 0
                              ? 'bg-red-50 text-red-700 ring-red-200'
                              : 'bg-slate-50 text-slate-700 ring-slate-200'
                          )}
                        >
                          Reste: {formatRemaining(r.reste_a_payer ?? 0)} MAD
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex justify-end gap-2">
                        <a
                          href={`/rentals/${r.id}`}
                          className="inline-block px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
                        >
                          Voir
                        </a>
                        <Button variant="outline" size="sm" onClick={() => openDialog(r)}>
                          Modifier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </section>

          {/* Active Overdue Rentals - DESKTOP TABLE */}
          <AdminResourceCard
            className="hidden md:block border-border bg-card text-card-foreground shadow"
            title="Voitures non reprises à temps"
            icon={<RentalsIcon className="h-5 w-5" />}
            actions={
              <Button variant="outline" className="inline-flex items-center gap-2" onClick={exportOverduePDF}>
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            }
            contentClassName="space-y-4"
          >
            {rentals.length === 0 ? (
              <p className="text-muted-foreground">Aucune location en retard.</p>
            ) : (
              <>
                {errorMessage && <p className="text-red-600 font-semibold">{errorMessage}</p>}
                <AdminTable
                  columns={tableColumns}
                  data={rentals}
                  sort={sortState}
                  onSort={(col) => {
                    setSortState((prev) => {
                      const nextSort: AdminSortState = {
                        by: col,
                        dir: prev?.by === col && prev?.dir === 'asc' ? 'desc' : 'asc',
                      };

                      setRentals((prevRentals) => sortRentals(prevRentals, nextSort));
                      return nextSort;
                    });
                  }}
                  renderRow={(rental): AdminTableRow => ({
                    key: rental.id,
                    cells: [
                      (
                        <>
                          {rental.carModel?.model || 'Modèle inconnu'}
                          {rental.car?.license_plate && (
                            <span className="font-semibold ml-1"> - {rental.car.license_plate}</span>
                          )}
                        </>
                      ),
                      rental.client?.name || 'Inconnu',
                      rental.client?.phone || '—',
                      new Date(rental.end_date).toLocaleDateString('fr-FR', dateOptions),
                      rental.return_time.slice(0, 5),
                      (
                        <span className={(rental.reste_a_payer ?? 0) > 0 ? 'text-red-600 font-semibold' : ''}>
                          {formatRemaining(rental.reste_a_payer ?? 0)}
                        </span>
                      ),
                      (
                        <Button variant="ghost" onClick={() => openDialog(rental)} className="p-0">
                          <RentalStatusBadge status={rental.status} />
                        </Button>
                      ),
                      (
                        <div className="space-x-2">
                          <a
                            href={`/rentals/${rental.id}`}
                            className="inline-block px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
                          >
                            Voir
                          </a>
                        </div>
                      ),
                    ],
                  })}
                />
              </>
            )}
          </AdminResourceCard>

          {/* Dialog for status update */}
          <Dialog open={showStatusDialog} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Modifier le statut de la location</DialogTitle>
              </DialogHeader>

              <div className="my-4 space-y-4">
                {/* ===== RETURN CONTEXT ===== */}
                {isReturnContext && selectedRental ? (
                  <div className="flex flex-col gap-2">
                    {/* TERMINER */}
                    <ActionRow
                      icon={CheckCircle}
                      label="Terminée"
                      color="text-emerald-600"
                      active
                      onClick={() => setSelectedStatus('completed')}
                    />

                    {/* PROLONGER */}
                    <ActionRow
                      icon={Clock}
                      label="Prolonger la location"
                      color="text-blue-600"
                      onClick={() => router.visit(`/rentals/${selectedRental.id}/extend`)}
                    />

                    {/* CHANGE CAR */}
                    <ActionRow
                      icon={Car}
                      label="Changer de voiture"
                      color="text-amber-600"
                      onClick={() => router.visit(`/rentals/${selectedRental.id}/change-car`)}
                    />
                  </div>
                ) : (
                  /* ===== NORMAL CONTEXT ===== */
                  <div className="flex flex-col gap-2">
                    {statusOptions.map(({ value, label, color, Icon }) => (
                      <ActionRow
                        key={value}
                        icon={Icon}
                        label={label}
                        color={color}
                        active={selectedStatus === value}
                        onClick={() => setSelectedStatus(value)}
                      />
                    ))}
                  </div>
                )}

                {errorMessage && (
                  <p className="text-red-600 font-semibold mt-2">{errorMessage}</p>
                )}
              </div>

              <DialogFooter>
                <Button onClick={updateRentalStatus} disabled={isUpdating}>
                  {isUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <CompletionDialogs
            showPaymentDialog={showPaymentDialog}
            setShowPaymentDialog={setShowPaymentDialog}
            paymentSummary={paymentSummary}
            customPaymentAmount={customPaymentAmount}
            setCustomPaymentAmount={setCustomPaymentAmount}
            paymentProcessing={paymentProcessing}
            paymentError={paymentError}
            onSubmitPayment={submitPayment}
            isAdmin={isAdmin}
            showRatingDialog={showRatingDialog}
            setShowRatingDialog={setShowRatingDialog}
            ratingValue={ratingValue}
            setRatingValue={setRatingValue}
            clientNote={clientNote}
            setClientNote={setClientNote}
            onFinalize={finalizeRental}
            isUpdating={isUpdating}
            formatCurrency={formatMAD}
          />

        </div>
      </div>
    </AuthenticatedLayout>
  );
}