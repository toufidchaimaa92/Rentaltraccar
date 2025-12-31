<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
// use Spatie\Browsershot\Browsershot; // ❌ remove this
use Barryvdh\DomPDF\Facade\Pdf;          // ✅ add this
use App\Services\DocumentBackgroundService;

class FactureController extends Controller
{
    public function index(Request $request)
    {
        $query = Facture::query()
            ->select('factures.*')
            ->selectSub(function ($sub) {
                $sub->from('facture_items')
                    ->whereColumn('facture_items.facture_id', 'factures.id')
                    ->selectRaw('COALESCE(SUM(quantity * unit_price), 0)');
            }, 'total_amount');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('client_name', 'like', '%' . $request->search . '%')
                  ->orWhere('invoice_number', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->month) {
            $query->whereMonth('created_at', $request->month);
        }

        if ($request->year) {
            $query->whereYear('created_at', $request->year);
        }

        if ($request->payment_status) {
            $query->where('payment_status', $request->payment_status);
        }

        $sort = $request->get('sort', 'created_at_desc');

        switch ($sort) {
            case 'invoice_number_asc':
                $query->orderBy('invoice_number')->orderByDesc('created_at');
                break;
            case 'invoice_number_desc':
                $query->orderByDesc('invoice_number')->orderByDesc('created_at');
                break;
            case 'client_name_asc':
                $query->orderBy('client_name')->orderByDesc('created_at');
                break;
            case 'client_name_desc':
                $query->orderByDesc('client_name')->orderByDesc('created_at');
                break;
            case 'total_amount_asc':
                $query->orderByRaw('COALESCE(total_amount, 0) asc')->orderByDesc('created_at');
                break;
            case 'total_amount_desc':
                $query->orderByRaw('COALESCE(total_amount, 0) desc')->orderByDesc('created_at');
                break;
            case 'payment_status_asc':
                $query->orderBy('payment_status')->orderByDesc('created_at');
                break;
            case 'payment_status_desc':
                $query->orderByDesc('payment_status')->orderByDesc('created_at');
                break;
            case 'created_at_asc':
                $query->orderBy('created_at')->orderBy('id');
                break;
            default:
                $query->orderByDesc('created_at')->orderByDesc('id');
        }

        $factures = $query->paginate(10)->withQueryString();

        $factures->getCollection()->transform(function ($facture) {
            $facture->total_amount = (float) $facture->total_amount;
            return $facture;
        });

        return Inertia::render('Factures/FactureListPage', [
            'factures' => $factures,
            'filters' => $request->only(['search', 'month', 'year', 'payment_status', 'sort']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Factures/FactureCreatePage');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string',
            'client_name' => 'required|string',
            'client_address' => 'nullable|string',
            'client_rc' => 'nullable|string',
            'client_ice' => 'nullable|string',
            'tax_rate' => 'required|numeric',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.period' => 'nullable|array',
            'items.*.period.from' => 'nullable|date',
            'items.*.period.to' => 'nullable|date',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $facture = Facture::create([
            ...$validated,
            'payment_status' => 'Pas encore payée',
        ]);

        foreach ($validated['items'] as $item) {
            $facture->items()->create([
                'description' => $item['description'],
                'period' => isset($item['period']) ? json_encode($item['period']) : null,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
            ]);
        }

        return redirect()->route('factures.show', $facture->id);
    }

    public function show(Facture $facture)
    {
        $facture->load('items');

        return Inertia::render('Factures/FacturePage', [
            'facture' => $facture,
        ]);
    }

    public function edit(Facture $facture)
    {
        $facture->load('items');

        $factureData = $facture->toArray();
        $factureData['items'] = $facture->items->map(function ($item) {
            $period = $item->period;

            if (is_string($period)) {
                $decoded = json_decode($period, true);
                $period = is_array($decoded) ? $decoded : null;
            }

            if ($period instanceof \stdClass) {
                $period = (array) $period;
            }

            $from = $period['from'] ?? null;
            $to = $period['to'] ?? null;

            return [
                'id' => $item->id,
                'description' => $item->description,
                'period' => [
                    'from' => $from ? substr($from, 0, 10) : null,
                    'to' => $to ? substr($to, 0, 10) : null,
                ],
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
            ];
        })->toArray();

        return Inertia::render('Factures/FactureEditPage', [
            'facture' => $factureData,
            'statuses' => ['Payée', 'Pas encore payée'],
        ]);
    }

    public function update(Request $request, Facture $facture)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string',
            'client_name' => 'required|string',
            'client_address' => 'nullable|string',
            'client_rc' => 'nullable|string',
            'client_ice' => 'nullable|string',
            'tax_rate' => 'required|numeric',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'payment_status' => 'required|string|in:Payée,Pas encore payée',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.period' => 'nullable|array',
            'items.*.period.from' => 'nullable|date',
            'items.*.period.to' => 'nullable|date',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($facture, $validated) {
            $items = $validated['items'];

            $facture->update([
                'invoice_number' => $validated['invoice_number'],
                'client_name' => $validated['client_name'],
                'client_address' => $validated['client_address'] ?? null,
                'client_rc' => $validated['client_rc'] ?? null,
                'client_ice' => $validated['client_ice'] ?? null,
                'tax_rate' => $validated['tax_rate'],
                'date' => $validated['date'],
                'notes' => $validated['notes'] ?? null,
                'payment_status' => $validated['payment_status'],
            ]);

            $facture->items()->delete();

            foreach ($items as $item) {
                $period = $item['period'] ?? null;
                $from = $period['from'] ?? null;
                $to = $period['to'] ?? null;

                $periodData = ($from || $to)
                    ? [
                        'from' => $from ?: null,
                        'to' => $to ?: null,
                    ]
                    : null;

                $facture->items()->create([
                    'description' => $item['description'],
                    'period' => $periodData ? json_encode($periodData) : null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
            }
        });

        return redirect()->route('factures.show', $facture->id)->with('success', 'Facture mise à jour.');
    }

    public function updatePaymentStatus(Request $request, Facture $facture)
    {
        $request->validate([
            'payment_status' => 'required|string|in:Payée,Pas encore payée',
        ]);

        $facture->update([
            'payment_status' => $request->payment_status,
        ]);

        return back()->with('success', 'Statut de paiement mis à jour.');
    }

    public function markAsPaid(Facture $facture)
    {
        $facture->update(['payment_status' => 'Payée']);

        return back()->with('success', 'Facture marquée comme payée.');
    }

    /**
     * Renouveler la facture.
     */
    public function renewFacture(Facture $facture, Request $request)
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date',
                'invoice_number' => 'nullable|string',
            ]);

            $oldDate = Carbon::parse($facture->date);
            $newDate = Carbon::parse($validated['date']);

            $monthsDelta = $oldDate->diffInMonths($newDate, false);
            $daysDelta   = $monthsDelta === 0 ? $oldDate->diffInDays($newDate, false) : 0;

            $newInvoiceNumber = $validated['invoice_number']
                ?: $this->nextAvailableInvoiceNumberFrom($facture->invoice_number);

            $facture->load('items');

            $newFactureData = $facture->replicate(['id','created_at','updated_at'])->toArray();
            $newFactureData['invoice_number'] = $newInvoiceNumber;
            $newFactureData['date'] = $validated['date'];
            $newFactureData['payment_status'] = 'Pas encore payée';

            DB::beginTransaction();

            $newFacture = Facture::create($newFactureData);

            foreach ($facture->items as $item) {
                $originalPeriodRaw = $item->period;
                $periodArr = null;

                if (is_array($originalPeriodRaw)) {
                    $periodArr = $originalPeriodRaw;
                } elseif (!empty($originalPeriodRaw)) {
                    $decoded = json_decode($originalPeriodRaw, true);
                    $periodArr = is_array($decoded) ? $decoded : null;
                }

                $newPeriod = null;

                if ($periodArr && (isset($periodArr['from']) || isset($periodArr['to']))) {
                    $from = !empty($periodArr['from']) ? Carbon::parse($periodArr['from']) : null;
                    $to   = !empty($periodArr['to'])   ? Carbon::parse($periodArr['to'])   : null;

                    if ($monthsDelta !== 0) {
                        if ($from) $from = $from->addMonthsNoOverflow($monthsDelta);
                        if ($to)   $to   = $to->addMonthsNoOverflow($monthsDelta);
                    } elseif ($daysDelta !== 0) {
                        if ($from) $from = $from->addDays($daysDelta);
                        if ($to)   $to   = $to->addDays($daysDelta);
                    }

                    $newPeriod = [
                        'from' => $from ? $from->utc()->format('Y-m-d\TH:i:s\Z') : null,
                        'to'   => $to   ? $to->utc()->format('Y-m-d\TH:i:s\Z') : null,
                    ];
                }

                $newFacture->items()->create([
                    'description' => $item->description,
                    'period'      => $newPeriod ? json_encode($newPeriod) : $originalPeriodRaw,
                    'quantity'    => $item->quantity,
                    'unit_price'  => $item->unit_price,
                ]);
            }

            DB::commit();

            if ($request->header('X-Inertia')) {
                return Inertia::location(route('factures.show', $newFacture->id));
            }
            return redirect()->route('factures.show', $newFacture->id);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Erreur de validation: ' . implode(', ', collect($e->errors())->flatten()->toArray()));
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->with('error', 'Erreur lors du renouvellement de la facture: ' . $e->getMessage());
        }
    }

    protected function generateNextInvoiceNumber()
    {
        try {
            $lastFacture = Facture::orderBy('invoice_number', 'desc')->first();

            if (!$lastFacture || !is_numeric($lastFacture->invoice_number)) {
                return '0001';
            }

            $lastNumber = (int) $lastFacture->invoice_number;
            return str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } catch (\Exception $e) {
            return '0001';
        }
    }

    protected function incrementInvoiceNumberLike(?string $seed): ?string
    {
        if (!is_string($seed) || $seed === '') return null;

        if (preg_match('/^(.*?)(\d+)$/', $seed, $m)) {
            $prefix = $m[1];
            $digits = $m[2];
            $width  = strlen($digits);
            $next   = str_pad(((int) $digits) + 1, $width, '0', STR_PAD_LEFT);
            return $prefix . $next;
        }

        if (ctype_digit($seed)) {
            $width = strlen($seed);
            return str_pad(((int) $seed) + 1, $width, '0', STR_PAD_LEFT);
        }

        return null;
    }

    protected function nextAvailableInvoiceNumberFrom(?string $seed): string
    {
        $candidate = $this->incrementInvoiceNumberLike($seed) ?? $this->generateNextInvoiceNumber();

        while (Facture::where('invoice_number', $candidate)->exists()) {
            $next = $this->incrementInvoiceNumberLike($candidate);
            if ($next === null) {
                $next = $this->generateNextInvoiceNumber();
            }
            $candidate = $next;
        }

        return $candidate;
    }

    /**
     * Download invoice as PDF (DOMPDF)
     */
    public function downloadPdf(Facture $facture)
    {
        try {
            if (!$facture || !$facture->exists) {
                abort(404, 'Facture non trouvée');
            }

            $facture->load('items');

            $bgData = DocumentBackgroundService::getDataUriFor(DocumentBackgroundService::TYPE_FACTURE);

            $itemsTotal = (float) $facture->items->sum(fn($i) => (float)$i->quantity * (float)$i->unit_price);
            $taxRate    = (float) ($facture->tax_rate ?? 0);
            $taxAmount  = round($itemsTotal * $taxRate / 100, 2);
            $grandTotal = round($itemsTotal + $taxAmount, 2);

            $html = view('factures.pdf', [
                'facture'     => $facture,
                'bgImage'     => $bgData,
                'itemsTotal'  => $itemsTotal,
                'taxRate'     => $taxRate,
                'taxAmount'   => $taxAmount,
                'grandTotal'  => $grandTotal,
                'title'       => 'Facture',
            ])->render();

            $filename = 'facture-' . ($facture->invoice_number ?? $facture->id) . '.pdf';
            $pdfPath  = storage_path('app/' . $filename);

            // === DOMPDF ===
            $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');

            // Useful options
            $dompdf = $pdf->getDomPDF();
            $dompdf->set_option('isRemoteEnabled', true);
            $dompdf->set_option('isHtml5ParserEnabled', true);
            $dompdf->set_option('isPhpEnabled', true);

            file_put_contents($pdfPath, $pdf->output());

            return response()->file($pdfPath, [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
            ]);
        } catch (\Throwable $e) {
            Log::error('Invoice PDF (DOMPDF) failed', [
                'facture_id' => $facture->id ?? null,
                'error'      => $e->getMessage(),
            ]);

            if (config('app.debug')) {
                return response()->make(
                    "<pre>PDF ERROR (DOMPDF):\n".$e->getMessage()."</pre>",
                    500
                );
            }
            return back()->with('error', "Impossible de générer le PDF de la facture.");
        }
    }
}
