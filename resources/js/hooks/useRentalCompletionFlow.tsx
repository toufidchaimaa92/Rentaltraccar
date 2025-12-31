import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface PaymentSummary {
  total: number;
  paid: number;
  remaining: number;
}

export interface CompletionFlowItem {
  id: string | number;
  status?: string | null;
  paid_amount?: number | null;
  total_amount?: number | null;
  reste_a_payer?: number | null;
  has_payment_due?: boolean | null;
  payment_status?: string | null;
  client?: { id?: number | string } | null;
  client_id?: number | string | null;
}

interface UseRentalCompletionFlowOptions<T extends CompletionFlowItem> {
  selectedItem: T | null;
  setSelectedItem: Dispatch<SetStateAction<T | null>>;
  setItems: Dispatch<SetStateAction<T[]>>;
  onFinalizeStatus: (item: T, payload: { client_rating: number | null; client_note: string | null }) => void;
}

export const getPaymentSummary = (item: CompletionFlowItem | null): PaymentSummary => {
  const total = Number(item?.total_amount ?? 0);
  const paid = Number(item?.paid_amount ?? 0);
  const remaining = Math.max(Number(item?.reste_a_payer ?? total - paid), 0);
  return { total, paid, remaining };
};

const hasPaymentDue = (item: CompletionFlowItem | null) => {
  if (!item) return false;
  const paymentStatus = (item.payment_status || '').toLowerCase();
  const remaining = Number(item.reste_a_payer ?? 0);
  const total = Number(item.total_amount ?? 0);
  const paid = Number(item.paid_amount ?? 0);
  const hasPartialStatus = ['partial', 'due', 'unpaid'].includes(paymentStatus);
  const hasBalance = Number.isFinite(remaining) && remaining > 0;
  const hasTotalGap = Number.isFinite(total) && Number.isFinite(paid) && total > 0 && paid < total;

  return Boolean(item.has_payment_due) || hasBalance || hasTotalGap || hasPartialStatus;
};

export default function useRentalCompletionFlow<T extends CompletionFlowItem>({
  selectedItem,
  setSelectedItem,
  setItems,
  onFinalizeStatus,
}: UseRentalCompletionFlowOptions<T>) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [clientNote, setClientNote] = useState('');

  const paymentSummary = useMemo(
    () => (selectedItem ? getPaymentSummary(selectedItem) : null),
    [selectedItem]
  );

  const openCompletionFlow = (item: T) => {
    const { remaining } = getPaymentSummary(item);
    setSelectedItem(item);
    setPaymentError(null);
    if (remaining > 0 || hasPaymentDue(item)) {
      setShowPaymentDialog(true);
    } else {
      setShowRatingDialog(true);
    }
  };

  const submitPayment = (amount: number) => {
    if (!selectedItem) return;
    const { remaining } = getPaymentSummary(selectedItem);
    const amountNum = Number(amount);

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setPaymentError('Le montant doit être un nombre positif.');
      return;
    }

    if (amountNum > remaining) {
      setPaymentError('Le montant dépasse le reste à payer.');
      return;
    }

    const clientId = selectedItem.client?.id ?? selectedItem.client_id;
    if (!clientId) {
      setPaymentError('Impossible d’enregistrer le paiement : client introuvable.');
      return;
    }

    setPaymentProcessing(true);
    setPaymentError(null);

    const applyPaymentUpdate = (item: T, paidDelta: number) => {
      const { total, paid } = getPaymentSummary(item);
      const nextPaid = paid + paidDelta;
      const nextRemaining = Math.max(total - nextPaid, 0);

      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
              ...entry,
              paid_amount: nextPaid,
              reste_a_payer: nextRemaining,
              has_payment_due: nextRemaining > 0,
            }
            : entry
        )
      );

      setSelectedItem((prev) =>
        prev?.id === item.id
          ? {
            ...prev,
            paid_amount: nextPaid,
            reste_a_payer: nextRemaining,
            has_payment_due: nextRemaining > 0,
          }
          : prev
      );

      return nextRemaining;
    };

    router.post(
      '/payments',
      {
        rental_id: selectedItem.id,
        client_id: clientId,
        amount: amountNum,
        method: 'cash',
        reference: '',
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          const nextRemaining = applyPaymentUpdate(selectedItem, amountNum);
          setShowPaymentDialog(false);
          if (nextRemaining === 0) {
            setShowRatingDialog(true);
          }
        },
        onError: (errors: any) => {
          const first =
            errors?.message ||
            errors?.amount?.[0] ||
            errors?.client_id?.[0] ||
            errors?.rental_id?.[0] ||
            'Erreur lors de l’enregistrement du paiement.';
          setPaymentError(first);
        },
        onFinish: () => setPaymentProcessing(false),
      }
    );
  };

  const finalizeRental = () => {
    if (!selectedItem) return;
    const payload = {
      client_rating: ratingValue > 0 ? ratingValue : null,
      client_note: clientNote.trim() || null,
    };
    setShowRatingDialog(false);
    onFinalizeStatus(selectedItem, payload);
  };

  useEffect(() => {
    if (showPaymentDialog) {
      setCustomPaymentAmount('');
      setPaymentError(null);
    }
  }, [showPaymentDialog, selectedItem]);

  useEffect(() => {
    if (showRatingDialog) {
      setRatingValue(0);
      setClientNote('');
    }
  }, [showRatingDialog, selectedItem]);

  return {
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
  };
}