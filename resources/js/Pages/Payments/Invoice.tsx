import React from "react";
import AuthenticatedLayout from "@/layouts/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import {
  ReservationSummaryCard,
  ReservationSummaryItem,
} from "@/components/rentals/ReservationSummaryCard";
import { Printer } from "lucide-react";

export default function PaymentInvoice({ auth, payment }) {
  if (!payment) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  const rental = payment.rental || {};
  const client = payment.client || {};
  const carModel = rental.carModel || {};
  const remainingToPay =
    (rental.total_price || 0) - (payment.amount || 0);
  const invoiceDate = payment.date
    ? new Date(payment.date).toLocaleDateString("fr-FR")
    : new Date().toLocaleDateString("fr-FR");

  const summaryItems: ReservationSummaryItem[] = [
    { label: "Durée", value: `${rental.days || "—"} jour(s)` },
    { label: "Prix par jour", value: `${rental.price_per_day || "—"} MAD` },
  ];

  if (rental.extra_fee) {
    summaryItems.push({
      label: "Frais supplémentaires",
      value: `${rental.extra_fee} MAD`,
    });
  }

  summaryItems.push(
    {
      label: "Total de location",
      value: `${rental.total_price || "—"} MAD`,
      divider: true,
      valueClassName: "font-semibold",
    },
    { label: "Total payé", value: `${payment.amount || 0} MAD` },
    { label: "Reste à payer", value: `${remainingToPay} MAD` }
  );

  const handlePrint = () => window.print();

  return (
    <AuthenticatedLayout user={auth.user}>
      <style>{`
        .invoice-print-area {
          display: flex;
          flex-direction: column;
          width: 210mm;
          height: 297mm;
          padding: 12mm;
          background: white;
          box-sizing: border-box;
          overflow: hidden;
        }
        footer {
          margin-top: auto;
          border-top: 1px solid #d1d5db;
          padding-top: 1rem;
          text-align: center;
          font-size: 0.75rem;
          color: #6b7280;
        }
        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 297mm !important;
            width: 210mm !important;
            background: white !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden !important;
          }
          .invoice-print-area, .invoice-print-area * {
            visibility: visible !important;
          }
          .invoice-print-area {
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            padding: 12mm !important;
            background: white !important;
            overflow: hidden !important;
          }
          * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex justify-center min-h-screen">
        <div className="invoice-print-area border border-gray-300 shadow-lg">
          {/* Header */}
          <header className="mb-8 flex justify-between items-center border-b pb-4">
            <div className="text-lg font-bold text-foreground">Taliani Auto</div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground italic">
                Reçu de paiement #{payment.id}
              </div>
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="no-print"
              >
                <Printer className="w-4 h-4 mr-2" /> Imprimer
              </Button>
            </div>
          </header>

          <div className="text-sm">
            {/* Client Info */}
            <section className="mb-8">
              <div className="flex justify-between items-start border-b pb-1">
                <h2 className="font-bold text-foreground">Client</h2>
                <span className="text-muted-foreground text-sm">
                  Date de facture : {invoiceDate}
                </span>
              </div>
              <div className="flex flex-col space-y-1 mt-2">
                <span>{client.name || "—"}</span>
                <span>{client.phone || "—"}</span>
                <span>{client.address || "—"}</span>
              </div>
            </section>

            {/* Vehicle Info */}
            <section className="mb-8">
              <h2 className="font-bold mb-2 text-foreground border-b pb-1">
                Informations sur le véhicule
              </h2>
              <table className="w-full border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-1 text-left">Marque</th>
                    <th className="border border-gray-300 p-1 text-left">Modèle</th>
                    <th className="border border-gray-300 p-1 text-left">Finition</th>
                    <th className="border border-gray-300 p-1 text-left">Carburant</th>
                    <th className="border border-gray-300 p-1 text-left">Transmission</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-1">{carModel.brand || "—"}</td>
                    <td className="border border-gray-300 p-1">{carModel.model || "—"}</td>
                    <td className="border border-gray-300 p-1">{carModel.finish || "—"}</td>
                    <td className="border border-gray-300 p-1">{carModel.fuel_type || "—"}</td>
                    <td className="border border-gray-300 p-1">{carModel.transmission || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <ReservationSummaryCard
              items={summaryItems}
              variant="plain"
              className="mb-8"
              titleClassName="mb-2"
            />

            {/* Payment Details */}
            <section className="mb-8">
              <h2 className="font-bold mb-2 text-foreground border-b pb-1">
                Détails du paiement
              </h2>
              <p>Méthode : {payment.method || "—"}</p>
              {payment.method?.toLowerCase() !== "cash" && payment.reference && (
                <p>Référence : {payment.reference}</p>
              )}
            </section>
          </div>

          {/* Footer */}
          <footer>
            <p>Taliani Auto - Service de location de véhicules</p>
            <p>IF : 51820863 / TP : 27300518 / RC : 158687</p>
            <p>Adresse : 99 lot Haj Slimane CYM Rabat - Yacoub El Mansour</p>
            <p>Tél. : 06 30 04 40 28 / ICE : 003030322000030</p>
            <p className="mt-2">Merci pour votre confiance !</p>
          </footer>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
