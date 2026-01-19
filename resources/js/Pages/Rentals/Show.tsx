import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Link, useForm, router } from '@inertiajs/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import ReservationInfoCard from '@/components/rentals/ReservationInfoCard';
import {
  ReservationSummaryCard,
  ReservationSummaryItem,
} from '@/components/rentals/ReservationSummaryCard';
import { ButtonGroup } from "@/components/ui/button-group"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

import { buildPricingSummaryItems } from '@/components/rentals/reservationSummaryUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import RentalStatusBadge from '@/components/rentals/RentalStatusBadge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CalendarDays,
  Car,
  AlertTriangle,
  CreditCard,
  Eye,
  Users,
  Clock,
  FileText,
  ChevronLeft,
  Pencil,
  Repeat,
  Plus,
  ChevronDownIcon,
  Trash2,
  Check,
  Play,
  CheckCircle,
  MapPin,
  XCircle,
} from 'lucide-react';

// ---- Types
interface CarModel {
  id?: number;
  brand?: string;
  model?: string;
  finish?: string;
  fuel_type?: string;
  transmission?: string;
  photos?: { photo_path: string }[];
}

interface Car {
  id?: number;
  license_plate?: string;
  car_model_id?: number;
  car_model?: CarModel;
}

interface Client {
  id?: number;
  name?: string;
  phone?: string;
  address?: string;
  identity_card_number?: string;
  license_number?: string;
  license_date?: string;
  license_expiration_date?: string;
}

interface Payment {
  id?: number;
  amount?: number | string;
  // Extra fields for the log (optional on older data)
  method?: 'cash' | 'virement' | 'cheque' | string;
  date?: string; // ISO or date string
  reference?: string | null;
  user_name?: string;
}

interface LongTermInvoice {
  id?: number;
  amount_due?: number | string;
  due_date?: string;
  status?: 'paid' | 'unpaid' | 'overdue';
  paid_at?: string | null;
  is_prorated?: boolean;
  description?: string | null;
}

interface Extension {
  id?: number;
  old_end_date: string;
  new_end_date: string;
  old_total: number | string;
  new_total: number | string;
  user?: { name?: string };
  created_at: string;
}

interface CarChange {
  old_car?: { license_plate?: string };
  new_car?: { license_plate?: string };
  old_total: number | string;
  new_total: number | string;
  user?: { name?: string };
  created_at: string;
}

interface Rental {
  id: number;
  client: Client;
  secondDriver?: Client;
  carModel: CarModel;
  car: Car;
  price_per_day: number | string;
  initial_price_per_day?: number | string;
  monthly_price?: number | string | null;
  deposit?: number | string | null;
  payment_cycle_days?: number | null;
  pro_rata_first_month?: boolean;
  last_payment_date?: string | null;
  next_payment_due_date?: string | null;
  total_price: number | string;
  global_discount?: number | string;
  manual_total?: any;
  manual_mode?: boolean;
  days: number;
  start_date: string;
  end_date: string | null;
  pickup_time?: string;
  return_time?: string;
  status?: string;
  payments?: Payment[];
  extensions?: Extension[];
  car_changes?: CarChange[];
  invoices?: LongTermInvoice[];
  overdue_status?: 'on_time' | 'due_soon' | 'overdue' | null;
}

interface RentalGpsPosition {
  rental_id: number;
  car_id: number;
  license_plate: string;
  latitude: number;
  longitude: number;
  speed: number;
  updated_at: string | null;
}

interface RentalAlert {
  rental_id: number;
  car_id: number;
  license_plate: string;
  type: string;
  message: string;
  event_time: string | null;
}

interface RentalTripHistory {
  rental_id: number;
  car_id: number;
  license_plate: string;
  from: string | null;
  to: string | null;
  positions: {
    latitude: number;
    longitude: number;
    speed: number;
    time: string | null;
  }[];
}

interface Props {
  auth: { user: any };
  rental: Rental;
  availableCars?: Car[];
}

// ---- Utils
function getStatusColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'active':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'completed':
      return 'bg-gray-100 text-foreground border-gray-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-foreground border-gray-300';
  }
}

function formatCurrency(value: number | string | undefined | null, fallback = '0.00'): string {
  if (value === undefined || value === null) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? fallback : num.toFixed(2);
}

// ===== NEW: status options (same set as Dashboard) =====
const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'text-orange-600', Icon: Clock },
  { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600', Icon: Check },
  { value: 'active', label: 'Active', color: 'text-green-600', Icon: Play },
  { value: 'completed', label: 'Completed', color: 'text-emerald-600', Icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600', Icon: XCircle },
];

const alertMeta: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  deviceOverspeed: { label: 'Excès de vitesse', icon: AlertTriangle, color: 'text-orange-600' },
  geofenceEnter: { label: 'Entrée zone', icon: MapPin, color: 'text-green-600' },
  geofenceExit: { label: 'Sortie zone', icon: MapPin, color: 'text-red-600' },
};

