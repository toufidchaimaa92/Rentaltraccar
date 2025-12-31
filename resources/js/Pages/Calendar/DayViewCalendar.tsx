import { router } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, Check, Clock, Play, CheckCircle, XCircle, Eye, Printer,
  Calendar1, Car, User, Phone, StickyNote, ArrowLeftCircle, ArrowRightCircle
} from 'lucide-react';

import {
  Dialog, DialogContent,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

// shadcn/ui header bits
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CompletionDialogs from '@/components/rentals/CompletionDialogs';
import useRentalCompletionFlow, { getPaymentSummary } from '@/hooks/useRentalCompletionFlow';

// jsPDF + autoTable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ===== Helpers (jours locaux pour éviter les décalages UTC) =====
const toLocalYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const toDayMonth = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
const hhmm = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });

// Types
interface Car { id: string; make: string; model: string; license_plate: string; }
interface Client { id?: number | string; phone: string; }
interface CarModel { brand: string; model: string; }
interface Event {
  id: string; title: string; start: string; end: string;
  color?: string; status: string; car_id?: string | null; car_model_id?: string | null;
  car?: Car | null; client?: Client | null; carModel: CarModel;
  note?: string;
  eventType?: 'start' | 'end' | 'single' | 'due';
  displayColor?: string;
  paid_amount?: number;
  total_amount?: number;
  reste_a_payer?: number;
  has_payment_due?: boolean;
  payment_status?: string | null;
  client_id?: number | string;
}
interface Props {
  auth: { user: any };
  events: Event[];
  currentDate: Date;
  setEvents: (events: Event[]) => void;
}

