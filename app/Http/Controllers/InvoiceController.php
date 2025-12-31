<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    /**
     * Show invoice page for a payment
     */
    public function show(Payment $payment)
    {
        // Load all related data, including car & carModel
        $payment->load([
            'rental.client',
            'rental.car',
            'rental.carModel',
            'user',
            'client'
        ]);

        // Convert to array and fix key names like we do for RentalContractController
        $paymentArray = $payment->toArray();

        if (isset($paymentArray['rental']['car_model'])) {
            $paymentArray['rental']['carModel'] = $paymentArray['rental']['car_model'];
            unset($paymentArray['rental']['car_model']);
        }

        return Inertia::render('Payments/Invoice', [
            'payment' => $paymentArray,
        ]);
    }

    /**
     * Download invoice PDF
     */
    public function downloadPdf(Payment $payment)
    {
        $payment->load([
            'rental.client',
            'rental.car',
            'rental.carModel',
            'client',
            'user'
        ]);

        $pdf = \PDF::loadView('payments.invoice_pdf', compact('payment'));

        return $pdf->download("invoice_payment_{$payment->id}.pdf");
    }
}
