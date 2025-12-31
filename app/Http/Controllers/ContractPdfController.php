<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\DocumentBackgroundService;

class ContractPdfController extends Controller
{
    public function generate(Request $request)
    {
        // (Optional) relax validation, we just pass-through fields you already render in React
        $data = $request->all();

        // Blade view should be the 2-page template we discussed
        $pdf = Pdf::loadView('contracts.pdf', [
            'rental' => $data,
            'bgImage' => DocumentBackgroundService::getDataUriFor(DocumentBackgroundService::TYPE_CONTRAT),
        ])->setPaper('a4');

        // Return the raw PDF as a download (no saving on disk)
        $filename = 'contrat-'.($data['id'] ?? 'document').'.pdf';
        return $pdf->download($filename);               // Content-Type: application/pdf + attachment
        // or: return $pdf->stream($filename);          // open in-tab instead of download
    }
}
