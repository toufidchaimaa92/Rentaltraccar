<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\Client;
use App\Models\Car;
use App\Models\CarModel;
use App\Models\CarBenefit;
use App\Models\Payment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class RentalController extends Controller
{
    /**
     * Focused DEBUG helper for updateStatus only.
     * Logs only when APP_DEBUG=true to avoid noisy prod logs.
     */
    private function debugStatus(string $where, array $ctx = []): void
    {
        if (!config('app.debug')) return;
        Log::debug("[Rental::updateStatus:$where]", $ctx);
    }

    // Liste toutes les locations avec recherche par plage de dates améliorée
    public function index(Request $request)
    {
        $query = Rental::with(['client', 'secondDriver', 'car', 'carModel', 'user', 'confirmedBy', 'payments'])
            ->where('rental_type', '!=', 'long_term');

        if ($request->start_date && $request->end_date) {
            $searchStartDate = Carbon::parse($request->start_date)->format('Y-m-d');
            $searchEndDate = Carbon::parse($request->end_date)->format('Y-m-d');
            $query->where(function ($q) use ($searchStartDate, $searchEndDate) {
                $q->whereDate('start_date', '<=', $searchEndDate)
                  ->whereDate('end_date', '>=', $searchStartDate);
            });
        } elseif ($request->start_date && !$request->end_date) {
            $searchDate = Carbon::parse($request->start_date)->format('Y-m-d');
            $query->where(function ($q) use ($searchDate) {
                $q->whereDate('start_date', '<=', $searchDate)
                  ->whereDate('end_date', '>=', $searchDate);
            });
        } elseif (!$request->start_date && $request->end_date) {
            $searchDate = Carbon::parse($request->end_date)->format('Y-m-d');
            $query->where(function ($q) use ($searchDate) {
                $q->whereDate('start_date', '<=', $searchDate)
                  ->whereDate('end_date', '>=', $searchDate);
            });
        }

        if ($request->status && $request->status !== 'all' && $request->status !== 'All Status') {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('id', $term)
                    ->orWhere('status', 'like', "%{$term}%")
                    ->orWhereHas('client', function ($clientQuery) use ($term) {
                        $clientQuery->where('name', 'like', "%{$term}%")
                            ->orWhere('phone', 'like', "%{$term}%");
                    })
                    ->orWhereHas('carModel', function ($carModelQuery) use ($term) {
                        $carModelQuery->where('brand', 'like', "%{$term}%")
                            ->orWhere('model', 'like', "%{$term}%");
                    })
                    ->orWhereHas('car', function ($carQuery) use ($term) {
                        $carQuery->where('license_plate', 'like', "%{$term}%");
                    });
            });
        }

        if ($request->client_search) {
            $query->whereHas('client', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->client_search . '%')
                  ->orWhere('phone', 'like', '%' . $request->client_search . '%');
            });
        }

        if ($request->car_search) {
            $query->whereHas('carModel', function ($q) use ($request) {
                $q->where('brand', 'like', '%' . $request->car_search . '%')
                  ->orWhere('model', 'like', '%' . $request->car_search . '%');
            });
        }

        if ($request->license_plate_search) {
            $query->whereHas('car', function ($q) use ($request) {
                $q->where('license_plate', 'like', '%' . $request->license_plate_search . '%');
            });
        }

        $sort = $request->get('sort', 'id_desc');

        switch ($sort) {
            case 'id_asc':
                $query->orderBy('id');
                break;
            case 'id_desc':
                $query->orderByDesc('id');
                break;
            case 'status_desc':
                $query->orderByDesc('status')->orderByDesc('start_date');
                break;
            case 'start_date_asc':
                $query->orderBy('start_date')->orderBy('id');
                break;
            case 'start_date_desc':
                $query->orderByDesc('start_date')->orderBy('id');
                break;
            default:
                $query->orderByDesc('id');
        }

        $rentals = $query
            ->paginate(10)
            ->withQueryString();

        $rentals->getCollection()->transform(function ($rental) {
            return [
                'id' => $rental->id,
                'client' => $rental->client ? [
                    'id' => $rental->client->id,
                    'name' => $rental->client->name,
                ] : null,
                'second_driver' => $rental->secondDriver ? [
                    'id' => $rental->secondDriver->id,
                    'name' => $rental->secondDriver->name,
                ] : null,
                'car' => $rental->car ? [
                    'id' => $rental->car->id,
                    'model' => $rental->car->model,
                    'license_plate' => $rental->car->license_plate,
                ] : null,
                'carModel' => $rental->carModel ? [
                    'brand' => $rental->carModel->brand,
                    'model' => $rental->carModel->model,
                ] : null,
                'user' => $rental->user ? $rental->user->name : '—',
                'confirmed_by' => $rental->confirmedBy ? $rental->confirmedBy->name : null,
                'start_date' => $rental->start_date,
                'end_date' => $rental->end_date,
                'total_price' => $rental->total_price,
                'manual_total' => $rental->manual_total,
                'effective_total' => $rental->effective_total,
                'status' => $rental->status,
                'payments' => $rental->payments ? $rental->payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'method' => $payment->method,
                        'date' => $payment->date,
                    ];
                }) : [],
            ];
        });

        return Inertia::render('Rentals/Index', [
            'rentals' => $rentals,
            'filters' => [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'exact_start_date' => $request->exact_start_date,
                'exact_end_date' => $request->exact_end_date,
                'status' => $request->status,
                'search' => $request->search,
                'sort' => $sort,
                'client_search' => $request->client_search,
                'car_search' => $request->car_search,
                'license_plate_search' => $request->license_plate_search,
            ],
        ]);
    }

    public function getRentalsForDate(Request $request)
    {
        $request->validate(['date' => 'required|date']);

        $date = $request->date;

        $rentals = Rental::with(['client', 'carModel', 'car'])
            ->where(function ($query) use ($date) {
                $query->whereDate('start_date', '<=', $date)
                      ->whereDate('end_date', '>=', $date);
            })
            ->get();

        return response()->json([
            'date' => $date,
            'rentals' => $rentals->map(function ($rental) {
                return [
                    'id' => $rental->id,
                    'client_name' => $rental->client->name ?? 'N/A',
                    'car_info' => ($rental->carModel->brand ?? '') . ' ' . ($rental->carModel->model ?? ''),
                    'license_plate' => $rental->car->license_plate ?? 'N/A',
                    'status' => $rental->status,
                    'start_date' => $rental->start_date,
                    'end_date' => $rental->end_date,
                ];
            }),
            'count' => $rentals->count(),
        ]);
    }

