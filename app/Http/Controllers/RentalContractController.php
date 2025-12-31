<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf; // ✅ add
use App\Services\DocumentBackgroundService;

class RentalContractController extends Controller
{
    /**
     * Show rental contract page (Inertia)
     */
    public function show(Rental $rental)
    {
        $rental->load([
            'client',
            'secondDriver',
            'car',
            'carModel',
            'user',
            'extensions',
            'payments',
            'carChanges',
        ]);

        $rentalArray = $rental->toArray();

        // Normalize keys for your front-end
        if (isset($rentalArray['car_model'])) {
            $rentalArray['carModel'] = $rentalArray['car_model'];
            unset($rentalArray['car_model']);
        }

        if (isset($rentalArray['second_driver'])) {
            $rentalArray['secondDriver'] = $rentalArray['second_driver'];
            unset($rentalArray['second_driver']);
        } else {
            $rentalArray['secondDriver'] = null;
        }

        return Inertia::render('Rentals/Contract', [
            'rental' => $rentalArray,
        ]);
    }

    /**
     * Download contract as PDF (DOMPDF)
     */
    public function downloadPdf(Rental $rental)
    {
        try {
            if (!$rental || !$rental->exists) {
                abort(404, 'Rental not found');
            }

            // Relations nécessaires au PDF (+ extensions + somme des paiements)
            $rental->load(['client','secondDriver','car','carModel','user','extensions'])
                   ->loadSum('payments','amount');

            $bgData = DocumentBackgroundService::getDataUriFor(DocumentBackgroundService::TYPE_CONTRAT);

            // Montants globaux (au cas où pas d’extension)
            $totalPaid   = (float) ($rental->payments_sum_amount ?? 0);
            $days        = (int)   ($rental->days ?? 0);
            $pricePerDay = (float) ($rental->price_per_day ?? 0);
            $totalPrice  = (float) ($rental->total_price ?? ($days * $pricePerDay));
            $remainingToPay = max($totalPrice - $totalPaid, 0);

            // Deuxième conducteur ?
            $hasSecondDriver = !empty($rental->secondDriver) && $rental->secondDriver->id;

            // -------- Extension uniquement (on prend la DERNIÈRE)
            $lastExt = optional($rental->extensions)->last();

            $extensionDays  = null; // durée ajoutée (ex: 2)
            $extensionTotal = null; // total de l’extension (ex: 200)

            if ($lastExt) {
                // 1) Durée d’extension
                if (!is_null($lastExt->extension_days)) {
                    $extensionDays = (int) $lastExt->extension_days;
                } else {
                    try {
                        $oldEnd = Carbon::parse($lastExt->old_end_date);
                        $newEnd = Carbon::parse($lastExt->new_end_date);
                        $extensionDays = max($oldEnd->diffInDays($newEnd, false), 0);
                    } catch (\Throwable $e) {
                        $extensionDays = null;
                    }
                }

                // 2) Total extension
                if (!is_null($lastExt->ext_segment_total)) {
                    $extensionTotal = (float) $lastExt->ext_segment_total;
                } elseif (!is_null($lastExt->price_delta)) {
                    $extensionTotal = (float) $lastExt->price_delta;
                } elseif (!is_null($lastExt->new_total) && !is_null($lastExt->old_total)) {
                    $extensionTotal = (float) $lastExt->new_total - (float) $lastExt->old_total;
                } else {
                    $extensionTotal = null;
                }
            }

            // Flag pour le Blade : si extension existe, on n’affiche QUE extension (durée + total extension)
            $showExtensionOnly = (bool) $lastExt;

            // ----- Render HTML (server-side)
            $html = view('contracts.pdf', [
                'rental'             => $rental,
                'bgImage'            => $bgData,
                'title'              => 'Contrat de location',
                // Globaux (fallback si pas d’extension)
                'totalPaid'          => $totalPaid,
                'remainingToPay'     => $remainingToPay,
                'days'               => $days,
                'hasSecondDriver'    => (bool) $hasSecondDriver,

                // Extension-only
                'showExtensionOnly'  => $showExtensionOnly,
                'extensionDays'      => $extensionDays,
                'extensionTotal'     => $extensionTotal,
                'lastExtension'      => $lastExt,
            ])->render();

            // (Optionnel) garder l'HTML pour debug
            Storage::disk('local')->put('debug-contract.html', $html);

            $filename = 'contrat-' . ($rental->id ?? 'document') . '.pdf';
            $pdfPath  = storage_path('app/' . $filename);

            // === DOMPDF ===
            $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

            // Options utiles
            $dompdf = $pdf->getDomPDF();
            $dompdf->set_option('isRemoteEnabled', true);      // permet les images/ressources externes
            $dompdf->set_option('isHtml5ParserEnabled', true); // un peu mieux pour CSS moderne
            $dompdf->set_option('isPhpEnabled', true);         // si vous utilisez du PHP dans les vues (rare)

            // Sauvegarder puis afficher inline
            file_put_contents($pdfPath, $pdf->output());

            return response()->file($pdfPath, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
            ]);

        } catch (\Throwable $e) {
            Log::error('Contract PDF (DOMPDF) failed', [
                'rental_id' => $rental->id ?? null,
                'error'     => $e->getMessage(),
            ]);

            if (config('app.debug')) {
                return response()->make(
                    "<pre>PDF ERROR (DOMPDF):\n".$e->getMessage()."\n\nCheck storage/logs/laravel.log</pre>",
                    500
                );
            }
            return back()->with('error', "Impossible de générer le PDF du contrat.");
        }
    }
}