export default function DayViewCalendar({
  auth, events, currentDate, setEvents,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<'all' | 'start' | 'end'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [isReturnContext, setIsReturnContext] = useState(false);
  const handledPaymentRedirect = useRef(false);

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const isAdmin = Boolean(auth?.user?.is_admin || auth?.user?.role === 'admin');
  const isToday = toLocalYMD(currentDate) === toLocalYMD(new Date());
  const dayHeaderLabel = isToday ? 'aujourd’hui' : toDayMonth(currentDate);
  const departuresHeader = `Départs ${dayHeaderLabel}`;
  const returnsHeader = `Retours ${dayHeaderLabel}`;

  const statusOptions = [
    { value: 'pending', label: 'En attente', color: 'orange', icon: Clock },
    { value: 'confirmed', label: 'Confirmée', color: 'blue', icon: Check },
    { value: 'active', label: 'En cours', color: 'green', icon: Play },
    { value: 'completed', label: 'Terminée', color: 'emerald', icon: CheckCircle },
    { value: 'cancelled', label: 'Annulée', color: 'red', icon: XCircle },
  ];

  const statusOptionsForContext = (isReturn: boolean) =>
    isReturn
      ? statusOptions.filter((option) => ['completed', 'cancelled'].includes(option.value))
      : statusOptions;

  const statusToFr = (v: string) =>
    (statusOptions.find(s => s.value === (v || '').toLowerCase())?.label) || v;

  const getStatusColor = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-muted text-foreground border-border';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const formatMAD = (value: number | string | null | undefined) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      .format(Number(value ?? 0));

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

  const hasPaymentDue = (event: Event) => {
    const paymentStatus = (event.payment_status || '').toLowerCase();
    const remaining = Number(event.reste_a_payer ?? 0);
    const total = Number(event.total_amount ?? 0);
    const paid = Number(event.paid_amount ?? 0);
    const hasPartialStatus = ['partial', 'due', 'unpaid'].includes(paymentStatus);
    const statusDue = (event.status || '').toLowerCase() === 'due';
    const hasBalance = Number.isFinite(remaining) && remaining > 0;
    const hasTotalGap = Number.isFinite(total) && Number.isFinite(paid) && total > 0 && paid < total;

    return Boolean(event.has_payment_due) || hasBalance || hasTotalGap || hasPartialStatus || statusDue;
  };

  // ===== start / end / single uniquement, comparé par jour local =====
  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = toLocalYMD(date);
    return events
      .map(e => {
        const isDue = e.status?.toLowerCase() === 'due';
        const sDate = new Date(e.start);
        const eDate = new Date(e.end);
        const sStr = toLocalYMD(sDate);
        const enStr = toLocalYMD(eDate);

        const isCompletedWithDue = e.status === 'completed' && hasPaymentDue(e) && dateStr === enStr;
        const shouldInclude = e.status !== 'completed' || isCompletedWithDue;

        if (shouldInclude && (dateStr === sStr || dateStr === enStr)) {
          const baseType = isDue
            ? 'due'
            : sStr === enStr
              ? 'single'
              : (dateStr === sStr ? 'start' : 'end');
          const eventType = isCompletedWithDue ? 'end' : baseType;

          const displayColor = (() => {
            if (eventType === 'due') return 'amber';
            if (eventType === 'start' || eventType === 'single') return 'blue';
            return 'red';
          })();

          return { ...e, eventType, displayColor };
        }
        return null;
      })
      .filter((e): e is Event => Boolean(e));
  };

  const fetchAvailableCars = async () => {
    if (!selectedEvent?.id) { setAvailableCars([]); setErrorMessage('Aucune location sélectionnée.'); return; }
    setIsLoading(true); setErrorMessage(null);
    try {
      const res = await fetch(`/cars/available?rental_id=${selectedEvent.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const result = await res.json();
      if (Array.isArray(result.cars)) { setAvailableCars(result.cars); } else {
        setAvailableCars([]); setErrorMessage(result.message || 'Aucune voiture disponible pour ce modèle.');
      }
    } catch {
      setErrorMessage('Échec du chargement des voitures.'); setAvailableCars([]);
    } finally { setIsLoading(false); }
  };

  // ========= UPDATED: use Inertia router.patch with optimistic close + rollback =========
  const updateEventStatus = async (
    eventId: string,
    newStatus: string,
    eventForUpdate: Event | null = selectedEvent,
    extraPayload: Record<string, unknown> = {}
  ) => {
    setIsUpdatingStatus(true);
    setErrorMessage(null);
    const wasModalOpen = showStatusModal;

    // guard for activation without car
    if (newStatus === 'active' && eventForUpdate?.status !== 'active' && !selectedCarId) {
      setErrorMessage('Veuillez sélectionner une voiture.');
      setIsUpdatingStatus(false);
      return;
    }

    // Payload for server
    const payload: { status: string; car_id?: string } & Record<string, unknown> = {
      status: newStatus,
      ...extraPayload,
    };
    if (newStatus === 'active' && eventForUpdate?.status !== 'active' && selectedCarId) {
      payload.car_id = selectedCarId;
    }

    // Snapshots for rollback
    const prevEvents = events;
    const lastSelectedEvent = eventForUpdate;
    const prevSelectedStatus = selectedStatus;
    const prevCarId = selectedCarId;

    // Optimistic update
    const chosen = availableCars.find(c => c.id === selectedCarId);
    setEvents(prev =>
      prev
        .map(e =>
          e.id === eventId
            ? {
              ...e,
              status: newStatus,
              car_id: newStatus === 'active' ? selectedCarId : e.car_id,
              car:
                newStatus === 'active' && chosen
                  ? { make: chosen.make, model: chosen.model, license_plate: chosen.license_plate }
                  : e.car,
            }
            : e
        )
        .filter(e => e.status !== 'completed')
    );

    // Close modal right after optimistic change
    setShowStatusModal(false);
    setSelectedEvent(null);
    setSelectedCarId(null);

    // Send PATCH via Inertia (expects 303 redirect from server)
    router.patch(`/rentals/${eventId}/status`, payload, {
      preserveScroll: true,
      onError: (errors: any) => {
        // Roll back UI
        setEvents(prevEvents);

        // Reopen modal with previous selections
        if (wasModalOpen && lastSelectedEvent) {
          setShowStatusModal(true);
          setSelectedEvent(lastSelectedEvent);
          setSelectedStatus(prevSelectedStatus);
          setSelectedCarId(prevCarId);
        }

        const first =
          errors?.message ||
          errors?.status ||
          (typeof errors === 'string' ? errors : null) ||
          'Erreur lors de la mise à jour du statut.';
        setErrorMessage(first);
        setIsUpdatingStatus(false);
      },
      onFinish: () => setIsUpdatingStatus(false),
    });
  };
  // ========= end updateEventStatus =========

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
  } = useRentalCompletionFlow<Event>({
    selectedItem: selectedEvent,
    setSelectedItem: setSelectedEvent,
    setItems: setEvents,
    onFinalizeStatus: (event, payload) => updateEventStatus(event.id, 'completed', event, payload),
  });

  const fetchEvents = () => {
    setIsLoading(true);
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const d = currentDate.getDate();
    const url = `/calendar/day?date=${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    router.get(url, {}, {
      preserveState: true, preserveScroll: true, only: ['events'],
      onSuccess: (page: any) => {
        if (!page.props.events) { setIsLoading(false); return; }
        const fetched = page.props.events
          .map((e: any) => {
            if (!e.start || !e.end) return null;
            const sd = new Date(e.start), ed = new Date(e.end);
            if (isNaN(sd.getTime()) || isNaN(ed.getTime())) return null;
            return {
              id: String(e.id), title: String(e.title),
              start: e.start, end: e.end,
              color: e.color || 'blue', status: e.status || 'pending',
              car_id: e.car_id || null, car_model_id: e.car_model_id || null,
              car: e.car || null, client: e.client || null,
              carModel: e.carModel || { brand: 'Inconnue', model: 'Inconnu' },
              note: e.note || '',
              client_id: e.client_id ?? e.client?.id ?? null,
              paid_amount: e.paid_amount ?? 0,
              total_amount: e.total_amount ?? 0,
              reste_a_payer: e.reste_a_payer ?? 0,
              has_payment_due: e.has_payment_due ?? false,
              payment_status: e.payment_status ?? null,
            } as Event;
          })
          .filter(Boolean);
        setEvents(fetched); setIsLoading(false);
      },
      onError: () => setIsLoading(false),
    });
  };

  useEffect(() => { fetchEvents(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [currentDate]);

  useEffect(() => {
    if (showStatusModal && selectedEvent) {
      const allowedOptions = statusOptionsForContext(isReturnContext);
      const allowedValues = new Set(allowedOptions.map((option) => option.value));
      const nextStatus = allowedValues.has(selectedEvent.status) ? selectedEvent.status : 'completed';
      setSelectedStatus(nextStatus);
      setSelectedCarId(selectedEvent.car_id || null);
      setErrorMessage(null);
    }
  }, [showStatusModal, selectedEvent, isReturnContext]);

  useEffect(() => {
    if (showStatusModal && selectedEvent && selectedStatus === 'active' && selectedEvent.status !== 'active') {
      fetchAvailableCars();
    }
  }, [showStatusModal, selectedEvent, selectedStatus]);

  useEffect(() => {
    if (handledPaymentRedirect.current) return;
    if (!events.length) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('completed_payment') !== '1') return;

    const rentalId = params.get('rental_id');
    if (!rentalId) return;

    const matchingEvent = events.find((event) => event.id === rentalId);
    if (!matchingEvent) return;

    const { remaining } = getPaymentSummary(matchingEvent);
    if (remaining === 0) {
      handledPaymentRedirect.current = true;
      setSelectedEvent(matchingEvent);
      setShowRatingDialog(true);
    }

    params.delete('completed_payment');
    params.delete('rental_id');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
    window.history.replaceState({}, '', nextUrl);
  }, [events]);

  const dayEvents = getEventsForDate(currentDate);

  // --- sort helpers & sorted lists (UI + PDF) ---
  const safeTime = (s?: string) => {
    const t = s ? new Date(s).getTime() : NaN;
    return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
  };
  const byStartTime = (a: Event, b: Event) => safeTime(a.start) - safeTime(b.start);
  const byEndTime = (a: Event, b: Event) => safeTime(a.end) - safeTime(b.end);

  const startsList = () =>
    dayEvents
      .filter(e => e.eventType === 'start' || e.eventType === 'single')
      .sort(byStartTime);

  const endsList = () =>
    dayEvents
      .filter(e => e.eventType === 'end' || e.eventType === 'single')
      .sort(byEndTime);

  const allCount = startsList().length + endsList().length;

  // ========= PDF (jsPDF + autoTable) — A4 safe =========
  const PDF_MARGIN = { top: 40, right: 40, bottom: 30, left: 40 };
  const PDF_HEADER_BLUE: [number, number, number] = [17, 94, 250];
  const formatMADForPdf = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—';

    const numeric = Number(
      typeof value === 'string'
        ? value.replace(/[^\d.-]/g, '')
        : value
    );

    if (!Number.isFinite(numeric)) return '—';

    // ❗ NO locale formatting → no 7/000 bug
    return String(Math.round(numeric));
  };


  const HEAD_DEPARTS = [['Client', 'Modèle', 'Immat.', 'Téléphone', 'Heure départ', 'Note']];
  const HEAD_RETOURS = [['Client', 'Modèle', 'Immat.', 'Téléphone', 'Heure fin', 'Reste', 'Note']];

  const baseTableOpts = () => ({
    margin: { left: PDF_MARGIN.left, right: PDF_MARGIN.right },
    tableWidth: 'auto' as const,
    styles: {
      font: 'helvetica',
      fontSize: 10,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 6,
      fillColor: false,
    },
    headStyles: {
      textColor: 20,
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      fillColor: false,
    },
    alternateRowStyles: { fillColor: false },
    theme: 'grid' as const,
  });

  const rowsForPDFDepart = (list: Event[]) =>
    list.map((e) => ([
      e.title ?? '—',
      `${e.carModel?.model ?? ''}`.trim() || '—',
      e.car?.license_plate ?? '—',
      e.client?.phone ?? '—',
      hhmm(e.start),
      '',
    ]));

  const rowsForPDFRetour = (list: Event[]) =>
    list.map((e) => ([
      e.title ?? '—',
      `${e.carModel?.model ?? ''}`.trim() || '—',
      e.car?.license_plate ?? '—',
      e.client?.phone ?? '—',
      hhmm(e.end),
      (e.reste_a_payer ?? 0) > 0 ? formatMADForPdf(e.reste_a_payer ?? 0) : '—',

      '',
    ]));

  // === Background image (full-page) ===
  const backgroundDataUrlRef = useRef<string | null>(null);
  const backgroundUrl = new URL('/images/A5.png', window.location.origin);

  const loadBackgroundDataUrl = async () => {
    if (backgroundDataUrlRef.current) return backgroundDataUrlRef.current;

    try {
      const response = await fetch(backgroundUrl.toString());
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Unable to read background image'));
        reader.readAsDataURL(blob);
      });

      backgroundDataUrlRef.current = dataUrl;
      return dataUrl;
    } catch (error) {
      backgroundDataUrlRef.current = null;
      return null;
    }
  };

  const drawBackgroundImage = (doc: jsPDF, dataUrl?: string | null) => {
    if (!dataUrl) return;

    try {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    } catch (error) {
    }
  };

  const buildPdfDocument = async () => {
    const backgroundDataUrl = await loadBackgroundDataUrl();
    const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const dateStr = currentDate.toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const headerDate = currentDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    drawBackgroundImage(doc, backgroundDataUrl);

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Généré le ${headerDate}`, pageWidth - PDF_MARGIN.right, PDF_MARGIN.top, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);

    if (dayFilter === 'all') {
      const titleY = PDF_MARGIN.top + 90;
      doc.text(`Locations ${dateStr}`, PDF_MARGIN.left, titleY);

      const departTitleY = titleY + 30;
      doc.setFontSize(12);
      doc.setTextColor(...PDF_HEADER_BLUE);
      doc.text('Départs', PDF_MARGIN.left, departTitleY);
      doc.setTextColor(0, 0, 0);
      (autoTable as any)(doc, {
        ...baseTableOpts(),
        startY: departTitleY + 12,
        head: HEAD_DEPARTS,
        body: rowsForPDFDepart(startsList()),
      });

      const afterDepart = (doc as any).lastAutoTable?.finalY ?? (departTitleY + 24);
      const retoursTitleY = afterDepart + 20;
      doc.setTextColor(...PDF_HEADER_BLUE);
      doc.text('Retours', PDF_MARGIN.left, retoursTitleY);
      doc.setTextColor(0, 0, 0);
      (autoTable as any)(doc, {
        ...baseTableOpts(),
        startY: retoursTitleY + 12,
        head: HEAD_RETOURS,
        body: rowsForPDFRetour(endsList()),
        didParseCell: (data: any) => {
          // colonne "Reste" = dernière colonne
          if (data.section === 'body' && data.column.index === 5) {

            const value = Number(
              String(data.cell.raw).replace(/[^\d.-]/g, '')
            );
            if (value > 0) {
              data.cell.styles.textColor = [200, 0, 0]; // 🔴 rouge
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });



      const afterRetours = (doc as any).lastAutoTable?.finalY ?? (retoursTitleY + 24);
      return doc;
    }

    const isStart = dayFilter === 'start';
    const titre = isStart ? 'Départs' : 'Retours';
    const head = isStart ? HEAD_DEPARTS : HEAD_RETOURS;
    const rows = isStart ? rowsForPDFDepart(startsList()) : rowsForPDFRetour(endsList());

    const titleY = PDF_MARGIN.top + 90;
    doc.text(`Locations — ${dateStr} — Filtre : ${titre}`, PDF_MARGIN.left, titleY);

    (autoTable as any)(doc, {
      ...baseTableOpts(),
      startY: titleY + 30,
      head,
      body: rows,
    });

    return doc;
  };

  const handlePrintPDF = async () => {
    const doc = await buildPdfDocument();
    doc.autoPrint();

    const blob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(blob);

    const printWindow = window.open(pdfUrl);

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      doc.output('dataurlnewwindow');
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
  };

  const renderSectionPanel = (
    title: string,
    tone: { glyph: string; headerBg: string; text: string; iconBg: string; countBg: string },
    items: Event[],
    emptyLabel: string,
    isReturnSection = false,
  ) => (
    <Card className="overflow-hidden border border-border shadow-sm p-0">
      {/* HEADER - now touches edges perfectly */}
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 ${tone.headerBg} ${tone.text}`}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tone.iconBg}`}>
            <span className="text-lg" aria-hidden>{tone.icon}</span>
          </div>
          <p className="text-sm font-semibold leading-tight">{title}</p>
        </div>

        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.countBg}`}>
          {items.length} événement{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* BODY */}
      <CardContent className="space-y-3 bg-card">
        {items.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center text-center text-muted-foreground pb-6">
            <p className="text-sm">{emptyLabel}</p>
          </div>
        ) : (
          items.map((event) => renderEventCard(event, isReturnSection))
        )}
      </CardContent>
    </Card>
  );

  const startTone = {
    icon: <ArrowRightCircle className="h-5 w-5" />, // Départs
    headerBg: "bg-blue-50",
    text: "text-blue-800",
    iconBg: "bg-blue-100",
    countBg: "bg-blue-100 text-blue-800",
  };

  const endTone = {
    icon: <ArrowLeftCircle className="h-5 w-5" />, // Retours
    headerBg: "bg-red-50",
    text: "text-red-800",
    iconBg: "bg-red-100",
    countBg: "bg-red-100 text-red-800",
  };

  const renderEventCard = (event: Event, isReturnSection: boolean) => {
    const isStart = event.eventType === "start";
    const isEnd = event.eventType === "end";
    const isDue = event.eventType === "due";
    const showPaymentBadge = (isEnd || event.eventType === "single") && hasPaymentDue(event);

    const tone = isDue
      ? { chip: "bg-amber-100 text-amber-800", bar: "bg-amber-500" }
      : isStart
        ? { chip: "bg-blue-100 text-blue-800", bar: "bg-blue-500" }
        : isEnd
          ? { chip: "bg-red-100 text-red-800", bar: "bg-red-500" }
          : { chip: "bg-slate-100 text-slate-700", bar: "bg-slate-500" };

    const timingLabel = isDue
      ? `Échéance • ${hhmm(event.start)}`
      : isStart
        ? `Début • ${hhmm(event.start)}`
        : `Fin • ${hhmm(event.end)}`;

    return (
      <div key={event.id} className="relative bg-card pb-6">

        {/* HEADER (chip + icons) */}
        <div className="flex items-center justify-between mb-4">
          {/* Time pill */}
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${tone.chip}`}
          >
            ⏱ {timingLabel}
          </span>

          {/* ICON-ONLY ACTION BUTTONS */}
          {!isDue && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setSelectedEvent(event);
                  setShowStatusModal(true);
                  setSelectedStatus(event.status);
                  setSelectedCarId(event.car_id || null);
                  setIsReturnContext(isReturnSection);
                }}
                className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition"
                title="Statut"
              >
                <Settings size={18} />
              </button>

              <button
                onClick={() => router.visit(`/rentals/${event.id}`)}
                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                title="Détails"
              >
                <Eye size={18} />
              </button>
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="grid gap-4 sm:grid-cols-2">

          {/* CAR INFO */}
          <div className="flex gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <Car className="h-4 w-4" />
            </div>

            <div className="space-y-1">

              {/* BRAND + MODEL FIRST */}
              <p className="text-sm font-semibold capitalize">
                {event.carModel?.brand || "—"} {event.carModel?.model || ""}
              </p>

              {/* License Plate UNDER brand */}
              {event.car?.license_plate ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold shadow">
                  {event.car.license_plate}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Immatriculation inconnue
                </span>
              )}

            </div>
          </div>


          {/* CLIENT INFO */}
          <div className="flex gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
              <User className="h-4 w-4" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold capitalize">{event.title || "—"}</p>

              {event.client?.phone ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <Phone className="h-3 w-3" />
                  {event.client.phone}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Téléphone inconnu</span>
              )}
            </div>
          </div>
        </div>

        {/* NOTE */}
        {event.note && (
          <div className="mt-3 rounded-lg border border-dashed p-3 text-sm bg-muted/40">
            <div className="flex items-start gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase text-muted-foreground">Note</p>
                <p className="font-medium">{event.note}</p>
              </div>
            </div>
          </div>
        )}

        {showPaymentBadge && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-800">
            ⚠️ Reste à payer : {formatMAD(event.reste_a_payer ?? 0)} MAD
          </div>
        )}

        {/* SEPARATOR */}
        <div className="mt-6 border-t border-border/60" />
      </div>
    );
  };

  return (
    <>
      <div className="day-view space-y-4">
        {/* FILTERS - Pills Navigation */}
        <div className="mb-4 flex items-center justify-between gap-3">

          {/* Pills - scrollable on mobile */}
          <div className="inline-flex max-w-[70%] overflow-x-auto rounded-full bg-muted p-1 shadow-inner no-scrollbar sm:max-w-none">

            {[
              {
                value: "all",
                label: "Tous",
                count: allCount,
                icon: <Calendar1 className="h-4 w-4" />,
              },
              {
                value: "start",
                label: "Départs",
                count: startsList().length,
                icon: <ArrowRightCircle className="h-4 w-4" />,
              },
              {
                value: "end",
                label: "Retours",
                count: endsList().length,
                icon: <ArrowLeftCircle className="h-4 w-4" />,
              },
            ].map(({ value, label, count, icon }) => {
              const active = dayFilter === value;

              return (
                <button
                  key={value}
                  onClick={() => setDayFilter(value as any)}
                  className={`
                    flex items-center gap-2 whitespace-nowrap rounded-full
                    px-3 py-1.5 sm:px-4 sm:py-2
                    text-sm font-medium transition
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    ${active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {icon}

                  {/* LABEL – hide on mobile */}
                  <span className="hidden sm:inline">{label}</span>

                  <span
                    className={`
                      ml-1 inline-flex items-center justify-center rounded-full
                      px-2 py-0.5 text-xs font-semibold
                      ${active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                      }
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* PDF button */}
          <Button
            variant="ghost"
            onClick={handlePrintPDF}
            className="flex-shrink-0 inline-flex h-10 w-10 items-center gap-2 sm:w-auto sm:px-4"
          >
            <Printer className="h-5 w-5" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>
        </div>

        {/* CONTENT */}
        {allCount === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <div className="mb-4 text-6xl">📅</div>
            <p className="text-lg">Aucune location ce jour</p>
            <p className="mt-2 text-sm">
              Utilisez la navigation pour consulter d’autres jours
            </p>
          </div>
        ) : (
          <>
            {dayFilter === "all" && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderSectionPanel(
                  departuresHeader,
                  startTone,
                  startsList(),
                  "Aucun départ prévu aujourd’hui.",
                  false
                )}
                {renderSectionPanel(
                  returnsHeader,
                  endTone,
                  endsList(),
                  "Aucun retour prévu aujourd’hui.",
                  true
                )}
              </div>
            )}

            {dayFilter === "start" &&
              renderSectionPanel(
                departuresHeader,
                startTone,
                startsList(),
                "Aucun départ prévu aujourd’hui.",
                false
              )}

            {dayFilter === "end" &&
              renderSectionPanel(
                returnsHeader,
                endTone,
                endsList(),
                "Aucun retour prévu aujourd’hui.",
                true
              )}
          </>
        )}
      </div>


      {/* Modal Statut */}
      {showStatusModal && selectedEvent && (
        <Dialog open={showStatusModal} onOpenChange={(open) => !open && setShowStatusModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le statut de la location</DialogTitle>
            </DialogHeader>

            <div className="my-4 space-y-4">
              <div className="space-y-4">
                {/* ===== RETURN CONTEXT ===== */}
                {isReturnContext && selectedEvent ? (
                  <div className="flex flex-col gap-2">
                    {/* TERMINÉE */}
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
                      onClick={() => router.visit(`/rentals/${selectedEvent.id}/extend`)}
                    />

                    {/* CHANGE CAR */}
                    <ActionRow
                      icon={Car}
                      label="Changer de voiture"
                      color="text-amber-600"
                      onClick={() => router.visit(`/rentals/${selectedEvent.id}/change-car`)}
                    />
                  </div>
                ) : (
                  /* ===== NORMAL CONTEXT ===== */
                  <div className="flex flex-col gap-2">
                    {statusOptions.map(({ value, label, color, icon: Icon }) => (
                      <ActionRow
                        key={value}
                        icon={Icon}
                        label={label}
                        color={`text-${color}-600`}
                        active={selectedStatus === value}
                        onClick={() => setSelectedStatus(value)}
                      />
                    ))}
                  </div>
                )}

                {errorMessage && (
                  <p className="mt-2 font-semibold text-red-600">{errorMessage}</p>
                )}
              </div>
            </div>

            {!isReturnContext && selectedStatus === 'active' && selectedEvent?.status !== 'active' && (
              <div>
                <label className="block text-sm font-medium">Voiture</label>
                <div className="mt-2 max-h-48 space-y-2 overflow-auto rounded border border-border bg-card p-2">
                  {isLoading ? (
                    <p className="text-muted-foreground">Chargement des voitures…</p>
                  ) : availableCars.length === 0 ? (
                    <p className="text-muted-foreground">Aucune voiture disponible.</p>
                  ) : (
                    availableCars.map((car) => (
                      <button
                        key={car.id}
                        type="button"
                        onClick={() => setSelectedCarId(car.id)}
                        disabled={isUpdatingStatus}
                        className={`w-full whitespace-nowrap rounded border px-3 py-2 text-left ${selectedCarId === car.id
                          ? 'border-border bg-muted'
                          : 'border-transparent hover:border-border'
                          }`}
                      >
                        {car.make} {car.model} ({car.license_plate})
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  const finalStatus = isReturnContext ? 'completed' : selectedStatus;
                  if (finalStatus === 'completed' && selectedEvent) {
                    setShowStatusModal(false);
                    setErrorMessage(null);
                    openCompletionFlow(selectedEvent);
                    return;
                  }
                  updateEventStatus(selectedEvent!.id, finalStatus);
                }}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Sauvegarde…' : 'Sauvegarder'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
        isUpdating={isUpdatingStatus}
        formatCurrency={formatMAD}
      />
    </>
  );
}