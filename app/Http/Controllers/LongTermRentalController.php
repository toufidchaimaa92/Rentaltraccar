<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\CarModel;
use App\Models\Client;
use App\Models\LongTermInvoice;
use App\Models\Payment;
use App\Models\Rental;
use App\Models\CarBenefit;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\DocumentBackgroundService;
use Illuminate\Validation\ValidationException;

class LongTermRentalController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'cycle', 'sort']);
        $today = now()->startOfDay();

        $query = Rental::query()
            ->where('rental_type', 'long_term')
            ->with([
                'client',
                'carModel',
                'car',
                'invoices' => fn($q) => $q->orderBy('due_date'),
                'payments',
            ]);

        if ($filters['search'] ?? false) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('id', $search)
                    ->orWhereHas('client', function ($clientQuery) use ($search) {
                        $clientQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('carModel', function ($carModelQuery) use ($search) {
                        $carModelQuery->where('brand', 'like', "%{$search}%")
                            ->orWhere('model', 'like', "%{$search}%");
                    })
                    ->orWhereHas('car', function ($carQuery) use ($search) {
                        $carQuery->where('license_plate', 'like', "%{$search}%");
                    });
            });
        }

        if ($filters['cycle'] ?? false) {
            $cycle = $filters['cycle'];
            if ($cycle === 'custom') {
                $query->whereNotIn('payment_cycle_days', [30, 15, 10]);
            } else {
                $query->where('payment_cycle_days', (int) $cycle);
            }
        }

        $rentals = $query->get();

        $contracts = $rentals
            ->groupBy('client_id')
            ->map(fn($contractRentals) => $this->buildContractPayload($contractRentals, $today))
            ->values();

        if ($filters['status'] ?? false) {
            $contracts = $contracts->filter(function ($contract) use ($filters) {
                if (!($filters['status'] ?? false)) {
                    return true;
                }

                return $contract['overdue_status'] === $filters['status'];
            })->values();
        }

        $sort = $filters['sort'] ?? 'next_payment_due_date_asc';
        [$sortBy, $sortDir] = array_pad(explode('_', $sort), 2, 'asc');
        $direction = strtolower($sortDir) === 'desc' ? 'desc' : 'asc';

        $contracts = $contracts->sortBy($sortBy, SORT_REGULAR, $direction === 'desc')->values();

        $page = LengthAwarePaginator::resolveCurrentPage();
        $perPage = 10;
        $paginated = new LengthAwarePaginator(
            $contracts->forPage($page, $perPage),
            $contracts->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return Inertia::render('Rentals/LongTermIndex', [
            'rentals' => $paginated,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('Rentals/CreateLongTerm', [
            'carModels' => CarModel::with(['photos', 'cars'])->get(),
            'cars' => Car::with('carModel')->where('status', 'available')->get(),
            'clients' => Client::all(),
        ]);
    }

    public function show(Rental $rental)
    {
        if ($rental->rental_type !== 'long_term') {
            return redirect()->route('rentals.show', $rental->id);
        }

        $today = now()->startOfDay();

        $contractRentals = Rental::query()
            ->where('client_id', $rental->client_id)
            ->where('rental_type', 'long_term')
            ->with([
                'client',
                'carModel.photos',
                'car',
                'payments' => fn($q) => $q->orderByDesc('date'),
                'invoices' => fn($q) => $q->orderByDesc('due_date'),
            ])
            ->get();

        $contract = $this->buildContractPayload($contractRentals, $today, true);

        return Inertia::render('Rentals/LongTermShow', [
            'contract' => $contract,
            'primaryRentalId' => $rental->id,
        ]);
    }

    public function invoice(LongTermInvoice $invoice)
    {
        $invoice->load(['rental.client', 'rental.carModel', 'rental.car']);

        if (!$invoice->rental || $invoice->rental->rental_type !== 'long_term') {
            abort(404);
        }

        $today = now()->startOfDay();
        $invoiceDueDateString = $invoice->due_date ? Carbon::parse($invoice->due_date)->toDateString() : null;
        $contractRentals = Rental::query()
            ->where('client_id', $invoice->rental->client_id)
            ->where('rental_type', 'long_term')
            ->with(['client', 'carModel', 'car', 'invoices', 'payments'])
            ->get();

        $contract = $this->buildContractPayload($contractRentals, $today, true);
        $invoicePayload = $contract['invoices']->firstWhere('id', $invoice->id)
            ?? ($invoiceDueDateString ? $contract['invoices']->firstWhere('due_date', $invoiceDueDateString) : null)
            ?? $invoice;

        return Inertia::render('Rentals/LongTermInvoiceShow', [
            'invoice' => $invoicePayload,
            'contract' => $contract,
        ]);
    }

    public function downloadInvoice(LongTermInvoice $invoice)
    {
        $invoice->load(['rental.client', 'rental.carModel', 'rental.car']);

        if (!$invoice->rental || $invoice->rental->rental_type !== 'long_term') {
            abort(404);
        }

        $today = now()->startOfDay();
        $invoiceDueDateString = $invoice->due_date ? Carbon::parse($invoice->due_date)->toDateString() : null;
        $contractRentals = Rental::query()
            ->where('client_id', $invoice->rental->client_id)
            ->where('rental_type', 'long_term')
            ->with(['client', 'carModel', 'car', 'invoices'])
            ->get();

        $contract = $this->buildContractPayload($contractRentals, $today, true);
        $invoicePayload = $contract['invoices']->firstWhere('id', $invoice->id)
            ?? ($invoiceDueDateString ? $contract['invoices']->firstWhere('due_date', $invoiceDueDateString) : null)
            ?? $invoice;

        $pdf = Pdf::loadView('pdf.long_term_invoice', [
            'invoice' => $invoicePayload,
            'contract' => $contract,
            'bgImage' => DocumentBackgroundService::getDataUriFor(DocumentBackgroundService::TYPE_FACTURE),
        ]);

        return $pdf->download('facture-LLD-' . $invoice->id . '.pdf');
    }

    public function store(Request $request)
    {
        $rules = [
            'start_date' => 'required|date',
            'deposit' => 'nullable|numeric|min:0',
            'payment_cycle' => 'required|in:monthly,15_days,10_days,custom',
            'custom_cycle_days' => 'required_if:payment_cycle,custom|nullable|integer|min:1',
            'pro_rata_first_month' => 'boolean',
            'client_id' => 'nullable|exists:clients,id',
            'vehicles' => 'required|array|min:1',
            'vehicles.*.car_id' => 'required|exists:cars,id',
            'vehicles.*.car_model_id' => 'required|exists:car_models,id',
            'vehicles.*.monthly_price' => 'required|numeric|min:0.01',
            'vehicles.*.price_input_type' => 'required|in:ht,ttc',
            'driver_id' => 'nullable|exists:clients,id,client_type,individual',
            'driver.client_type' => 'nullable|in:individual',
            'driver.name' => 'nullable|string|max:255',
            'driver.company_name' => 'nullable|string|max:255',
            'driver.rc' => 'nullable|string|max:255',
            'driver.ice' => 'nullable|string|max:255',
            'driver.company_address' => 'nullable|string|max:255',
            'driver.contact_person' => 'nullable|string|max:255',
            'driver.contact_phone' => 'nullable|string|max:50',
            'driver.phone' => 'nullable|string|max:50',
            'driver.driver_name' => 'nullable|string|max:255',
            'driver.identity_card_number' => 'nullable|string|max:50',
            'driver.address' => 'nullable|string|max:255',
            'driver.license_number' => 'nullable|string|max:50',
            'driver.license_date' => 'nullable|date',
        ];

        if (!$request->filled('client_id')) {
            $rules = array_merge($rules, [
                'client_type' => 'required|in:individual,company',
                'client.name' => 'required|string|max:255',
                'client.phone' => 'required|string|max:50',
                'client.identity_card_number' => 'required_if:client_type,individual|nullable|string|max:50',
                'client.rc' => 'required_if:client_type,company|nullable|string|max:255',
                'client.address' => 'nullable|string|max:255',
                'client.license_number' => 'nullable|string|max:50',
                'client.license_date' => 'nullable|date',
                'client.license_expiration_date' => 'nullable|date',
                'client.company_name' => 'nullable|string|max:255',
                'client.ice' => 'nullable|string|max:255',
                'client.company_address' => 'nullable|string|max:255',
                'client.contact_person' => 'nullable|string|max:255',
                'client.contact_phone' => 'nullable|string|max:50',
            ]);
        }

        $validated = $request->validate($rules);

        $carIds = collect($validated['vehicles'])->pluck('car_id')->unique();
        $cars = Car::with('carModel')->whereIn('id', $carIds)->get();

        if ($cars->count() !== $carIds->count()) {
            return back()->withErrors(['vehicles' => 'Certaines voitures sélectionnées sont introuvables.']);
        }

        $unavailable = $cars->first(fn($car) => $car->status !== 'available');
        if ($unavailable) {
            return back()->withErrors(['vehicles' => 'Le véhicule ' . $unavailable->license_plate . ' n\'est pas disponible.']);
        }

        $cycleDays = match ($validated['payment_cycle']) {
            'monthly' => 30,
            '15_days' => 15,
            '10_days' => 10,
            default => (int) ($validated['custom_cycle_days'] ?? 30),
        };

        $client = $validated['client_id']
            ? Client::findOrFail($validated['client_id'])
            : Client::create([
                'client_type' => $validated['client_type'] ?? 'individual',
                'company_name' => $validated['client']['company_name'] ?? null,
                'rc' => $validated['client']['rc'] ?? null,
                'ice' => $validated['client']['ice'] ?? null,
                'company_address' => $validated['client']['company_address'] ?? null,
                'contact_person' => $validated['client']['contact_person'] ?? null,
                'contact_phone' => $validated['client']['contact_phone'] ?? null,
                'name' => $validated['client']['name'] ?? '',
                'phone' => $validated['client']['phone'] ?? '',
                'identity_card_number' => $validated['client']['identity_card_number'] ?? null,
                'address' => $validated['client']['address'] ?? null,
                'license_number' => $validated['client']['license_number'] ?? null,
                'license_date' => $validated['client']['license_date'] ?? null,
                'license_expiration_date' => $validated['client']['license_expiration_date'] ?? null,
            ]);

        $driverId = null;

        if (!empty($validated['driver_id'])) {
            $driver = Client::find((int) $validated['driver_id']);
            if ($driver && $driver->client_type !== 'individual') {
                throw ValidationException::withMessages([
                    'driver_id' => 'Le conducteur doit être un particulier.',
                ]);
            }

            $driverId = $driver?->id;
        } elseif (
            !empty($validated['driver']['name'] ?? null) &&
            !empty($validated['driver']['phone'] ?? null)
        ) {
            $driverPayload = [
                'client_type' => 'individual',
                'company_name' => null,
                'rc' => null,
                'ice' => null,
                'company_address' => null,
                'contact_person' => null,
                'contact_phone' => null,
                'driver_name' => $validated['driver']['driver_name'] ?? null,
                'name' => $validated['driver']['name'] ?? ($validated['driver']['driver_name'] ?? ''),
                'phone' => $validated['driver']['phone'] ?? '',
                'identity_card_number' => $validated['driver']['identity_card_number'] ?? null,
                'address' => $validated['driver']['address'] ?? null,
                'license_number' => $validated['driver']['license_number'] ?? null,
                'license_date' => $validated['driver']['license_date'] ?? null,
            ];

            $driver = Client::create($driverPayload);
            $driverId = $driver->id;
        }

        $primaryRental = null;

        DB::transaction(function () use (&$primaryRental, $validated, $client, $cars, $cycleDays, $driverId) {
            $startDate = Carbon::parse($validated['start_date']);
            $proRata = (bool) ($validated['pro_rata_first_month'] ?? false);

            foreach ($validated['vehicles'] as $index => $vehicle) {
                $car = $cars->firstWhere('id', $vehicle['car_id']);
                if (!$car) {
                    continue;
                }

                $priceInputType = $vehicle['price_input_type'] ?? 'ttc';
                $taxed = $this->calculateMonthlyAmounts((float) $vehicle['monthly_price'], $priceInputType);

                $rental = Rental::create([
                    'client_id' => $client->id,
                    'car_model_id' => $vehicle['car_model_id'] ?? $car->car_model_id,
                    'car_id' => $car->id,
                    'second_driver_id' => $driverId,
                    'rental_type' => 'long_term',
                    'start_date' => $startDate,
                    'end_date' => null,
                    'pickup_time' => null,
                    'return_time' => null,
                    'days' => 0,
                    'initial_price_per_day' => 0,
                    'price_per_day' => 0,
                    'monthly_price' => $taxed['ttc'],
                    'monthly_price_ht' => $taxed['ht'],
                    'monthly_tva_amount' => $taxed['tva_amount'],
                    'monthly_price_ttc' => $taxed['ttc'],
                    'deposit' => $index === 0 ? ($validated['deposit'] ?? null) : null,
                    'payment_cycle_days' => $cycleDays,
                    'pro_rata_first_month' => $proRata,
                    'tva_rate' => $taxed['tva_rate'],
                    'price_input_type' => $taxed['input_type'],
                    'global_discount' => 0,
                    'total_price' => $taxed['ttc'],
                    'manual_total' => null,
                    'status' => 'Active',
                    'confirmed_by_user_id' => Auth::id(),
                    'confirmed_at' => now(),
                ]);

                $car->update(['status' => 'rented']);

                $this->createInitialInvoices($rental, $startDate, $taxed['ttc'], $cycleDays, $proRata, $taxed);

                $primaryRental = $primaryRental ?: $rental;
            }
        });

        return redirect()->route('rentals.longTerm.show', $primaryRental->id)
            ->with('success', 'Long-term rental created successfully.');
    }

    public function recordPayment(Request $request, Rental $rental)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:cash,virement,cheque',
            'reference' => 'nullable|string|max:255',
            'invoice_id' => 'nullable|exists:long_term_invoices,id',
        ]);

        $paymentDate = now();

        $payment = Payment::create([
            'client_id' => $rental->client_id,
            'rental_id' => $rental->id,
            'user_id' => Auth::id(),
            'amount' => $validated['amount'],
            'method' => $validated['method'],
            'reference' => $validated['reference'] ?? null,
            'date' => $paymentDate,
        ]);

        $contractRentalIds = Rental::where('client_id', $rental->client_id)
            ->where('rental_type', 'long_term')
            ->pluck('id');

        $targetInvoice = null;
        if (!empty($validated['invoice_id'])) {
            $targetInvoice = LongTermInvoice::whereIn('rental_id', $contractRentalIds)
                ->find($validated['invoice_id']);
        } else {
            $targetInvoice = LongTermInvoice::whereIn('rental_id', $contractRentalIds)
                ->where('status', 'unpaid')
                ->orderBy('due_date')
                ->first();
        }

        $targetDueDate = $targetInvoice?->due_date ? Carbon::parse($targetInvoice->due_date) : null;

        if ($targetDueDate) {
            LongTermInvoice::whereIn('rental_id', $contractRentalIds)
                ->whereDate('due_date', $targetDueDate->toDateString())
                ->update([
                    'status' => 'paid',
                    'paid_at' => $paymentDate,
                ]);
        }

        $cycleDays = $rental->payment_cycle_days ?: 30;
        $nextDueBase = $targetDueDate
            ?: ($rental->next_payment_due_date
                ? Carbon::parse($rental->next_payment_due_date)
                : Carbon::parse($rental->start_date));

        $nextDue = $nextDueBase->copy()->addDays($cycleDays);

        Rental::whereIn('id', $contractRentalIds)->update([
            'last_payment_date' => $paymentDate,
            'next_payment_due_date' => $nextDue,
        ]);

        $rentals = Rental::whereIn('id', $contractRentalIds)->get();
        foreach ($rentals as $contractRental) {
            $monthly = $this->monthlyBreakdownFromRental($contractRental);

            $contractRental->invoices()->create([
                'amount_due' => $monthly['ttc'] ?: $validated['amount'],
                'due_date' => $nextDue,
                'status' => 'unpaid',
                'is_prorated' => false,
                'description' => 'Auto-generated invoice after payment',
            ]);

            [$periodStart, $periodEnd] = $this->benefitPeriodWindow(
                $nextDue,
                $contractRental->payment_cycle_days,
                $contractRental->start_date
            );

            $this->syncLongTermBenefitForPeriod(
                $contractRental,
                $periodStart,
                $periodEnd,
                (float) ($monthly['ttc'] ?: $validated['amount'])
            );
        }

        return redirect()->route('rentals.longTerm.show', $rental->id)
            ->with('success', 'Payment recorded and schedule updated.');
    }

    public function endRental(Request $request, Rental $rental)
    {
        $validated = $request->validate([
            'end_date' => 'required|date|after_or_equal:' . $rental->start_date,
        ]);

        $endDate = Carbon::parse($validated['end_date']);
        $monthly = $this->monthlyBreakdownFromRental($rental);
        $monthlyPrice = (float) ($monthly['ttc'] ?? 0);
        $daysInMonth = max(1, $endDate->daysInMonth);
        $proratedDays = $endDate->day;
        $finalAmount = $monthlyPrice > 0
            ? round(($monthlyPrice / $daysInMonth) * $proratedDays, 2)
            : 0;

        DB::transaction(function () use ($rental, $endDate, $finalAmount, $monthlyPrice) {
            if ($finalAmount > 0) {
                $rental->invoices()->create([
                    'amount_due' => $finalAmount,
                    'due_date' => $endDate,
                    'status' => 'unpaid',
                    'is_prorated' => true,
                    'description' => 'Final prorated invoice',
                ]);

                $this->syncLongTermBenefitForPeriod(
                    $rental,
                    $endDate->copy()->startOfMonth(),
                    $endDate->copy(),
                    (float) $finalAmount
                );
            }

            $rental->update([
                'end_date' => $endDate,
                'status' => 'Completed',
                'next_payment_due_date' => null,
            ]);

            if ($rental->car) {
                $rental->car->update(['status' => 'available']);
            }
        });

        return redirect()->route('rentals.longTerm.show', $rental->id)
            ->with('success', 'Long-term rental ended and final invoice generated.');
    }

    private function calculateMonthlyAmounts(float $inputAmount, string $inputType, float $tvaRate = 20.0): array
    {
        $normalizedType = $inputType === 'ht' ? 'ht' : 'ttc';
        $safeAmount = max(0, $inputAmount);
        $rate = $tvaRate > 0 ? $tvaRate : 20.0;

        if ($normalizedType === 'ttc') {
            $ttc = $safeAmount;
            $ht = round($ttc / (1 + ($rate / 100)), 2);
        } else {
            $ht = $safeAmount;
            $ttc = round($ht * (1 + ($rate / 100)), 2);
        }

        $tvaAmount = round($ttc - $ht, 2);

        return [
            'ht' => $ht,
            'ttc' => $ttc,
            'tva_amount' => $tvaAmount,
            'tva_rate' => $rate,
            'input_type' => $normalizedType,
        ];
    }

    private function monthlyBreakdownFromRental($rental): array
    {
        $rate = $rental->tva_rate ?? 20.0;
        $ht = $rental->monthly_price_ht;
        $ttc = $rental->monthly_price_ttc ?? $rental->monthly_price;

        if ($ht === null && $ttc !== null) {
            $ht = round($ttc / (1 + ($rate / 100)), 2);
        }

        if ($ttc === null && $ht !== null) {
            $ttc = round($ht * (1 + ($rate / 100)), 2);
        }

        $tvaAmount = ($ttc !== null && $ht !== null)
            ? round($ttc - $ht, 2)
            : 0;

        return [
            'ht' => $ht ?? 0,
            'ttc' => $ttc ?? 0,
            'tva_amount' => $tvaAmount,
            'tva_rate' => $rate,
            'input_type' => $rental->price_input_type ?? null,
        ];
    }

    private function createInitialInvoices(
        Rental $rental,
        Carbon $startDate,
        float $monthlyPrice,
        int $cycleDays,
        bool $proRata,
        ?array $taxed = null
    ): void
    {
        if ($proRata && $startDate->day !== 1) {
            $daysInMonth = $startDate->daysInMonth;
            $remainingDays = $daysInMonth - $startDate->day + 1;
            $proratedAmount = round(($monthlyPrice / $daysInMonth) * $remainingDays, 2);
            $prorataDue = $startDate->copy()->endOfMonth();

            $rental->invoices()->create([
                'amount_due' => $proratedAmount,
                'due_date' => $prorataDue,
                'status' => 'unpaid',
                'is_prorated' => true,
                'description' => 'Pro-rata first month',
            ]);

            $this->syncLongTermBenefitForPeriod(
                $rental,
                $startDate->copy(),
                $prorataDue->copy(),
                (float) $proratedAmount
            );

            $nextDue = $startDate->copy()->addMonthNoOverflow()->startOfMonth();
            $rental->update(['next_payment_due_date' => $nextDue]);

            $rental->invoices()->create([
                'amount_due' => $monthlyPrice,
                'due_date' => $nextDue,
                'status' => 'unpaid',
                'is_prorated' => false,
                'description' => 'Monthly invoice',
            ]);

            [$periodStart, $periodEnd] = $this->benefitPeriodWindow($nextDue, $cycleDays, $startDate);

            $this->syncLongTermBenefitForPeriod(
                $rental,
                $periodStart,
                $periodEnd,
                (float) $monthlyPrice
            );

            return;
        }

        $firstDue = $startDate->copy();

        $rental->update(['next_payment_due_date' => $firstDue->copy()->addDays($cycleDays)]);

        $rental->invoices()->create([
            'amount_due' => $monthlyPrice,
            'due_date' => $firstDue,
            'status' => 'unpaid',
            'is_prorated' => false,
            'description' => 'Initial invoice',
        ]);

        [$periodStart, $periodEnd] = $this->benefitPeriodWindow($firstDue, $cycleDays, $startDate);

        $this->syncLongTermBenefitForPeriod(
            $rental,
            $periodStart,
            $periodEnd,
            (float) $monthlyPrice
        );
    }

    private function syncLongTermBenefitForPeriod(
        Rental $rental,
        Carbon $periodStart,
        Carbon $periodEnd,
        float $amount
    ): void {
        if (!$rental->car_id || $amount <= 0) {
            return;
        }

        $days = max(1, $periodStart->diffInDays($periodEnd) + 1);

        CarBenefit::updateOrCreate(
            [
                'rental_id' => $rental->id,
                'car_id' => $rental->car_id,
                'start_date' => $periodStart->toDateString(),
                'end_date' => $periodEnd->toDateString(),
            ],
            [
                'amount' => $amount,
                'days' => $days,
            ]
        );
    }

    /**
     * Benefit period matches the same window used for invoice grouping:
     * period_end = invoice due_date, period_start = due_date - (cycleDays - 1),
     * clamped to rental start date when needed.
     */
    private function benefitPeriodWindow(Carbon $periodEnd, ?int $cycleDays, Carbon $fallbackStart): array
    {
        $cycle = max(1, (int) ($cycleDays ?: 30));
        $periodStart = $periodEnd->copy()->subDays($cycle - 1);

        if ($periodEnd->isSameDay($fallbackStart) || $periodStart->lt($fallbackStart)) {
            $periodStart = $fallbackStart->copy();
        }

        return [$periodStart, $periodEnd->copy()];
    }

    private function buildContractPayload($contractRentals, Carbon $today, bool $withInvoices = false)
    {
        $client = optional($contractRentals->first())->client?->toArray();

        $allInvoices = $contractRentals->flatMap(function ($rental) {
            return $rental->invoices->map(function ($invoice) use ($rental) {
                $invoice->setAttribute('rental_id', $rental->id);
                $invoice->setAttribute('car', $rental->car?->toArray());
                $invoice->setAttribute('carModel', $rental->carModel?->toArray());

                return $invoice;
            });
        });

        $earliestUnpaid = $allInvoices
            ->where('status', 'unpaid')
            ->sortBy('due_date')
            ->first();

        $overdueStatus = 'on_time';
        if ($earliestUnpaid && $earliestUnpaid->due_date) {
            $dueDate = Carbon::parse($earliestUnpaid->due_date)->startOfDay();
            if ($dueDate->lt($today)) {
                $overdueStatus = 'overdue';
            } elseif ($dueDate->between($today, $today->copy()->addDays(3))) {
                $overdueStatus = 'due_soon';
            }
        }

        $vehicles = $contractRentals->map(function ($rental) {
            $monthly = $this->monthlyBreakdownFromRental($rental);

            return [
                'id' => $rental->id,
                'start_date' => $rental->start_date,
                'end_date' => $rental->end_date,
                'status' => $rental->status,
                'monthly_price' => $monthly['ttc'],
                'monthly_price_ht' => $monthly['ht'],
                'monthly_tva_amount' => $monthly['tva_amount'],
                'monthly_price_ttc' => $monthly['ttc'],
                'tva_rate' => $monthly['tva_rate'],
                'price_input_type' => $monthly['input_type'],
                'payment_cycle_days' => $rental->payment_cycle_days,
                'car' => $rental->car?->toArray(),
                'carModel' => $rental->carModel?->toArray(),
            ];
        });

        $monthlyTotals = $vehicles->reduce(function ($carry, $vehicle) {
            return [
                'ht' => $carry['ht'] + ($vehicle['monthly_price_ht'] ?? 0),
                'tva' => $carry['tva'] + ($vehicle['monthly_tva_amount'] ?? 0),
                'ttc' => $carry['ttc'] + ($vehicle['monthly_price_ttc'] ?? 0),
            ];
        }, ['ht' => 0, 'tva' => 0, 'ttc' => 0]);

        $payments = $contractRentals
            ->flatMap(fn($rental) => $rental->payments)
            ->sortByDesc('date')
            ->values()
            ->map(function ($payment) {
                return [
                    ...$payment->toArray(),
                    'rental_id' => $payment->rental_id,
                ];
            });

        $invoicesPayload = collect();
        if ($withInvoices) {
            $invoicesPayload = $allInvoices
                ->groupBy(function ($invoice) {
                    return $invoice->due_date ? Carbon::parse($invoice->due_date)->toDateString() : 'no-date-' . $invoice->id;
                })
                ->map(function ($peerInvoices) use ($today) {
                    $primary = $peerInvoices->sortBy('id')->first();
                    $dueDate = $primary->due_date ? Carbon::parse($primary->due_date) : null;
                    $cycleDays = $primary->rental?->payment_cycle_days ?? 30;

                    $periodEnd = $dueDate?->copy();
                    $periodStart = $periodEnd?->copy()->subDays($cycleDays - 1);
                    if ($primary->is_prorated) {
                        $periodStart = $peerInvoices
                            ->pluck('rental.start_date')
                            ->filter()
                            ->map(fn($date) => Carbon::parse($date))
                            ->min() ?? $periodStart;
                    }

                    $vehicleLines = $peerInvoices->map(function ($peer) {
                        $monthly = $peer->rental ? $this->monthlyBreakdownFromRental($peer->rental) : [
                            'ht' => 0,
                            'ttc' => 0,
                            'tva_amount' => 0,
                            'tva_rate' => 20,
                        ];

                        $ratio = $monthly['ttc'] > 0 ? ($peer->amount_due / $monthly['ttc']) : 1;
                        $amountHt = round(($monthly['ht'] ?? 0) * $ratio, 2);
                        $tvaAmount = round($peer->amount_due - $amountHt, 2);

                        return [
                            'rental_id' => $peer->rental_id,
                            'car' => $peer->car,
                            'carModel' => $peer->carModel,
                            'amount' => $peer->amount_due,
                            'amount_ht' => $amountHt,
                            'tva_amount' => $tvaAmount,
                            'amount_ttc' => $peer->amount_due,
                            'tva_rate' => $monthly['tva_rate'] ?? 20,
                        ];
                    })->values();

                    $allPaid = $peerInvoices->every(fn($inv) => $inv->status === 'paid');
                    $statusLabel = $allPaid ? 'paid' : 'pending';

                    $severity = 'on_time';
                    if (!$allPaid && $periodEnd) {
                        if ($periodEnd->lte($today->copy()->subDays(5))) {
                            $severity = 'severely_overdue';
                        } elseif ($periodEnd->isPast()) {
                            $severity = 'overdue';
                        } elseif ($periodEnd->between($today, $today->copy()->addDays(3))) {
                            $severity = 'due_soon';
                        }
                    }

                    return [
                        ...$primary->toArray(),
                        'status' => $allPaid ? 'paid' : 'unpaid',
                        'status_label' => $statusLabel,
                        'period_start' => $periodStart,
                        'period_end' => $periodEnd,
                        'vehicles' => $vehicleLines,
                        'group_total' => $peerInvoices->sum('amount_due'),
                        'group_total_ht' => $vehicleLines->sum('amount_ht'),
                        'group_total_tva' => $vehicleLines->sum('tva_amount'),
                        'group_total_ttc' => $peerInvoices->sum('amount_due'),
                        'severity' => $severity,
                        'client' => $primary->rental?->client?->toArray(),
                        'car' => $primary->car,
                        'carModel' => $primary->carModel,
                        'invoice_ids' => $peerInvoices->pluck('id')->values(),
                    ];
                })
                ->sortByDesc('period_end')
                ->values();
        }

        return [
            'contract_id' => optional($contractRentals->first())->id,
            'client' => $client,
            'start_date' => $contractRentals->min('start_date'),
            'payment_cycle_days' => $contractRentals->first()?->payment_cycle_days,
            'monthly_total' => $monthlyTotals['ttc'],
            'monthly_total_ht' => $monthlyTotals['ht'],
            'monthly_total_tva' => $monthlyTotals['tva'],
            'monthly_total_ttc' => $monthlyTotals['ttc'],
            'deposit_total' => $contractRentals->sum('deposit'),
            'last_payment_date' => $contractRentals->max('last_payment_date'),
            'next_payment_due_date' => $contractRentals->whereNotNull('next_payment_due_date')->min('next_payment_due_date'),
            'overdue_status' => $overdueStatus,
            'vehicles_count' => $contractRentals->count(),
            'vehicles' => $vehicles->values(),
            'payments' => $payments->values(),
            'invoices' => $invoicesPayload->values(),
        ];
    }
}