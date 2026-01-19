<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\CarModel;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Illuminate\Pagination\LengthAwarePaginator;

class CarController extends Controller
{
    public function index(Request $request)
    {
        $query = Car::with('carModel', 'benefits', 'expenses');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('carModel', function ($q2) use ($search) {
                    $q2->where('brand', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%");
                })
                    ->orWhere('license_plate', 'like', "%{$search}%")
                    ->orWhere('wwlicense_plate', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $sortParam = $request->input('sort', 'brand_asc');
        [$sortBy, $sortDir] = array_pad(explode('_', $sortParam), 2, null);

        $sortBy  = in_array($sortBy, ['brand', 'model', 'plate', 'status', 'benefit', 'expense', 'result']) ? $sortBy : 'brand';
        $sortDir = $sortDir === 'desc' ? 'desc' : 'asc';

        $allCars = $query->get();

        $allCars->transform(function (Car $car) {
            $startOfMonth = now()->startOfMonth();
            $endOfMonth   = now()->endOfMonth();

            // If your related models cast dates, you can skip these parses.
            $benefits = $car->benefits->map(function ($b) {
                $b->start_date = $b->start_date instanceof Carbon ? $b->start_date : Carbon::parse($b->start_date);
                $b->end_date   = $b->end_date   instanceof Carbon ? $b->end_date   : Carbon::parse($b->end_date);
                return $b;
            });

            $expenses = $car->expenses->map(function ($e) {
                $e->expense_date = $e->expense_date instanceof Carbon ? $e->expense_date : Carbon::parse($e->expense_date);
                return $e;
            });

            $monthlyBenefit = $benefits->sum(function ($b) use ($startOfMonth, $endOfMonth) {
                $benefitStart = $b->start_date->greaterThan($startOfMonth) ? $b->start_date : $startOfMonth;
                $benefitEnd   = $b->end_date->lessThan($endOfMonth) ? $b->end_date : $endOfMonth;

                if ($benefitStart->gt($benefitEnd)) {
                    return 0;
                }

                $days        = $benefitStart->diffInDays($benefitEnd) + 1;
                $dailyAmount = $b->days > 0 ? ($b->amount / $b->days) : 0;

                return $dailyAmount * $days;
            });

            $creditThisMonth   = $car->monthlyCreditForPeriod($startOfMonth, $endOfMonth);
            $insuranceMonthly  = round((float) ($car->assurancePrixMensuel() ?? 0.0), 2);

            $monthlyExpense = $expenses->filter(function ($e) use ($startOfMonth, $endOfMonth) {
                return $e->expense_date->between($startOfMonth, $endOfMonth);
            })->sum('amount') + $creditThisMonth + $insuranceMonthly;

            $car->monthly_benefit   = $monthlyBenefit;
            $car->monthly_expense   = $monthlyExpense;
            $car->monthly_result    = $monthlyBenefit - $monthlyExpense;
            $car->assurance_monthly = $insuranceMonthly;

            $car->expense_breakdown = [
                'credit'    => $creditThisMonth,
                'insurance' => $insuranceMonthly,
                'other'     => $monthlyExpense - $creditThisMonth - $insuranceMonthly,
            ];

            return $car;
        });

        $sortedCars = $allCars->sortBy(function (Car $car) use ($sortBy) {
            return match ($sortBy) {
                'brand'   => strtolower($car->carModel->brand ?? ''),
                'model'   => strtolower($car->carModel->model ?? ''),
                'plate'   => strtolower($car->license_plate ?? $car->wwlicense_plate ?? ''),
                'status'  => strtolower($car->status ?? ''),
                'benefit' => (float) ($car->monthly_benefit ?? 0),
                'expense' => (float) ($car->monthly_expense ?? 0),
                default   => (float) ($car->monthly_result ?? 0),
            };
        }, SORT_REGULAR, $sortDir === 'desc')->values();

        $perPage     = 15;
        $currentPage = $request->input('page', 1);
        $offset      = ($currentPage - 1) * $perPage;
        $total       = $sortedCars->count();
        $paginated   = $sortedCars->slice($offset, $perPage)->values();

        $printCars = $sortedCars->map(fn (Car $car) => [
            'id'              => $car->id,
            'car_model_id'    => $car->car_model_id,
            'status'          => $car->status,
            'car_model'       => [
                'brand'         => $car->carModel->brand ?? '',
                'model'         => $car->carModel->model ?? '',
                'fuel_type'     => $car->carModel->fuel_type ?? '',
                'transmission'  => $car->carModel->transmission ?? '',
                'finish'        => $car->carModel->finish ?? '',
                'price_per_day' => $car->carModel->price_per_day,
            ],
            'license_plate'   => $car->license_plate,
            'wwlicense_plate' => $car->wwlicense_plate,
        ])->values();

        $cars = new LengthAwarePaginator($paginated, $total, $perPage, $currentPage, [
            'path'  => $request->url(),
            'query' => $request->query(),
        ]);

        return Inertia::render('Cars/Index', [
            'cars'    => $cars,
            'filters' => $request->only(['search', 'status', 'sort']),
            'printCars' => $printCars,
        ]);
    }

    public function create()
    {
        $carModels = CarModel::all();
        return Inertia::render('Cars/CreateCar', compact('carModels'));
    }

    public function store(Request $request)
    {
        // Convert dd/mm/YYYY → YYYY-mm-dd before validation
        $request->merge([
            'credit_start_date' => $this->parseDate($request->credit_start_date),
            'credit_end_date'   => $this->parseDate($request->credit_end_date),
        ]);

        $validated = $request->validate([
            'car_model_id'          => 'required|exists:car_models,id',
            'license_plate'         => 'nullable|string|unique:cars,license_plate',
            'wwlicense_plate'       => 'nullable|string',
            'status'                => 'required|in:available,rented,reserved,maintenance',
            'mileage'               => 'nullable|integer|min:0',
            'traccar_device_id'     => 'nullable|integer|min:1',
            'purchase_price'        => 'nullable|numeric|min:0',
            'monthly_credit'        => 'nullable|numeric|min:0',
            'credit_start_date'     => 'nullable|date',
            'credit_end_date'       => 'nullable|date|after_or_equal:credit_start_date',
            'assurance_prix_annuel' => 'nullable|numeric|min:0',
        ]);

        $car = Car::create($validated);

        return redirect()
            ->route('car-models.show', $car->car_model_id)
            ->with('success', 'Car created successfully.');
    }

    public function show($id)
    {
        $car = Car::with(['benefits', 'expenses'])->findOrFail($id);

        $startOfMonth = now()->startOfMonth();
        $endOfMonth   = now()->endOfMonth();

        $benefits = $car->benefits->map(function ($b) {
            $b->start_date = $b->start_date instanceof Carbon ? $b->start_date : Carbon::parse($b->start_date);
            $b->end_date   = $b->end_date   instanceof Carbon ? $b->end_date   : Carbon::parse($b->end_date);
            return $b;
        });

        $expenses = $car->expenses->map(function ($e) {
            $e->expense_date = $e->expense_date instanceof Carbon ? $e->expense_date : Carbon::parse($e->expense_date);
            return $e;
        });

        $totalBenefit = $benefits->sum('amount');

        $monthlyBenefit = $benefits->sum(function ($b) use ($startOfMonth, $endOfMonth) {
            $benefitStart = $b->start_date->greaterThan($startOfMonth) ? $b->start_date : $startOfMonth;
            $benefitEnd   = $b->end_date->lessThan($endOfMonth) ? $b->end_date : $endOfMonth;

            if ($benefitStart->gt($benefitEnd)) {
                return 0;
            }

            $days        = $benefitStart->diffInDays($benefitEnd) + 1;
            $dailyAmount = $b->days > 0 ? ($b->amount / $b->days) : 0;

            return $dailyAmount * $days;
        });

        $creditThisMonth  = $car->monthlyCreditForPeriod($startOfMonth, $endOfMonth);
        $insuranceMonthly = round((float) ($car->assurancePrixMensuel() ?? 0.0), 2);

        $monthlyExpense = $expenses
            ->filter(fn($e) => $e->expense_date->between($startOfMonth, $endOfMonth))
            ->sum('amount');

        $monthlyExpense += $creditThisMonth + $insuranceMonthly;
        $monthlyResult   = $monthlyBenefit - $monthlyExpense;

        $car->assurance_monthly = $insuranceMonthly;

        return Inertia::render('Cars/Show', [
            'car' => $car,
            'totals' => [
                'monthlyBenefit'   => $monthlyBenefit,
                'totalBenefit'     => $totalBenefit,
                'monthlyExpense'   => $monthlyExpense,
                'monthlyResult'    => $monthlyResult,
                'creditThisMonth'  => $creditThisMonth,
                'insuranceMonthly' => $insuranceMonthly,
            ],
        ]);
    }

    public function edit($id)
    {
        $car = Car::findOrFail($id);
        $carModels = CarModel::all();

        // ❌ Don’t do: $car->credit_start_date = '22/04/2024' (will trigger casting)
        // ✅ Build a payload array with UI-formatted dates
        $payload = [
            'id'                     => $car->id,
            'car_model_id'           => $car->car_model_id,
            'license_plate'          => $car->license_plate,
            'wwlicense_plate'        => $car->wwlicense_plate,
            'status'                 => $car->status,
            'mileage'                => $car->mileage,
            'traccar_device_id'      => $car->traccar_device_id,
            'purchase_price'         => $car->purchase_price,
            'monthly_credit'         => $car->monthly_credit,
            'assurance_prix_annuel'  => $car->assurance_prix_annuel,

            // You can choose the format your UI expects:
            'insurance_expiry_date'        => optional($car->insurance_expiry_date)->format('Y-m-d'),
            'technical_check_expiry_date'  => optional($car->technical_check_expiry_date)->format('Y-m-d'),

            // UI strings (dd/mm/YYYY) without mutating the casted attributes
            'credit_start_date'      => $this->formatForUi($car->credit_start_date),
            'credit_end_date'        => $this->formatForUi($car->credit_end_date),
        ];

        return Inertia::render('Cars/EditCar', [
            'car'       => $payload,
            'carModels' => $carModels,
        ]);
    }

    public function update(Request $request, $id)
    {
        $car = Car::findOrFail($id);

        // Convert dd/mm/YYYY → YYYY-mm-dd before validation
        $request->merge([
            'credit_start_date' => $this->parseDate($request->credit_start_date),
            'credit_end_date'   => $this->parseDate($request->credit_end_date),
        ]);

        $validated = $request->validate([
            'car_model_id'          => 'required|exists:car_models,id',
            'license_plate'         => 'nullable|string|unique:cars,license_plate,' . $id,
            'wwlicense_plate'       => 'nullable|string',
            'status'                => 'required|in:available,rented,reserved,maintenance',
            'mileage'               => 'nullable|integer|min:0',
            'traccar_device_id'     => 'nullable|integer|min:1',
            'purchase_price'        => 'nullable|numeric|min:0',
            'monthly_credit'        => 'nullable|numeric|min:0',
            'credit_start_date'     => 'nullable|date',
            'credit_end_date'       => 'nullable|date|after_or_equal:credit_start_date',
            'assurance_prix_annuel' => 'nullable|numeric|min:0',
        ]);

        $car->update($validated);

        return redirect()
            ->route('car-models.show', $car->car_model_id)
            ->with('success', 'Car updated successfully.');
    }

    public function destroy($id)
    {
        $car = Car::findOrFail($id);
        $car->delete();

        return redirect()
            ->route('cars.index')
            ->with('success', 'Car deleted successfully.');
    }

    /** Convert dd/mm/YYYY → YYYY-mm-dd (DB format). */
    private function parseDate($date)
    {
        if (!$date) return null;
        try {
            return Carbon::createFromFormat('d/m/Y', trim((string)$date))->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /** Safely format a mixed date value for UI as dd/mm/YYYY without mutating the model. */
    private function formatForUi($value)
    {
        if (!$value) return null;

        if ($value instanceof Carbon) {
            return $value->format('d/m/Y');
        }

        $s = trim((string)$value);

        // Try common sources: DB format or already dd/mm/YYYY
        foreach (['Y-m-d', 'd/m/Y', 'd-m-Y'] as $fmt) {
            try {
                return Carbon::createFromFormat($fmt, $s)->format('d/m/Y');
            } catch (\Throwable $e) {}
        }

        // last resort: parsing
        try {
            return Carbon::parse($s)->format('d/m/Y');
        } catch (\Throwable $e) {
            return null;
        }
    }
}