export default function ShowRental({ auth, rental, availableCars = [] }: Props) {
  if (!rental) {
    return (
      <AuthenticatedLayout user={auth.user}>
        <div className="p-6 text-center">Chargement...</div>
      </AuthenticatedLayout>
    );
  }

  const isAdmin = Boolean(auth?.user?.is_admin || auth?.user?.role === 'admin');
  const { client, secondDriver, carModel, car } = rental;
  const isLongTerm = rental.rental_type === 'long_term';
  const conductor = isLongTerm ? secondDriver || client : secondDriver;

  const pricePerDayNum = Number(rental.price_per_day || 0);
  const isActiveRental = rental.status?.toLowerCase() === 'active';

  const totalPaid = useMemo(
    () => rental.payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) ?? 0,
    [rental.payments]
  );
  const totalPriceNum = Number(rental.total_price || 0);
  const remainingToPayNum = Math.max(totalPriceNum - totalPaid, 0);
  const remainingToPay = formatCurrency(remainingToPayNum);

  const [lldPaymentDialogOpen, setLldPaymentDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const lldPaymentForm = useForm({ amount: '', method: 'cash', reference: '', invoice_id: '' as string | number | '' });
  const endForm = useForm({ end_date: rental.end_date || rental.start_date });
  const overdueStatus = rental.overdue_status || 'on_time';
  const paymentCycleLabel = rental.payment_cycle_days
    ? `${rental.payment_cycle_days} jours`
    : 'Mensuel';

  const [gpsPosition, setGpsPosition] = useState<RentalGpsPosition | null>(null);
  const [gpsLoading, setGpsLoading] = useState(isActiveRental);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<RentalAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(isActiveRental);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const fetchGpsPosition = useCallback(async () => {
    if (!isActiveRental) {
      return;
    }

    setGpsError(null);
    try {
      const response = await fetch(`/api/traccar/rentals/${rental.id}/position`);

      if (response.status === 403) {
        setGpsPosition(null);
        setGpsError('GPS disponible uniquement pour les locations actives.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load position');
      }

      const data = (await response.json()) as RentalGpsPosition | null;
      setGpsPosition(data);
    } catch (error) {
      setGpsError('Impossible de charger la localisation GPS.');
    } finally {
      setGpsLoading(false);
    }
  }, [isActiveRental, rental.id]);

  useEffect(() => {
    if (!isActiveRental) {
      return;
    }

    fetchGpsPosition();
    const intervalId = window.setInterval(fetchGpsPosition, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchGpsPosition, isActiveRental]);

  const fetchAlerts = useCallback(async () => {
    if (!isActiveRental) {
      return;
    }

    setAlertsError(null);
    try {
      const response = await fetch(`/api/traccar/alerts?rental_id=${rental.id}&limit=5`);

      if (!response.ok) {
        throw new Error('Failed to load alerts');
      }

      const data = (await response.json()) as RentalAlert[];
      setAlerts(data);
    } catch (error) {
      setAlertsError('Impossible de charger les alertes GPS.');
    } finally {
      setAlertsLoading(false);
    }
  }, [isActiveRental, rental.id]);

  useEffect(() => {
    if (!isActiveRental) {
      return;
    }

    fetchAlerts();
    const intervalId = window.setInterval(fetchAlerts, 30000);

    return () => window.clearInterval(intervalId);
  }, [fetchAlerts, isActiveRental]);

  // ---- Delete dialog state + form
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const deleteForm = useForm({});
  const handleDelete = () => {
    deleteForm.delete(route('rentals.destroy', rental.id), {
      onSuccess: () => setConfirmDeleteOpen(false),
    });
  };

  const submitPayment = () => {
    lldPaymentForm.post(route('rentals.longTerm.recordPayment', rental.id), {
      onSuccess: () => {
        setLldPaymentDialogOpen(false);
        lldPaymentForm.reset();
      },
    });
  };

  const submitEndRental = () => {
    endForm.post(route('rentals.longTerm.end', rental.id), {
      preserveScroll: true,
      onSuccess: () => setEndDialogOpen(false),
    });
  };

  // last extension index for “edit last” feature (kept if you later re-add)
  const lastExtensionIndex = rental.extensions ? rental.extensions.length - 1 : -1;

  // ---- Manual mode + estimated per day (no decimals)
  const manual = Boolean(rental.manual_mode) || (rental.manual_total !== null && rental.manual_total !== undefined);
  const days = Number(rental.days || 0);
  const manualTotalNum = Number(rental.total_price || 0);
  const estimatedPerDayManual = days > 0 ? Math.floor(manualTotalNum / days) : 0; // sans virgule

  const baseSummaryItems: ReservationSummaryItem[] = [
    { label: 'Durée', value: `${rental.days} jour(s)` },
  ];

  const pricingItems = buildPricingSummaryItems({
    manual,
    days,
    currency: 'MAD',
    initialPricePerDay: Number(rental.initial_price_per_day),
    effectivePricePerDay: pricePerDayNum,
    subtotal: pricePerDayNum * days,
    globalDiscount: Number(rental.global_discount || 0),
    totalAmount: totalPriceNum,
    estimatedPerDay: manual ? estimatedPerDayManual : null,
    classNames: {
      perDay: 'font-medium text-blue-600',
      discount: 'font-medium text-red-600',
      total: 'font-bold text-lg text-green-700',
    },
    valueFormatter: (value) => `${formatCurrency(value)} MAD`,
  });

  const summaryItems: ReservationSummaryItem[] = [...baseSummaryItems, ...pricingItems];

  // =========================
  // NEW: Add Payment Dialog + Payment Log (like Manage page)
  // =========================
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    rental_id: rental.id,
    client_id: client?.id,
    amount: '',
    method: 'cash',
    reference: '',
  });
  const [amountError, setAmountError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentForm((f) => ({ ...f, [name]: value }));

    if (name === 'amount') {
      const amountNum = parseFloat(value);
      if (isNaN(amountNum) || amountNum <= 0) {
        setAmountError('Le montant doit être un nombre positif.');
      } else if (amountNum > remainingToPayNum) {
        setAmountError('Le montant dépasse le reste à payer.');
      } else {
        setAmountError(null);
      }
    }
  };

  const showReference = paymentForm.method === 'virement' || paymentForm.method === 'cheque';
  const amountNum = parseFloat(paymentForm.amount);
  const isAmountValid = !amountError && !isNaN(amountNum) && amountNum > 0 && amountNum <= remainingToPayNum;

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setErrors({ amount: ['Le montant doit être un nombre positif.'] });
      return;
    }
    if (amt > remainingToPayNum) {
      setErrors({ amount: ['Le montant dépasse le reste à payer.'] });
      return;
    }

    setProcessing(true);
    setSuccess(null);
    setErrors({});

    const paymentRoute =
      rental.rental_type === 'long_term'
        ? route('rentals.longTerm.recordPayment', rental.id)
        : '/payments';

    router.post(paymentRoute, paymentForm, {
      onSuccess: () => {
        setSuccess('Paiement ajouté !');
        setPaymentForm((f) => ({ ...f, amount: '', reference: '' }));
        setPaymentDialogOpen(false);
      },
      onError: (errs: any) => {
        setErrors(errs);
      },
      onFinish: () => setProcessing(false),
      preserveScroll: true,
    });
  };

  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0,00';
    return num.toFixed(2).replace('.', ',');
  };

  const sortedPayments: Payment[] = useMemo(() => {
    const list = [...(rental.payments ?? [])];
    return list.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
  }, [rental.payments]);

  // Only keep the 3 most recent payments
  const latestPayments: Payment[] = useMemo(() => sortedPayments.slice(0, 3), [sortedPayments]);

  const sortedInvoices: LongTermInvoice[] = useMemo(() => {
    const list = [...(rental.invoices ?? [])];
    return list.sort((a, b) => {
      const da = a.due_date ? new Date(a.due_date).getTime() : 0;
      const db = b.due_date ? new Date(b.due_date).getTime() : 0;
      return da - db;
    });
  }, [rental.invoices]);

  // =========================
  // NEW: Change Status Dialog (with car selection when activating)
  // =========================
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(rental.status ?? 'pending');
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const openStatusDialog = () => {
    setSelectedStatus(rental.status ?? 'pending');
    // reset car selection each open; require explicit choice when activating
    setSelectedCarId(null);
    setStatusError(null);
    setStatusDialogOpen(true);
  };

  // 🔎 Only cars that match the rental's car model id
  const filteredCars = useMemo(
    () => (availableCars || []).filter((c) => c.car_model_id === rental?.carModel?.id),
    [availableCars, rental?.carModel?.id]
  );

  const updateRentalStatus = () => {
    setStatusError(null);
    setStatusUpdating(true);

    // guard for activation without car
    if (selectedStatus === 'active' && (!selectedCarId || selectedCarId === 0)) {
      setStatusError('Veuillez sélectionner une voiture.');
      setStatusUpdating(false);
      return;
    }

    // server payload
    const payload: { status: string; car_id?: number } = { status: selectedStatus };
    if (selectedStatus === 'active' && selectedCarId) {
      payload.car_id = selectedCarId;
    }

    router.patch(
      `/rentals/${rental.id}/status`,
      payload,
      {
        preserveScroll: true,
        onError: (errors: any) => {
          const first =
            errors?.message ||
            errors?.status ||
            (typeof errors === 'string' ? errors : null);
          setStatusError(first || 'Erreur lors de la mise à jour du statut.');
          setStatusUpdating(false);
        },
        onSuccess: () => {
          setStatusUpdating(false);
          setStatusDialogOpen(false);
        },
        onFinish: () => setStatusUpdating(false),
      }
    );
  };

  if (isLongTerm) {
    return (
      <AuthenticatedLayout user={auth.user}>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">Location #{rental.id}</h1>
              <RentalStatusBadge status={rental.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={route('rentals.contract.show', rental.id)}>Voir le contrat</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={route('rentals.contract.pdf', rental.id)}>Télécharger le PDF</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Card className="w-full">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Client
                </CardTitle>

                {client?.id && (
                  <Link
                    href={route('clients.show', client.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Voir le client"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                )}
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                {[
                  ['Nom complet', client?.name ?? '—'],
                  ['Téléphone', client?.phone ?? '—'],
                  ['Adresse', client?.address ?? '—'],
                  ["Carte d'identité", client?.identity_card_number ?? '—'],
                  ['Numéro de permis', client?.license_number ?? '—'],
                  [
                    'Date du permis',
                    client?.license_date ? new Date(client.license_date).toLocaleDateString('fr-FR') : '—',
                  ],
                  [
                    'Expiration du permis',
                    client?.license_expiration_date
                      ? new Date(client.license_expiration_date).toLocaleDateString('fr-FR')
                      : '—',
                  ],
                ].map(([label, value], idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="font-medium">{label}</span>
                    <span className="font-medium">{value as string}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Conducteur
                </CardTitle>

                {conductor?.id && (
                  <Link
                    href={route('clients.show', conductor.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Voir le conducteur"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                )}
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                {[
                  ['Nom complet', conductor?.driver_name || conductor?.name || '—'],
                  ['Téléphone', conductor?.phone ?? '—'],
                  ['Adresse', conductor?.address ?? '—'],
                  ["Carte d'identité", conductor?.identity_card_number ?? '—'],
                  ['Numéro de permis', conductor?.license_number ?? '—'],
                  [
                    'Date du permis',
                    conductor?.license_date ? new Date(conductor.license_date).toLocaleDateString('fr-FR') : '—',
                  ],
                  [
                    'Expiration du permis',
                    conductor?.license_expiration_date
                      ? new Date(conductor.license_expiration_date).toLocaleDateString('fr-FR')
                      : '—',
                  ],
                ].map(([label, value], idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="font-medium">{label}</span>
                    <span className="font-medium">{value as string}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <ReservationInfoCard
            car={{ ...carModel, license_plate: car?.license_plate }}
            startDate={rental.start_date}
            endDate={rental.end_date}
            pickupTime={rental.pickup_time}
            returnTime={rental.return_time}
            formatDates
            variant="default"
            className={`w-full border ${getStatusColor(rental.status)} transition`}
            title={
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                <span className="capitalize">Informations de Réservation</span>
              </div>
            }
            headerActions={<RentalStatusBadge status={rental.status} />}
          />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout user={auth.user}>
      <div>
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between gap-4 mb-6">

          {/* LEFT: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href={route("rentals.index")}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>

            <h1 className="text-3xl font-extrabold tracking-tight truncate">
              Location #{rental.id}
            </h1>
          </div>

          {/* SPLIT BUTTON – SAME ON DESKTOP & MOBILE */}
          <ButtonGroup
            className="
            rounded-xl
            overflow-hidden
            border
            bg-background
          "
          >
            {/* Primary action – always visible */}
            <Link href={route("rentals.contract.show", rental.id)}>
              <Button
                variant="ghost"
                className="
                rounded-none
                px-4
                gap-2
              "
              >
                <FileText className="h-4 w-4" />
                Voir contrat
              </Button>
            </Link>

            {/* Dropdown actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="
                  rounded-none
                  px-3
                  border-l
                "
                >
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={route("rentals.edit", rental.id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href={`/rentals/${rental.id}/extend`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Prolonger
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href={route("rentals.changeCar", rental.id)}>
                      <Repeat className="mr-2 h-4 w-4" />
                      Changer de voiture
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    asChild
                    disabled={!rental.payments?.length}
                  >
                    <Link
                      href={route(
                        "payments.invoice.show",
                        rental.payments?.[0]?.id ?? 0
                      )}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Reçu paiement
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setConfirmDeleteOpen(true)}
                      className="
                      text-red-600 font-medium
                      hover:text-red-700
                      hover:bg-red-50
                      focus:bg-red-50
                    "
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>

        {/* DELETE CONFIRM DIALOG (single instance) */}
        {isAdmin && (
          <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle>Supprimer la location</DialogTitle>
                <DialogDescription>
                  Cette action est irréversible. Voulez-vous vraiment supprimer la
                  location #{rental.id} ?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">
                    Annuler
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteForm.processing}
                >
                  {deleteForm.processing ? "Suppression…" : "Supprimer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {isActiveRental && (
          <Card className="mb-6 w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Vehicle Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Statut GPS en lecture seule pour cette location active.
              </div>

              {gpsError ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {gpsError}
                </div>
              ) : null}

              {gpsLoading && !gpsPosition ? (
                <div className="mt-4 text-sm text-muted-foreground">Chargement des données GPS...</div>
              ) : null}

              {!gpsLoading && !gpsPosition ? (
                <div className="mt-4 text-sm text-muted-foreground">
                  GPS non disponible pour ce véhicule.
                </div>
              ) : null}

              {gpsPosition ? (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border p-4">
                      <div className="text-xs text-muted-foreground">Statut véhicule</div>
                      <div className="mt-1 text-sm font-semibold">
                        {gpsPosition.speed > 0 ? 'Moving' : 'Stopped'}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-xs text-muted-foreground">Vitesse</div>
                      <div className="mt-1 text-sm font-semibold">{gpsPosition.speed ?? 0} km/h</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-xs text-muted-foreground">Adresse</div>
                      <div className="mt-1 text-sm font-semibold">Adresse inconnue</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-xs text-muted-foreground">Dernière mise à jour</div>
                      <div className="mt-1 text-sm font-semibold">{gpsPosition.updated_at ?? '—'}</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={route('rentals.gps', rental.id)}>
                      <Button variant="outline">Voir la localisation du véhicule</Button>
                    </Link>
                    <Link href={route('rentals.trip-history', rental.id)}>
                      <Button variant="outline">Historique du trajet</Button>
                    </Link>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="text-sm font-medium">Alertes récentes</div>

                    {alertsError ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {alertsError}
                      </div>
                    ) : null}

                    {alertsLoading && !alerts.length ? (
                      <div className="text-sm text-muted-foreground">Chargement des alertes...</div>
                    ) : null}

                    {!alertsLoading && !alerts.length ? (
                      <div className="text-sm text-muted-foreground">Aucune alerte récente.</div>
                    ) : null}

                    {alerts.length > 0 ? (
                      <div className="space-y-2">
                        {alerts.map((alert, index) => {
                          const meta = alertMeta[alert.type] ?? {
                            label: alert.type,
                            icon: AlertTriangle,
                            color: 'text-muted-foreground',
                          };
                          const Icon = meta.icon;

                          return (
                            <div
                              key={`${alert.rental_id}-${alert.event_time ?? index}`}
                              className="flex items-start gap-3 rounded-md border p-3"
                            >
                              <Icon className={`mt-0.5 h-4 w-4 ${meta.color}`} />
                              <div>
                                <div className="text-sm font-medium">{meta.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {alert.message} • {alert.event_time ?? '—'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

          {/* Client */}
          <Card className="w-full">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Client
              </CardTitle>

              {client?.id && (
                <Link
                  href={route("clients.show", client.id)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Voir le client"
                >
                  <Eye className="w-5 h-5" />
                </Link>
              )}
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {[
                ["Nom complet", client?.name ?? "—"],
                ["Téléphone", client?.phone ?? "—"],
                ["Adresse", client?.address ?? "—"],
                ["Carte d'identité", client?.identity_card_number ?? "—"],
                ["Numéro de permis", client?.license_number ?? "—"],
                [
                  "Date du permis",
                  client?.license_date
                    ? new Date(client.license_date).toLocaleDateString("fr-FR")
                    : "—",
                ],
                [
                  "Expiration du permis",
                  client?.license_expiration_date
                    ? new Date(client.license_expiration_date).toLocaleDateString("fr-FR")
                    : "—",
                ],
              ].map(([label, value], idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="font-medium">{label}</span>
                  <span className="font-medium">{value as string}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Conductor / Second Driver */}
          <Card className="w-full">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {isLongTerm ? "Conducteur" : "Deuxième Conducteur"}
              </CardTitle>

              {(!isLongTerm && secondDriver?.id) || (isLongTerm && conductor?.id) ? (
                <Link
                  href={route("clients.show", (isLongTerm ? conductor?.id : secondDriver?.id) as number)}
                  className="text-blue-600 hover:text-blue-800"
                  title={isLongTerm ? "Voir le conducteur" : "Voir le conducteur"}
                >
                  <Eye className="w-5 h-5" />
                </Link>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {isLongTerm ? (
                [
                  ["Nom complet", conductor?.driver_name || conductor?.name || "—"],
                  ["Téléphone", conductor?.phone ?? "—"],
                  ["Adresse", conductor?.address ?? "—"],
                  ["Carte d'identité", conductor?.identity_card_number ?? "—"],
                  ["Numéro de permis", conductor?.license_number ?? "—"],
                  [
                    "Date du permis",
                    conductor?.license_date
                      ? new Date(conductor.license_date).toLocaleDateString("fr-FR")
                      : "—",
                  ],
                  [
                    "Expiration du permis",
                    conductor?.license_expiration_date
                      ? new Date(conductor.license_expiration_date).toLocaleDateString("fr-FR")
                      : "—",
                  ],
                ].map(([label, value], idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="font-medium">{label}</span>
                    <span className="font-medium">{value as string}</span>
                  </div>
                ))
              ) : secondDriver ? (
                [
                  ["Nom complet", secondDriver.name ?? "—"],
                  ["Téléphone", secondDriver.phone ?? "—"],
                  ["Adresse", secondDriver.address ?? "—"],
                  ["Carte d'identité", secondDriver.identity_card_number ?? "—"],
                  ["Numéro de permis", secondDriver.license_number ?? "—"],
                  [
                    "Date du permis",
                    secondDriver.license_date
                      ? new Date(secondDriver.license_date).toLocaleDateString("fr-FR")
                      : "—",
                  ],
                  [
                    "Expiration du permis",
                    secondDriver.license_expiration_date
                      ? new Date(secondDriver.license_expiration_date).toLocaleDateString("fr-FR")
                      : "—",
                  ],
                ].map(([label, value], idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="font-medium">{label}</span>
                    <span className="font-medium">{value as string}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm">Aucun deuxième conducteur enregistré.</p>
              )}
            </CardContent>
          </Card>
          <ReservationInfoCard
            car={{ ...carModel, license_plate: car?.license_plate }}
            startDate={rental.start_date}
            endDate={rental.end_date}
            pickupTime={rental.pickup_time}
            returnTime={rental.return_time}
            formatDates
            variant="default"
            className={`w-full border ${getStatusColor(rental.status)} transition`}
            title={
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                <span className="capitalize">Informations de Réservation</span>
              </div>
            }
            headerActions={
              <div className="flex items-center gap-2">
                <RentalStatusBadge status={rental.status} />
                <Link
                  href={route('rentals.changeCar', rental.id)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Modifier la location"
                >
                  <Repeat className="w-4 h-4" />
                </Link>
                <Button size="sm" variant="outline" onClick={openStatusDialog}>
                  Changer statut
                </Button>
              </div>
            }
          />

          <ReservationSummaryCard
            items={summaryItems}
            title={
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-muted-foreground" />
                Résumé de la Réservation
              </div>
            }
          />

          {/* Payment (summary + quick add) */}
          <Card className="w-full">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Paiement
              </CardTitle>

              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    Ajouter un paiement
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[425px]">
                  <form onSubmit={handlePaymentSubmit}>
                    <DialogHeader>
                      <DialogTitle>Ajouter un paiement</DialogTitle>
                      <DialogDescription>
                        Remplissez ce formulaire pour ajouter un paiement.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 mt-2">
                      {success && <div className="text-green-600 text-center">{success}</div>}

                      <div className="grid gap-2">
                        <Label htmlFor="amount">Montant</Label>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={handlePaymentChange}
                          required
                          disabled={processing}
                          className={amountError ? "border-red-600 focus:ring-red-600" : ""}
                        />
                        {amountError && <p className="text-red-600 text-sm">{amountError}</p>}
                        {errors.amount && (
                          <p className="text-red-600 text-sm">{errors.amount.join(", ")}</p>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="method">Méthode</Label>
                        <Select
                          value={paymentForm.method}
                          onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, method: value }))}
                          disabled={processing}
                        >
                          <SelectTrigger id="method" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Espèces</SelectItem>
                            <SelectItem value="virement">Virement</SelectItem>
                            <SelectItem value="cheque">Chèque</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.method && (
                          <p className="text-red-600 text-sm">{errors.method.join(", ")}</p>
                        )}
                      </div>

                      {showReference && (
                        <div className="grid gap-2">
                          <Label htmlFor="reference">Référence</Label>
                          <Input
                            id="reference"
                            name="reference"
                            value={paymentForm.reference}
                            onChange={handlePaymentChange}
                            disabled={processing}
                            required
                          />
                          {errors.reference && (
                            <p className="text-red-600 text-sm">{errors.reference.join(", ")}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <DialogFooter className="mt-4">
                      <DialogClose asChild>
                        <Button variant="outline" type="button" disabled={processing}>
                          Annuler
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={processing || !isAmountValid}>
                        {processing ? "Ajout…" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            {/* SUMMARY */}
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between pt-2">
                <span>{manual ? "Total (manuel)" : "Total après remise"}</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(rental.total_price)} MAD
                </span>
              </div>

              {totalPaid > 0 && (
                <div className="flex justify-between">
                  <span>Total payé</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(totalPaid)} MAD
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Reste à payer</span>
                <span className="font-bold text-orange-600">{remainingToPay} MAD</span>
              </div>

              <div className="pt-2 text-xs">
                Saisie par : les noms s’affichent dans l’historique ci-dessous lorsqu’ils sont disponibles.
              </div>
            </CardContent>
          </Card>

          {/* Payment Log */}
          <Card className="w-full">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Historique des paiements</CardTitle>

              <Link href={route("payments.manage", rental.id)}>
                <Button variant="outline" size="sm">Ouvrir la gestion</Button>
              </Link>
            </CardHeader>

            <CardContent>
              {(!sortedPayments || sortedPayments.length === 0) ? (
                <p className="text-center py-4 text-sm">Aucun paiement enregistré.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 text-left">ID</th>
                        <th className="py-2 px-3 text-left">Montant</th>
                        <th className="py-2 px-3 text-left">Méthode</th>
                        <th className="py-2 px-3 text-left">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {latestPayments.map((p) => {
                        const method = p.method ?? "—";

                        const methodBadge =
                          method === "cash" ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              Espèces
                            </span>
                          ) : method === "virement" ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              Virement
                            </span>
                          ) : method === "cheque" ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                              Chèque
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                              —
                            </span>
                          );

                        return (
                          <tr key={p.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">#{p.id}</td>
                            <td className="py-2 px-3">{formatAmount(Number(p.amount || 0))} MAD</td>
                            <td className="py-2 px-3">{methodBadge}</td>
                            <td className="py-2 px-3">
                              {p.date ? new Date(p.date).toLocaleDateString("fr-FR") : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prolongations */}
          {/* Prolongations */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Historique des prolongations
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {rental.extensions?.length ? (
                rental.extensions.map((ext, idx) => (
                  <div key={idx} className="space-y-2">

                    {/* Dates */}
                    <div className="flex justify-between">
                      <span>Ancienne fin</span>
                      <span className="font-semibold text-red-600">
                        {new Date(ext.old_end_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Nouvelle fin</span>
                      <span className="font-semibold text-green-600">
                        {new Date(ext.new_end_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-between">
                      <span>Ancien total</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(ext.old_total)} MAD
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Nouveau total</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(ext.new_total)} MAD
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="text-xs text-gray-500">
                      par {ext.user?.name ?? "—"} le{" "}
                      {new Date(ext.created_at).toLocaleDateString("fr-FR")}
                    </div>

                    {/* Divider line */}
                    {idx < rental.extensions.length - 1 && (
                      <div className="border-t my-3"></div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm">Aucune prolongation enregistrée.</p>
              )}
            </CardContent>
          </Card>


          {/* Car Changes */}
          {/* Car Changes */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-primary" />
                Historique des changements de voiture
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              {rental.car_changes?.length ? (
                rental.car_changes.map((change, idx) => (
                  <div key={idx} className="space-y-2">

                    {/* Old → New Car */}
                    <div className="flex justify-between">
                      <span>Ancienne voiture</span>
                      <span className="font-semibold text-red-600">
                        {change.old_car?.license_plate ?? "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Nouvelle voiture</span>
                      <span className="font-semibold text-green-600">
                        {change.new_car?.license_plate ?? "—"}
                      </span>
                    </div>

                    {/* Price change */}
                    <div className="flex justify-between">
                      <span>Ancien prix</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(change.old_total)} MAD
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Nouveau prix</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(change.new_total)} MAD
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="text-xs text-gray-500 mt-1">
                      par {change.user?.name ?? "—"} le{" "}
                      {new Date(change.created_at).toLocaleDateString("fr-FR")}
                    </div>

                    {/* Divider */}
                    {idx < rental.car_changes.length - 1 && (
                      <div className="border-t my-3"></div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm">Aucun changement de voiture enregistré.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Back */}
        <div className="pt-6 text-center">
          <Link href={route("rentals.index")}>
            <Button
              variant="secondary"
              aria-label="Retour à la liste des locations"
              className="inline-flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Retour à la liste des locations</span>
            </Button>
          </Link>
        </div>
      </div>

      {rental.rental_type === 'long_term' && (
        <div className="mb-6 space-y-4">
          <div
            className={`p-4 rounded-lg border flex items-center justify-between ${overdueStatus === 'overdue'
              ? 'bg-red-50 border-red-200 text-red-800'
              : overdueStatus === 'due_soon'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
          >
            <div>
              <p className="font-semibold">
                {overdueStatus === 'overdue'
                  ? 'Paiement en retard'
                  : overdueStatus === 'due_soon'
                    ? 'Échéance imminente'
                    : 'Paiement à jour'}
              </p>
              <p className="text-sm">
                Prochaine échéance: {rental.next_payment_due_date ? new Date(rental.next_payment_due_date).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="default" onClick={() => setLldPaymentDialogOpen(true)}>
                Enregistrer un paiement
              </Button>
              <Button variant="secondary" onClick={() => setEndDialogOpen(true)}>
                Clôturer la LLD
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>LLD - Informations</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Prix mensuel</span>
                <span>{formatCurrency(rental.monthly_price || 0)} MAD</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Cycle de paiement</span>
                <span>{paymentCycleLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Dernier paiement</span>
                <span>{rental.last_payment_date ? new Date(rental.last_payment_date).toLocaleDateString('fr-FR') : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Prochain paiement</span>
                <span>
                  {rental.next_payment_due_date
                    ? new Date(rental.next_payment_due_date).toLocaleDateString('fr-FR')
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Caution</span>
                <span>{rental.deposit ? `${formatCurrency(rental.deposit)} MAD` : '—'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Factures LLD</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2">Échéance</th>
                      <th className="py-2">Montant</th>
                      <th className="py-2">Statut</th>
                      <th className="py-2">Paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInvoices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-3 text-center text-muted-foreground">
                          Aucune facture enregistrée.
                        </td>
                      </tr>
                    )}
                    {sortedInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t">
                        <td className="py-2">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className="py-2">{formatCurrency(invoice.amount_due || 0)} MAD</td>
                        <td className="py-2 capitalize">
                          {invoice.status === 'paid' ? (
                            <Badge className="bg-emerald-100 text-emerald-800">Payée</Badge>
                          ) : invoice.status === 'overdue' ? (
                            <Badge className="bg-red-100 text-red-800">Retard</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">À payer</Badge>
                          )}
                        </td>
                        <td className="py-2">
                          {invoice.paid_at
                            ? new Date(invoice.paid_at).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={lldPaymentDialogOpen} onOpenChange={setLldPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enregistrer un paiement</DialogTitle>
                <DialogDescription>Met à jour la prochaine échéance et marque les factures payées.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Facture</Label>
                  <Select
                    value={String(lldPaymentForm.data.invoice_id || '')}
                    onValueChange={(value) => lldPaymentForm.setData('invoice_id', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélection automatique" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sélection automatique</SelectItem>
                      {sortedInvoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={String(invoice.id ?? '')}>
                          {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : 'Échéance'} - {formatCurrency(invoice.amount_due || 0)} MAD
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Montant</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lldPaymentForm.data.amount}
                    onChange={(e) => lldPaymentForm.setData('amount', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Méthode</Label>
                  <Select
                    value={lldPaymentForm.data.method}
                    onValueChange={(value) => lldPaymentForm.setData('method', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="virement">Virement</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Référence</Label>
                  <Input
                    value={lldPaymentForm.data.reference}
                    onChange={(e) => lldPaymentForm.setData('reference', e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={submitPayment}>Valider</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clôturer la location longue durée</DialogTitle>
                <DialogDescription>Définissez la date de fin pour générer la facture finale.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={endForm.data.end_date as string}
                  onChange={(e) => endForm.setData('end_date', e.target.value)}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button onClick={submitEndRental}>Clôturer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* NEW: Change Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le statut de la location</DialogTitle>
            <DialogDescription>
              Sélectionnez un nouveau statut et cliquez sur sauvegarder.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            <div>
              <Label>Statut</Label>
              <div className="flex flex-col gap-2 mt-2">
                {statusOptions.map(({ value, label, color, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedStatus(value)}
                    disabled={statusUpdating}
                    className={`flex items-center justify-between px-3 py-2 rounded border w-full ${selectedStatus === value
                      ? 'bg-gray-200 border-gray-400'
                      : 'border-transparent hover:border-gray-400'
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`${color} w-5 h-5`} />
                      <span className={`${color} font-semibold`}>{label}</span>
                    </div>
                    {rental.status === value && (
                      <span className="text-xs font-medium bg-gray-200 text-muted-foreground px-2 py-0.5 rounded-full">
                        Actuel
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedStatus === 'active' && (
              <div>
                <Label>Voiture (obligatoire — même modèle requis)</Label>
                <div className="flex flex-col gap-2 mt-2 max-h-56 overflow-auto border rounded p-2">
                  {(!filteredCars || filteredCars.length === 0) && (
                    <p className="text-muted-foreground">
                      Aucune voiture disponible pour ce modèle ({carModel?.brand} {carModel?.model}).
                    </p>
                  )}
                  {filteredCars && filteredCars.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCarId(Number(c.id))}
                      disabled={statusUpdating}
                      className={`px-3 py-2 rounded border text-left ${selectedCarId === c.id
                        ? 'bg-gray-200 border-gray-400'
                        : 'border-transparent hover:border-gray-400'
                        }`}
                    >
                      ID #{c.id} — {c.license_plate ?? '—'}
                      {c?.car_model?.brand ? ` • ${c.car_model.brand}` : ''}
                      {c?.car_model?.model ? ` ${c.car_model.model}` : ''}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sélectionnez une voiture pour passer le statut à « active ».
                </p>
              </div>
            )}

            {statusError && (
              <p className="text-red-600 font-semibold mt-2">{statusError}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={statusUpdating}>Annuler</Button>
            </DialogClose>
            <Button onClick={updateRentalStatus} disabled={statusUpdating}>
              {statusUpdating ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
