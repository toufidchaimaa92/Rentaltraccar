import React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rating, RatingButton } from '@/components/ui/shadcn-io/rating';
import type { PaymentSummary } from '@/hooks/useRentalCompletionFlow';

interface CompletionDialogsProps {
  showPaymentDialog: boolean;
  setShowPaymentDialog: (open: boolean) => void;
  paymentSummary: PaymentSummary | null;
  customPaymentAmount: string;
  setCustomPaymentAmount: (value: string) => void;
  paymentProcessing: boolean;
  paymentError: string | null;
  onSubmitPayment: (amount: number) => void;
  isAdmin: boolean;
  showRatingDialog: boolean;
  setShowRatingDialog: (open: boolean) => void;
  ratingValue: number;
  setRatingValue: (value: number) => void;
  clientNote: string;
  setClientNote: (value: string) => void;
  onFinalize: () => void;
  isUpdating: boolean;
  formatCurrency: (value: number | string | null | undefined) => string;
}

const ClientRating = ({
  value,
  onValueChange,
}: {
  value: number;
  onValueChange: (value: number) => void;
}) => (
  <div className="flex flex-col items-center gap-3">
    <Rating
      defaultValue={0}
      value={value}
      onValueChange={onValueChange}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <RatingButton
          key={index}
          className="text-yellow-500 fill-yellow-500"
        />
      ))}
    </Rating>
  </div>
);

export default function CompletionDialogs({
  showPaymentDialog,
  setShowPaymentDialog,
  paymentSummary,
  customPaymentAmount,
  setCustomPaymentAmount,
  paymentProcessing,
  paymentError,
  onSubmitPayment,
  isAdmin,
  showRatingDialog,
  setShowRatingDialog,
  ratingValue,
  setRatingValue,
  clientNote,
  setClientNote,
  onFinalize,
  isUpdating,
  formatCurrency,
}: CompletionDialogsProps) {
  return (
    <>
      {showPaymentDialog && paymentSummary && (
        <Dialog open={showPaymentDialog} onOpenChange={(open) => !open && setShowPaymentDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reste à payer</DialogTitle>
              <DialogDescription>
                Le solde doit être réglé pour finaliser la location.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatCurrency(paymentSummary.total)} MAD</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Déjà payé</span>
                  <span className="font-semibold">{formatCurrency(paymentSummary.paid)} MAD</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-amber-700">
                  <span className="font-semibold">Reste à payer</span>
                  <span className="font-semibold">{formatCurrency(paymentSummary.remaining)} MAD</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => onSubmitPayment(paymentSummary.remaining)}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? 'Traitement…' : 'Payer le reste'}
                </Button>

                <div className="rounded-lg border border-border p-4 space-y-3">
                  <label className="text-sm font-medium">Payer un montant personnalisé</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-border bg-card px-3 py-2 text-sm"
                    placeholder="Ex: 200"
                    value={customPaymentAmount}
                    onChange={(event) => setCustomPaymentAmount(event.target.value)}
                    disabled={paymentProcessing}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => onSubmitPayment(Number(customPaymentAmount))}
                    disabled={paymentProcessing}
                  >
                    Enregistrer le paiement
                  </Button>
                </div>
              </div>

              {paymentError && (
                <p className="text-sm font-semibold text-red-600">{paymentError}</p>
              )}
            </div>

            <DialogFooter>
              {isAdmin && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPaymentDialog(false)}
                  disabled={paymentProcessing}
                >
                  Marquer comme impayé
                </Button>
              )}
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={paymentProcessing}>
                  Fermer
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showRatingDialog && (
        <Dialog open={showRatingDialog} onOpenChange={(open) => !open && setShowRatingDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Évaluer le client</DialogTitle>
              <DialogDescription>
                Cette étape est optionnelle, mais recommandée avant de finaliser.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Note client</p>
                <ClientRating value={ratingValue} onValueChange={setRatingValue} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note client</label>
                <textarea
                  className="min-h-[80px] w-full rounded border border-border bg-card px-3 py-2 text-sm"
                  placeholder="Remarque sur le client"
                  value={clientNote}
                  onChange={(event) => setClientNote(event.target.value)}
                />
              </div>

            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Annuler
                </Button>
              </DialogClose>
              <Button type="button" onClick={onFinalize} disabled={isUpdating}>
                {isUpdating ? 'Finalisation…' : 'Finaliser la location'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
