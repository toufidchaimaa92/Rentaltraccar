<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\RentalExtension;
use App\Models\RentalCarChange;
use App\Models\Car;
use App\Models\CarBenefit;
use App\Models\CarModel;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class RentalActionController extends Controller
{
    public function extendForm(Rental $rental)
    {
        return Inertia::render('Rentals/Extend', [
            'rental' => [
                'id'               => $rental->id,
                'start_date'       => $rental->start_date,
                'end_date'         => $rental->end_date,
                'car_id'           => $rental->car_id,
                'car_label'        => optional($rental->car?->carModel, fn($m) => $m->brand.' '.$m->model) ?? null,
                'price_per_day'    => $rental->price_per_day,
                'discount_per_day' => $rental->discount_per_day,
                'total_price'      => $rental->total_price,
            ],
        ]);
    }

    /**
     * Extend rental end date and recalculate price (tracks price delta).
     */
    public function extend(Request $request, Rental $rental)
    {
        $validated = $request->validate([
            'new_end_date'             => 'required|date|after:' . $rental->end_date,
            'extension_id'             => 'nullable|exists:rental_extensions,id',
            'override_price_per_day'   => 'nullable|numeric|min:0',
            'discount_per_day'         => 'nullable|numeric|min:0',
            'override_total_price'     => 'nullable|numeric|min:0',
            'override_total_mode'      => 'nullable|string|in:segment,grand',
            'fees'                     => 'nullable|array',
            'fees.*.label'             => 'required_with:fees|string|max:100',
            'fees.*.amount'            => 'required_with:fees|numeric|min:0',
            'advance_payment'          => 'nullable|numeric|min:0',
            'payment_method'           => 'nullable|string|in:cash,virement,cheque'
                                          . '|required_unless:advance_payment,0,NULL'
                                          . '|exclude_if:advance_payment,0',
            'reference'                => 'nullable|string|max:255'
                                          . '|required_if:payment_method,virement,cheque',
        ]);

        $origPricePerDay    = (float) ($rental->price_per_day ?? 0);
        $origDiscountPerDay = (float) ($rental->discount_per_day ?? 0);

        DB::transaction(function () use ($validated, $rental, $origPricePerDay, $origDiscountPerDay) {
            $oldEnd        = Carbon::parse($rental->end_date);
            $newEnd        = Carbon::parse($validated['new_end_date']);
            $startDate     = Carbon::parse($rental->start_date);

            $finalDaysTotal = $startDate->diffInDays($newEnd);
            $extensionDays  = $oldEnd->diffInDays($newEnd);

            if ($extensionDays <= 0) {
                abort(422, 'La nouvelle date doit être postérieure à la fin actuelle.');
            }

            $overridePPDApplied   = array_key_exists('override_price_per_day', $validated) && $validated['override_price_per_day'] !== null;
            $overrideDiscApplied  = array_key_exists('discount_per_day', $validated) && $validated['discount_per_day'] !== null;
            $overrideTotalApplied = array_key_exists('override_total_price', $validated) && $validated['override_total_price'] !== null;

            $extDailyBase = $overridePPDApplied
                ? (float) $validated['override_price_per_day']
                : $origPricePerDay;

            $extDiscountPerDay = $overrideDiscApplied
                ? (float) $validated['discount_per_day']
                : 0.0;

            $extDailyNet = max(0.0, $extDailyBase - $extDiscountPerDay);

            $fees      = collect($validated['fees'] ?? []);
            $feesTotal = round((float) $fees->sum('amount'), 2);

            $oldGrandTotal = (float) $rental->total_price;

            $mode = $validated['override_total_mode'] ?? null;

            if ($overrideTotalApplied && !$mode) {
                $mode = ((float)$validated['override_total_price'] >= $oldGrandTotal) ? 'grand' : 'segment';
            }

            if ($overrideTotalApplied && $mode === 'grand') {
                $newGrandTotal         = round((float)$validated['override_total_price'], 2);
                $extensionSegmentTotal = max(0.0, round($newGrandTotal - $oldGrandTotal, 2));
            } else {
                $manualSegment = ($overrideTotalApplied && $mode === 'segment')
                    ? round((float)$validated['override_total_price'], 2)
                    : null;

                $extensionSegmentTotal = $manualSegment ?? round(($extensionDays * $extDailyNet) + $feesTotal, 2);
                $newGrandTotal         = round($oldGrandTotal + $extensionSegmentTotal, 2);
            }

            $extensionPayload = [
                'rental_id'                 => $rental->id,
                'old_end_date'              => $rental->end_date,
                'new_end_date'              => $validated['new_end_date'],
                'old_total'                 => $oldGrandTotal,
                'new_total'                 => $newGrandTotal,
                'price_delta'               => round($newGrandTotal - $oldGrandTotal, 2),
                'extension_days'            => $extensionDays,
                'ext_price_per_day_applied' => $extDailyBase,
                'ext_discount_per_day'      => $extDiscountPerDay,
                'ext_fees_json'             => $fees->values()->toJson(),
                'ext_override_total_applied'=> $overrideTotalApplied,
                'ext_override_total_mode'   => $mode,
                'ext_segment_total'         => $extensionSegmentTotal,
                'changed_by'                => Auth::id(),
            ];

            if (!empty($validated['extension_id'])) {
                $ext = RentalExtension::findOrFail($validated['extension_id']);
                $ext->update($extensionPayload);
            } else {
                $ext = RentalExtension::create($extensionPayload);
            }

            $rental->forceFill([
                'end_date'    => $validated['new_end_date'],
                'days'        => $finalDaysTotal,
                'total_price' => $newGrandTotal,
            ])->saveQuietly();

            $rental->refresh();
            $afterPricePerDay    = (float) ($rental->price_per_day ?? 0);
            $afterDiscountPerDay = (float) ($rental->discount_per_day ?? 0);

            if ($afterPricePerDay !== $origPricePerDay || $afterDiscountPerDay !== $origDiscountPerDay) {
                DB::table('rentals')
                    ->where('id', $rental->id)
                    ->update([
                        'price_per_day'    => $origPricePerDay,
                        'discount_per_day' => $origDiscountPerDay,
                        'updated_at'       => now(),
                    ]);
                $rental->refresh();
            }

            $carBenefit = CarBenefit::where('rental_id', $rental->id)
                ->where('car_id', $rental->car_id)
                ->first();

            $benefitTotal = round((float) ($rental->manual_total ?? $newGrandTotal), 2);

            if ($carBenefit) {
                $carBenefit->update([
                    'amount'   => $benefitTotal,
                    'end_date' => $rental->end_date,
                    'days'     => $finalDaysTotal,
                ]);
            } else {
                CarBenefit::create([
                    'car_id'     => $rental->car_id,
                    'rental_id'  => $rental->id,
                    'amount'     => $benefitTotal,
                    'start_date' => $rental->start_date,
                    'end_date'   => $rental->end_date,
                    'days'       => $finalDaysTotal,
                ]);
            }

            $advance = isset($validated['advance_payment']) ? (float) $validated['advance_payment'] : 0.0;
            if ($advance > 0) {
                $capped = min($advance, $extensionSegmentTotal);
                try {
                    Payment::create([
                        'rental_id'   => $rental->id,
                        'client_id'   => $rental->client_id,
                        'user_id'     => auth()->id(),
                        'amount'      => $capped,
                        'method'      => $validated['payment_method'] ?? 'cash',
                        'reference'   => $validated['reference'] ?? null,
                        'received_by' => Auth::id(),
                        'received_at' => now(),
                    ]);
                } catch (\Throwable $e) {
                    // Optionally rethrow if rollback is desired
                }
            }
        });

        return redirect()
            ->route('rentals.show', $rental->id)
            ->with('success', 'Location prolongée. Overrides/Remises appliqués uniquement sur la période d’extension (base inchangée). Paiement (si saisi) par défaut en espèces.');
    }

    public function changeCarForm(Rental $rental)
    {
        $rental->load(['car', 'car.carModel']);

        $carModels = CarModel::with([
                'photos:id,car_model_id,photo_path,order',
                'cars:id,car_model_id,license_plate,status',
            ])
            ->get()
            ->map(function ($m) use ($rental) {
                return [
                    'id'            => $m->id,
                    'brand'         => $m->brand,
                    'model'         => $m->model,
                    'fuel_type'     => $m->fuel_type,
                    'price_per_day' => $m->price_per_day,
                    'transmission'  => $m->transmission,
                    'finish'        => $m->finish,
                    'photos'        => $m->photos?->map(fn($p) => [
                        'id'         => $p->id,
                        'photo_path' => $p->photo_path,
                        'order'      => $p->order,
                    ])->values() ?? [],
                    'cars'          => $m->cars?->filter(fn($c) => (int) $c->id !== (int) $rental->car_id)
                        ->map(fn($c) => [
                            'id'            => $c->id,
                            'license_plate' => $c->license_plate,
                            'status'        => $c->status,
                        ])->values() ?? [],
                ];
            })
            ->values();

        return Inertia::render('Rentals/ChangeCar', [
            'rental' => [
                'id'               => $rental->id,
                'start_date'       => $rental->start_date,
                'end_date'         => $rental->end_date,
                'car_id'           => $rental->car_id,
                'price_per_day'    => $rental->price_per_day,
                'discount_per_day' => $rental->discount_per_day,
                'car_label'        => $rental->car && $rental->car->carModel
                    ? ($rental->car->carModel->brand . ' ' . $rental->car->carModel->model)
                    : null,
            ],
            'carModels' => $carModels,
        ]);
    }

    /**
     * Change car and adjust total price.
     */
    public function changeCar(Request $request, Rental $rental)
    {
        $validated = $request->validate([
            'new_car_id'             => 'required|exists:cars,id|different:' . $rental->car_id,
            'change_date'            => 'required|date|after_or_equal:' . $rental->start_date . '|before_or_equal:' . $rental->end_date,
            'override_price_per_day' => 'nullable|numeric|min:0',
            'override_total_price'   => 'nullable|numeric|min:0',
            'discount_per_day'       => 'nullable|numeric|min:0',
            'fees'                   => 'nullable|array',
            'fees.*.label'           => 'required_with:fees|string|max:100',
            'fees.*.amount'          => 'required_with:fees|numeric|min:0',
            'note'                   => 'nullable|string|max:2000',
        ]);

        DB::transaction(function () use ($validated, $rental) {
            $oldCar     = $rental->car;
            $newCar     = Car::with('carModel')->findOrFail($validated['new_car_id']);
            $changeDate = Carbon::parse($validated['change_date']);

            $oldEndDateSigned = $changeDate->copy()->subDay();
            $oldDays = max(0, Carbon::parse($rental->start_date)->diffInDays($oldEndDateSigned, false) + 1);
            $newDays = max(0, $changeDate->diffInDays(Carbon::parse($rental->end_date), false) + 1);

            $oldDailyBase      = (float) ($rental->price_per_day ?? 0);
            $oldDiscountPerDay = (float) ($rental->discount_per_day ?? 0);
            $oldDailyNet       = max(0.0, $oldDailyBase - $oldDiscountPerDay);
            $oldPricePart      = $oldDays > 0 ? $oldDays * $oldDailyNet : 0.0;
            $oldPricePart      = round($oldPricePart, 2);

            $modelDaily        = (float) ($newCar->carModel->price_per_day ?? 0);
            $overrideDaily     = array_key_exists('override_price_per_day', $validated)
                ? $validated['override_price_per_day']
                : null;
            $newDailyBase      = $overrideDaily !== null ? (float) $overrideDaily : $modelDaily;

            $newDiscountPerDay = array_key_exists('discount_per_day', $validated)
                ? (float) ($validated['discount_per_day'] ?? 0)
                : (float) ($rental->discount_per_day ?? 0);

            $newDailyNet   = max(0.0, $newDailyBase - $newDiscountPerDay);
            $newPricePart  = $newDays > 0 ? $newDays * $newDailyNet : 0.0;
            $newPricePart  = round($newPricePart, 2);

            $fees      = collect($validated['fees'] ?? []);
            $feesTotal = round((float) $fees->sum('amount'), 2);

            $overrideSegmentProvided = array_key_exists('override_total_price', $validated)
                && $validated['override_total_price'] !== null;

            if ($overrideSegmentProvided) {
                $newSegmentTotal = round((float) $validated['override_total_price'], 2);
                $finalTotal      = round($oldPricePart + $newSegmentTotal, 2);
            } else {
                $finalTotal       = round($oldPricePart + $newPricePart + $feesTotal, 2);
            }

            $rental->update([
                'car_id'           => $newCar->id,
                'price_per_day'    => $newDailyBase,
                'discount_per_day' => $newDiscountPerDay,
                'total_price'      => $finalTotal,
            ]);

            $benefitTotal = round((float) ($rental->manual_total ?? $finalTotal), 2);
            $totalDays = $oldDays + $newDays;
            $perDayBenefit = $totalDays > 0 ? $benefitTotal / $totalDays : 0;
            $oldBenefitAmount = round($perDayBenefit * $oldDays, 2);
            $newBenefitAmount = round($benefitTotal - $oldBenefitAmount, 2);

            if ($oldCar && $oldDays > 0) {
                CarBenefit::updateOrCreate(
                    [
                        'rental_id'  => $rental->id,
                        'car_id'     => $oldCar->id,
                        'start_date' => $rental->start_date,
                    ],
                    [
                        'amount'   => $oldBenefitAmount,
                        'end_date' => $oldEndDateSigned->format('Y-m-d'),
                        'days'     => $oldDays,
                    ]
                );
            }

            if ($newDays > 0) {
                CarBenefit::updateOrCreate(
                    [
                        'rental_id'  => $rental->id,
                        'car_id'     => $newCar->id,
                        'start_date' => $changeDate->format('Y-m-d'),
                    ],
                    [
                        'amount'   => $newBenefitAmount,
                        'end_date' => $rental->end_date,
                        'days'     => $newDays,
                    ]
                );
            }

            RentalCarChange::create([
                'rental_id'              => $rental->id,
                'old_car_id'             => $oldCar?->id,
                'new_car_id'             => $newCar->id,
                'change_date'            => $changeDate->toDateString(),
                'old_total'              => (float) $rental->getOriginal('total_price'),
                'new_total'              => (float) $finalTotal,
                'old_price_per_day'      => $oldDailyBase,
                'new_price_per_day'      => $newDailyBase,
                'old_discount_per_day'   => $oldDiscountPerDay,
                'new_discount_per_day'   => $newDiscountPerDay,
                'override_price_applied' => $overrideDaily !== null,
                'override_total_applied' => $overrideSegmentProvided,
                'fees_json'              => $fees->values()->toJson(),
                'note'                   => $validated['note'] ?? null,
                'changed_by'             => Auth::id(),
            ]);

            if ($oldCar) $oldCar->update(['status' => 'available']);
            $newCar->update(['status' => 'rented']);
        });

        return redirect()
            ->route('rentals.show', $rental->id)
            ->with('success', 'Voiture changée et prix ajusté.');
    }
}
