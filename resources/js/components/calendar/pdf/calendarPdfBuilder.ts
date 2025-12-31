import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CalendarEvent,
  getStarts,
  getEnds,
  hhmm,
  PDF_STYLES,
} from '../calendarHelpers';

const HEAD_DEPARTS = [['Client', 'Modèle', 'Immat.', 'Téléphone', 'Heure départ', 'Note']];
const HEAD_RETOURS = [['Client', 'Modèle', 'Immat.', 'Téléphone', 'Heure fin', 'Note', 'Reste à payer (MAD)']];

const backgroundDataUrl: { current: string | null } = { current: null };
const backgroundUrl = new URL('/images/A5.png', window.location.origin);

const loadBackground = async () => {
  if (backgroundDataUrl.current) return backgroundDataUrl.current;
  try {
    const response = await fetch(backgroundUrl.toString());
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Unable to read background image'));
      reader.readAsDataURL(blob);
    });
    backgroundDataUrl.current = dataUrl;
    return dataUrl;
  } catch {
    backgroundDataUrl.current = null;
    return null;
  }
};

const drawBackground = (doc: jsPDF, dataUrl?: string | null) => {
  if (!dataUrl) return;
  try {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.addImage(dataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  } catch {
    /* ignore background errors */
  }
};

type Filter = 'all' | 'start' | 'end' | undefined;

const baseTableOpts = () => ({
  margin: { left: PDF_STYLES.margin.left, right: PDF_STYLES.margin.right },
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

const rowsForDepart = (list: CalendarEvent[]) =>
  list.map((e) => ([
    e.title ?? '—',
    `${e.carModel?.brand ?? ''} ${e.carModel?.model ?? ''}`.trim() || '—',
    e.car?.license_plate ?? '—',
    e.client?.phone ?? '—',
    hhmm(e.start),
    e.note || '',
  ]));

const formatMadForPdf = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return '—';
  const normalized = typeof value === 'string'
    ? value.replace(/\//g, '').replace(/[^\d,.-]/g, '').replace(',', '.')
    : value;
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    .format(numeric);
};

const rowsForRetour = (list: CalendarEvent[]) =>
  list.map((e) => ([
    e.title ?? '—',
    `${e.carModel?.brand ?? ''} ${e.carModel?.model ?? ''}`.trim() || '—',
    e.car?.license_plate ?? '—',
    e.client?.phone ?? '—',
    hhmm(e.end),
    e.note || '',
    (e.reste_a_payer ?? 0) > 0
      ? formatMadForPdf(e.reste_a_payer ?? 0)
      : '—',
  ]));

export const buildCalendarPdf = async ({ currentDate, events, filter }: { currentDate: Date; events: CalendarEvent[]; filter?: Filter }) => {
  const background = await loadBackground();
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  drawBackground(doc, background);

  const dateStr = currentDate.toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const headerDate = currentDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  const starts = getStarts(events);
  const ends = getEnds(events);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Généré le ${headerDate}`, doc.internal.pageSize.getWidth() - PDF_STYLES.margin.right, PDF_STYLES.margin.top, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);

  const startTitleY = PDF_STYLES.margin.top + 90;
  const renderSection = (
    title: string,
    startY: number,
    head: any[],
    body: any[],
  ) => {
    doc.setTextColor(...PDF_STYLES.headerBlue);
    doc.text(title, PDF_STYLES.margin.left, startY);
    doc.setTextColor(0, 0, 0);
    (autoTable as any)(doc, {
      ...baseTableOpts(),
      startY: startY + 12,
      head,
      body,
    });
    return (doc as any).lastAutoTable?.finalY ?? (startY + 24);
  };

  if (!filter || filter === 'all') {
    doc.text(`Locations — ${dateStr}`, PDF_STYLES.margin.left, startTitleY);
    const afterDepart = renderSection('Départs', startTitleY + 30, HEAD_DEPARTS, rowsForDepart(starts));
    renderSection('Retours', afterDepart + 20, HEAD_RETOURS, rowsForRetour(ends));
  } else {
    const title = filter === 'start' ? 'Départs' : 'Retours';
    doc.text(`Locations — ${dateStr} — Filtre : ${title}`, PDF_STYLES.margin.left, startTitleY);
    const head = filter === 'start' ? HEAD_DEPARTS : HEAD_RETOURS;
    const rows = filter === 'start' ? rowsForDepart(starts) : rowsForRetour(ends);
    renderSection(title, startTitleY + 30, head, rows);
  }

  return doc;
};
