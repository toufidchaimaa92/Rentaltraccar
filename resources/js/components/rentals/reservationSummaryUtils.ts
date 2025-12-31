import { ReservationSummaryItem } from "./ReservationSummaryCard";

type PricingSummaryLabels = {
  estimatedPerDay?: string;
  initialPricePerDay?: string;
  effectivePricePerDay?: string;
  subtotal?: string;
  globalDiscount?: string;
  total?: string;
  totalManual?: string;
  advancePayment?: string;
  remaining?: string;
};

type PricingSummaryClassNames = {
  perDay?: string;
  discount?: string;
  total?: string;
  advance?: string;
  remaining?: string;
};

type PricingSummaryOptions = {
  manual: boolean;
  days: number;
  currency?: string;
  initialPricePerDay?: number | null;
  effectivePricePerDay?: number | null;
  subtotal?: number | null;
  globalDiscount?: number | null;
  totalAmount: number;
  estimatedPerDay?: number | null;
  advancePayment?: number | null;
  remainingToPay?: number | null;
  subtotalLabel?: string;
  labels?: PricingSummaryLabels;
  classNames?: PricingSummaryClassNames;
  valueFormatter?: (value: number) => string;
  includeInitialPriceRow?: boolean;
  includeEffectivePriceRow?: boolean;
  includeSubtotalRow?: boolean;
  includeDiscountRow?: boolean;
};

const isFiniteNumber = (value?: number | null): value is number =>
  value !== null && value !== undefined && Number.isFinite(value);

export function buildPricingSummaryItems({
  manual,
  days,
  currency = "DH",
  initialPricePerDay,
  effectivePricePerDay,
  subtotal,
  globalDiscount,
  totalAmount,
  estimatedPerDay,
  advancePayment,
  remainingToPay,
  subtotalLabel,
  labels = {},
  classNames = {},
  valueFormatter,
  includeInitialPriceRow = true,
  includeEffectivePriceRow = true,
  includeSubtotalRow = true,
  includeDiscountRow = true,
}: PricingSummaryOptions): ReservationSummaryItem[] {
  const formatValue = (value: number) =>
    valueFormatter ? valueFormatter(value) : `${value.toFixed(0)} ${currency}`;

  const items: ReservationSummaryItem[] = [];

  if (!manual && includeInitialPriceRow && isFiniteNumber(initialPricePerDay)) {
    items.push({
      label: labels.initialPricePerDay ?? "Prix initial / jour",
      value: formatValue(initialPricePerDay),
    });
  }

  if (manual && isFiniteNumber(estimatedPerDay) && days > 0) {
    items.push({
      label: labels.estimatedPerDay ?? "Prix estimé / jour",
      value: formatValue(estimatedPerDay),
      valueClassName: classNames.perDay ?? "font-medium text-blue-600",
    });
  }

  if (!manual && includeEffectivePriceRow && isFiniteNumber(effectivePricePerDay)) {
    items.push({
      label: labels.effectivePricePerDay ?? "Prix effectif / jour",
      value: formatValue(effectivePricePerDay),
      valueClassName: classNames.perDay ?? "font-medium text-blue-600",
    });
  }

  if (!manual && includeSubtotalRow && isFiniteNumber(subtotal)) {
    items.push({
      label: subtotalLabel ?? labels.subtotal ?? "Sous-total",
      value: formatValue(subtotal),
      divider: true,
      valueClassName: "font-semibold",
    });
  }

  if (
    !manual &&
    includeDiscountRow &&
    isFiniteNumber(globalDiscount) &&
    globalDiscount > 0
  ) {
    items.push({
      label: labels.globalDiscount ?? "Remise globale",
      value: `-${formatValue(globalDiscount)}`,
      valueClassName: classNames.discount ?? "font-medium text-red-600",
    });
  }

  items.push({
    label: manual ? labels.totalManual ?? "Total (manuel)" : labels.total ?? "Total après remise",
    value: formatValue(totalAmount),
    divider: true,
    valueClassName: classNames.total ?? "font-semibold text-lg",
  });

  if (isFiniteNumber(advancePayment) && advancePayment > 0) {
    items.push({
      label: labels.advancePayment ?? "Avance payée",
      value: `-${formatValue(advancePayment)}`,
      valueClassName: classNames.advance ?? "font-medium text-green-600",
    });
  }

  if (isFiniteNumber(remainingToPay)) {
    items.push({
      label: labels.remaining ?? "Reste à payer",
      value: formatValue(remainingToPay),
      divider: true,
      valueClassName: classNames.remaining ?? "font-bold text-lg text-orange-600",
    });
  }

  return items;
}