public function updateStatus(Request $request, Rental $rental)
    {
        $this->debugStatus('entry', [
            'rental_id'      => $rental->id,
            'current_status' => $rental->status,
            'car_id'         => $rental->car_id,
            'request'        => $request->only(['status','car_id']),
        ]);

        // Validation: required_if car_id when activating
        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,active,completed,cancelled',
            'car_id' => 'required_if:status,active|nullable|exists:cars,id',
            'client_rating' => 'nullable|integer|min:1|max:5',
            'client_note' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();
            $this->debugStatus('tx.begin');

            if ($validated['status'] === 'active') {
                $rental->update([
                    'car_id'     => $validated['car_id'],
                    'status'     => 'active',
                    'updated_at' => now(),
                ]);

                $car = Car::find($validated['car_id']);
                if ($car) {
                    $car->update(['status' => 'rented']);
                }

                $existingBenefit = CarBenefit::where('rental_id', $rental->id)
                    ->where('car_id', $rental->car_id)
                    ->first();

                if (!$existingBenefit && $rental->effective_total > 0) {
                    CarBenefit::create([
                        'rental_id' => $rental->id,
                        'car_id'    => $rental->car_id,
                        'amount'    => $rental->effective_total,
                        'start_date'=> $rental->start_date,
                        'end_date'  => $rental->end_date,
                        'days'      => $rental->days,
                    ]);
                }
            } else {
                $rental->update([
                    'status'     => $validated['status'],
                    'updated_at' => now(),
                ]);
            }

            // Post-processing if completed
            if (strtolower($validated['status']) === 'completed' && $rental->car_id) {
                $car = Car::find($rental->car_id);
                if ($car) {
                    $car->update(['status' => 'available']);
                }

                $completionDate = now()->toDateString();

                $benefits = CarBenefit::where('rental_id', $rental->id)
                    ->where('car_id', $rental->car_id)
                    ->where('end_date', '>', $completionDate)
                    ->get();

                foreach ($benefits as $benefit) {
                    $oldDays = max(1, (int) $benefit->days);
                    $perDay  = $oldDays > 0 ? $benefit->amount / $oldDays : 0;
                    $newDays = Carbon::parse($benefit->start_date)
                        ->diffInDays(Carbon::parse($completionDate)) + 1;

                    $benefit->update([
                        'end_date' => $completionDate,
                        'days'     => $newDays,
                        'amount'   => $perDay * $newDays,
                    ]);
                }
            }

            if (strtolower($validated['status']) === 'completed') {
                $clientUpdates = [];

                if (array_key_exists('client_rating', $validated) && $validated['client_rating'] !== null) {
                    $clientUpdates['rating'] = $validated['client_rating'];
                }

                if (array_key_exists('client_note', $validated) && $validated['client_note'] !== null) {
                    $clientUpdates['note'] = $validated['client_note'];
                }

                if ($clientUpdates) {
                    $client = $rental->client()->first();
                    if ($client) {
                        $client->update($clientUpdates);
                    }
                }
            }

            if (strtolower($validated['status']) === 'cancelled') {
                CarBenefit::where('rental_id', $rental->id)->delete();
            }

            DB::commit();

            // ✅ IMPORTANT: Inertia PATCH must return redirect (303)
            return back(303)->with('success', 'Status updated successfully');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('[Rental::updateStatus:exception]', [
                'rental_id' => $rental->id ?? null,
                'message'   => $e->getMessage(),
            ]);

            // Redirect back with validation-like error
            return back(303)->withErrors([
                'message' => 'Failed to update status: ' . $e->getMessage(),
            ]);
        }
    }
    
    public function selectType()
    {
        return Inertia::render('Rentals/SelectType');
    }

    public function createImmediate()
    {
        return Inertia::render('Rentals/CreateImmediateWizard', [
            'carModels' => CarModel::with(['photos','cars'])->get(),
            'cars' => Car::all(),
            'clients' => Client::all(),
        ]);
    }

    public function createReservation()
    {
        return Inertia::render('Rentals/CreateReservationWizard', [
            'carModels' => CarModel::with('photos')->get(),
            'clients' => Client::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'second_driver_id' => 'nullable|exists:clients,id',
            'client.name' => 'required_without:client_id|string|max:255',
            'client.phone' => 'required_without:client_id|string|max:20',
            'client.identity_card_number' => 'nullable|string|max:50',
            'client.address' => 'nullable|string',
            'client.license_number' => 'nullable|string|max:50',
            'client.license_date' => 'nullable|date',
            'client.license_expiration_date' => 'nullable|date',
            'client.license_front_image' => 'nullable|string',
            'client.license_back_image' => 'nullable|string',
            'client.cin_front_image' => 'nullable|string',
            'client.cin_back_image' => 'nullable|string',
            'second_driver.name' => 'nullable|string|max:255',
            'second_driver.phone' => 'nullable|string|max:20',
            'second_driver.identity_card_number' => 'nullable|string|max:50',
            'second_driver.address' => 'nullable|string',
            'second_driver.license_number' => 'nullable|string|max:50',
            'second_driver.license_date' => 'nullable|date',
            'second_driver.license_expiration_date' => 'nullable|date',
            'car_model_id' => 'required|exists:car_models,id',
            'car_id' => 'nullable|exists:cars,id',
            'rental_type' => 'required|in:immediate,reservation',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'pickup_time' => 'required',
            'return_time' => 'required',
            'days' => 'required|integer|min:1',
            'initial_price_per_day' => 'required|numeric|min:0',
            'price_per_day' => 'required|numeric|min:0',
            'global_discount' => 'nullable|numeric|min:0',
            'discount_per_day' => 'nullable|numeric|min:0',
            'total_price' => 'required_without:manual_total|numeric|min:0',
            'manual_total' => 'nullable|numeric|min:0',
            'status' => 'required|string',
            'advance_payment' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string',
            'reference' => 'nullable|string|max:255',
        ]);

        $client = $validated['client_id']
            ? Client::findOrFail($validated['client_id'])
            : Client::create($validated['client']);

        $secondDriverId = null;
        if ($validated['second_driver_id']) {
            $secondDriverId = $validated['second_driver_id'];
        } elseif (!empty($validated['second_driver']['name']) && !empty($validated['second_driver']['phone'])) {
            $secondDriver = Client::create($validated['second_driver']);
            $secondDriverId = $secondDriver->id;
        }

        $status = $validated['status'];
        if ($validated['rental_type'] === 'immediate') {
            $status = 'Active';
        }

        if (!empty($validated['car_id'])) {
            Rental::where('car_id', $validated['car_id'])
                ->where('status', 'Active')
                ->update(['status' => 'Completed']);
        }

        $useManual  = $request->filled('manual_total');
        $finalTotal = $useManual
            ? (float) $request->input('manual_total')
            : (float) $request->input('total_price');

        $rental = Rental::create([
            'client_id' => $client->id,
            'second_driver_id' => $secondDriverId,
            'car_model_id' => $validated['car_model_id'],
            'car_id' => $validated['car_id'] ?? null,
            'rental_type' => $validated['rental_type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'pickup_time' => $validated['pickup_time'],
            'return_time' => $validated['return_time'],
            'days' => $validated['days'],
            'initial_price_per_day' => $validated['initial_price_per_day'],
            'price_per_day' => $validated['price_per_day'],
            'global_discount' => $validated['global_discount'] ?? 0,
            'discount_per_day' => $validated['discount_per_day'] ?? 0,
            'total_price' => $finalTotal,
            'manual_total' => $useManual ? (float) $request->manual_total : null,
            'status' => $status,
            'confirmed_by_user_id' => Auth::id(),
            'confirmed_at' => now(),
        ]);

        if ($useManual && (float) $rental->total_price !== (float) $finalTotal) {
            DB::table('rentals')->where('id', $rental->id)->update(['total_price' => $finalTotal]);
            $rental->refresh();
        }

        if ($rental->car_id && $rental->effective_total > 0 && strtolower($rental->status ?? '') !== 'cancelled') {
            CarBenefit::create([
                'car_id' => $rental->car_id,
                'rental_id' => $rental->id,
                'amount' => $rental->effective_total,
                'start_date' => $rental->start_date,
                'end_date' => $rental->end_date,
                'days' => $rental->days,
            ]);
        }

        if ($validated['rental_type'] === 'immediate' && $rental->car_id) {
            $car = Car::find($rental->car_id);
            if ($car) $car->update(['status' => 'rented']);
        }

        if (!empty($validated['advance_payment']) && $validated['advance_payment'] > 0) {
            Payment::create([
                'client_id' => $client->id,
                'rental_id' => $rental->id,
                'user_id' => Auth::id(),
                'amount' => $validated['advance_payment'],
                'method' => $validated['payment_method'] ?? null,
                'reference' => $validated['reference'] ?? null,
                'date' => now(),
            ]);
        }

        return redirect()->route('rentals.show', $rental->id)
            ->with('success', 'Location créée avec succès.');
    }

    public function show(Rental $rental)
    {
        $rental->load([
            'client',
            'secondDriver',
            'car',
            'carModel',
            'carModel.photos',
            'user',
            'confirmedBy',
            'payments',
            'extensions.user',
            'carChanges.oldCar',
            'carChanges.newCar',
            'carChanges.user',
            'invoices',
        ]);

        if ($rental->carModel) $rental->carModel = $rental->carModel->toArray();
        if ($rental->car) $rental->car = $rental->car->toArray();
        if ($rental->client) $rental->client = $rental->client->toArray();
        if ($rental->secondDriver) $rental->secondDriver = $rental->secondDriver->toArray();

        $availableCars = Car::with('carModel')->where('status', 'available')->get();

        // Mark overdue invoices for clearer UI signals
        $today = Carbon::today();
        foreach ($rental->invoices as $invoice) {
            if ($invoice->status !== 'paid' && $invoice->due_date && Carbon::parse($invoice->due_date)->lt($today)) {
                $invoice->status = 'overdue';
            }
        }

        return Inertia::render('Rentals/Show', [
            'rental' => $rental,
            'availableCars' => $availableCars,
        ]);
    }

    public function getAvailableCars(Request $request)
    {
        try {
            $request->validate(['rental_id' => 'required|exists:rentals,id']);
            $rental = Rental::findOrFail($request->rental_id);

            if (!$rental->car_model_id) {
                return response()->json(['cars' => [], 'message' => 'No car model associated with this rental'], 200);
            }

            $cars = Car::with('carModel')
                ->where('status', 'available')
                ->where('car_model_id', $rental->car_model_id)
                ->get(['id', 'license_plate', 'car_model_id'])
                ->map(function ($car) {
                    return [
                        'id' => $car->id,
                        'make' => optional($car->carModel)->brand ?? 'Unknown',
                        'model' => optional($car->carModel)->model ?? 'Unknown',
                        'license_plate' => $car->license_plate,
                    ];
                });

            return response()->json(['cars' => $cars], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch available cars'], 500);
        }
    }

    public function destroy(Rental $rental)
    {
        // Admin only
        $user = Auth::user();
        $isAdmin = (bool) ($user->is_admin ?? ($user->role === 'admin'));
        if (!$isAdmin) {
            abort(403, 'Unauthorized.');
        }

        $rental->delete();
        return redirect()->route('rentals.index')->with('success', 'Location supprimée.');
    }

    public function edit(Rental $rental)
    {
        $rental->load(['client', 'secondDriver', 'car', 'carModel', 'payments']);

        $user = Auth::user();
        $canEditPrice = (bool) ($user->is_admin ?? ($user->role === 'admin'));

        return Inertia::render('Rentals/Edit', [
            'rental' => $rental,
            'clients' => Client::all(['id', 'name', 'phone', 'rating', 'note']),
            'canEditPrice' => $canEditPrice,
            'carModels' => CarModel::with('photos')->get(),
        ]);
    }

    public function update(Request $request, Rental $rental)
    {
        $user = Auth::user();
        $isAdmin = (bool) ($user->is_admin ?? ($user->role === 'admin'));

        $rules = [
            'client_id' => 'required|exists:clients,id',
            'second_driver_id' => 'nullable|exists:clients,id',
            'second_driver.name' => 'nullable|string|max:255',
            'second_driver.phone' => 'nullable|string|max:20',
            'second_driver.identity_card_number' => 'nullable|string|max:50',
            'second_driver.address' => 'nullable|string',
            'second_driver.license_number' => 'nullable|string|max:50',
            'second_driver.license_date' => 'nullable|date',
            'second_driver.license_expiration_date' => 'nullable|date',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'pickup_time' => 'required',
            'return_time' => 'required',
            'days'        => 'required|integer|min:1',
        ];

        if ($isAdmin) {
            if (Schema::hasColumn('rentals', 'initial_price_per_day')) {
                $rules['initial_price_per_day'] = 'required|numeric|min:0';
            }
            if (Schema::hasColumn('rentals', 'price_per_day')) {
                $rules['price_per_day'] = 'required|numeric|min:0';
            }
            if (Schema::hasColumn('rentals', 'global_discount')) {
                $rules['global_discount'] = 'nullable|numeric|min:0';
            }
            if (Schema::hasColumn('rentals', 'total_price')) {
                $rules['total_price'] = 'required_without:manual_total|numeric|min:0';
            }
            if (Schema::hasColumn('rentals', 'manual_total')) {
                $rules['manual_total'] = 'nullable|numeric|min:0';
            }
        }

        $validated = $request->validate($rules);

        DB::beginTransaction();
        try {
            // Client + second driver
            $rental->client_id = (int) $validated['client_id'];

            $secondDriverId = null;
            if (!empty($validated['second_driver_id'])) {
                $secondDriverId = (int) $validated['second_driver_id'];
            } elseif (!empty($validated['second_driver']['name']) && !empty($validated['second_driver']['phone'])) {
                $second = $rental->secondDriver
                    ? tap($rental->secondDriver)->update($validated['second_driver'])
                    : Client::create($validated['second_driver']);
                $secondDriverId = $second->id;
            }
            $rental->second_driver_id = $secondDriverId;

            // Dates
            $rental->start_date  = $validated['start_date'];
            $rental->end_date    = $validated['end_date'];
            $rental->pickup_time = $validated['pickup_time'];
            $rental->return_time = $validated['return_time'];
            $rental->days        = (int) $validated['days'];

            // Prices (admins only)
            if ($isAdmin) {
                if (Schema::hasColumn('rentals', 'initial_price_per_day') && array_key_exists('initial_price_per_day', $validated)) {
                    $rental->initial_price_per_day = $validated['initial_price_per_day'];
                }
                if (Schema::hasColumn('rentals', 'price_per_day') && array_key_exists('price_per_day', $validated)) {
                    $rental->price_per_day = $validated['price_per_day'];
                }
                if (Schema::hasColumn('rentals', 'global_discount')) {
                    $rental->global_discount = $validated['global_discount'] ?? 0;
                }

                $useManual = $request->filled('manual_total');
                if (Schema::hasColumn('rentals', 'manual_total')) {
                    $rental->manual_total = $useManual ? (float) $request->input('manual_total') : null;
                }

                $finalTotal = $useManual
                    ? (float) $request->input('manual_total')
                    : (array_key_exists('total_price', $validated)
                        ? (float) $validated['total_price']
                        : (float) $rental->total_price);

                if (Schema::hasColumn('rentals', 'total_price')) {
                    $rental->total_price = $finalTotal; // set desired total
                }
            }

            $rental->save();

            if ($isAdmin) {
                $useManual = $request->filled('manual_total');
                $finalTotal = $useManual
                    ? (float) $request->input('manual_total')
                    : (array_key_exists('total_price', $validated)
                        ? (float) $validated['total_price']
                        : (float) $rental->total_price);

                if ($useManual && (float) $rental->total_price !== (float) $finalTotal) {
                    DB::table('rentals')->where('id', $rental->id)->update(['total_price' => $finalTotal]);
                    $rental->refresh();
                }
            }

            // CarBenefit based on effective_total
            $this->syncCarBenefits($rental, $rental->car_id);

            DB::commit();

            return redirect()->route('rentals.show', $rental->id)
                ->with('success', 'Rental updated successfully.');
        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);
            return back()
                ->withErrors(['update' => 'Failed to update rental: ' . $e->getMessage()])
                ->withInput();
        }
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private function ensureNoCarOverlap(int $carId, string $start, string $end, int $ignoreId): void
    {
        $overlap = Rental::where('car_id', $carId)
            ->where('id', '!=', $ignoreId)
            ->where(function ($q) use ($start, $end) {
                $q->whereDate('start_date', '<=', $end)
                  ->whereDate('end_date', '>=', $start);
            })
            ->exists();

        if ($overlap) {
            abort(422, 'Selected car is not available for the selected dates.');
        }
    }

    private function setCarStatuses(?int $oldCarId, ?int $newCarId, string $oldStatusForLogic, string $newStatusForLogic): void
    {
        if ($oldCarId && $oldCarId !== $newCarId && $oldStatusForLogic === 'active') {
            $oldCar = Car::find($oldCarId);
            if ($oldCar) $oldCar->update(['status' => 'available']);
        }

        if ($newCarId) {
            $newCar = Car::find($newCarId);
            if ($newCar) {
                if ($newStatusForLogic === 'active') {
                    $newCar->update(['status' => 'rented']);
                } else {
                    $newCar->update(['status' => 'available']);
                }
            }
        }
    }

    private function syncCarBenefits(Rental $rental, ?int $oldCarId): void
    {
        if (strtolower($rental->status ?? '') === 'cancelled') {
            CarBenefit::where('rental_id', $rental->id)->delete();
            return;
        }

        if (!$rental->car_id || ($rental->effective_total ?? 0) <= 0) {
            CarBenefit::where('rental_id', $rental->id)->delete();
            return;
        }

        if ($oldCarId && $oldCarId !== $rental->car_id) {
            CarBenefit::where('rental_id', $rental->id)->where('car_id', $oldCarId)->delete();
        }

        CarBenefit::updateOrCreate(
            ['rental_id' => $rental->id, 'car_id' => $rental->car_id],
            [
                'amount' => $rental->effective_total,
                'start_date' => $rental->start_date,
                'end_date' => $rental->end_date,
                'days' => $rental->days,
            ]
        );
    }
}