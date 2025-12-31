<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\CarBenefit;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class CarBenefitController extends Controller
{
    public function index(Request $request, $carId)
    {
        $car = Car::findOrFail($carId);

        // Pagination + optional filters (simple, extend as needed)
        $perPage = (int) $request->input('per_page', 15);

        $benefits = CarBenefit::where('car_id', $car->id)
            ->orderByDesc('start_date')
            ->paginate($perPage)
            ->withQueryString();

        // ---- Totals (same proration logic you use elsewhere) ----
        $startOfMonth = now()->startOfMonth();
        $endOfMonth   = now()->endOfMonth();

        // If dataset is small this is fine; if large, consider a sum via SQL or chunking
        $allForCar = CarBenefit::where('car_id', $car->id)->get();

        $totalBenefit = $allForCar->sum('amount');

        $monthlyBenefit = $allForCar->sum(function ($b) use ($startOfMonth, $endOfMonth) {
            $bStart = Carbon::parse($b->start_date);
            $bEnd   = Carbon::parse($b->end_date);

            $benefitStart = $bStart->greaterThan($startOfMonth) ? $bStart : $startOfMonth;
            $benefitEnd   = $bEnd->lessThan($endOfMonth) ? $bEnd : $endOfMonth;

            if ($benefitStart->gt($benefitEnd)) return 0;

            $days = $benefitStart->diffInDays($benefitEnd) + 1;
            $daily = ($b->days > 0) ? ($b->amount / $b->days) : 0;

            return $daily * $days;
        });

        $monthlyRentedDays = $allForCar->sum(function ($b) use ($startOfMonth, $endOfMonth) {
            $bStart = Carbon::parse($b->start_date);
            $bEnd   = Carbon::parse($b->end_date);

            $benefitStart = $bStart->greaterThan($startOfMonth) ? $bStart : $startOfMonth;
            $benefitEnd   = $bEnd->lessThan($endOfMonth) ? $bEnd : $endOfMonth;

            if ($benefitStart->gt($benefitEnd)) return 0;

            return $benefitStart->diffInDays($benefitEnd) + 1;
        });

        return Inertia::render('Cars/Benefits', [
            'car' => $car->only(['id','license_plate','wwlicense_plate']) + [
                // include model if you want to show it in header
                'car_model' => $car->relationLoaded('carModel') ? $car->carModel : $car->carModel()->first(['id','brand','model']),
            ],
            'benefits' => $benefits,
            'totals' => [
                'monthlyBenefit'    => $monthlyBenefit,
                'totalBenefit'      => $totalBenefit,
                'monthlyRentedDays' => $monthlyRentedDays,
            ],
            'filters' => [
                'per_page' => $perPage,
            ],
        ]);
    }
}
