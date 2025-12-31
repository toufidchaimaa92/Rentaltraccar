<?php

namespace App\Http\Controllers;

use App\Models\Rental;
use App\Models\Car;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();

        // Nombre de voitures disponibles
        $carsAvailable = Car::where('status', 'available')->count();

        // Locations commençant aujourd’hui
        $bookingsStartToday = Rental::whereDate('start_date', $now)->count();

        // Locations finissant aujourd’hui
        $bookingsEndToday = Rental::whereDate('end_date', $now)->count();

        // Locations pas encore activées
        $pendingConfirmedCount = Rental::whereIn('status', ['Pending', 'Confirmed'])->count();

        // Locations actives avec fin dépassée (avec eager loading for car, carModel, client)
        $activeOverdueRentalsQuery = Rental::where('status', 'Active')
            ->whereRaw("STR_TO_DATE(CONCAT(end_date, ' ', return_time), '%Y-%m-%d %H:%i:%s') <= ?", [$now->format('Y-m-d H:i:s')])
            ->with(['car', 'carModel', 'client']) // <-- Added client
            ->withSum('payments', 'amount')
            ->orderBy('end_date', 'asc');

        $activeOverdueCount = $activeOverdueRentalsQuery->count();

        $activeOverdueRentals = $activeOverdueRentalsQuery->get()->map(function ($rental) {
            $paidAmount = (float) ($rental->payments_sum_amount ?? $rental->total_paid ?? 0);
            $totalAmount = (float) ($rental->effective_total ?? $rental->total_price ?? 0);
            $remainingAmount = max(0, $totalAmount - $paidAmount);

            return [
                'id'          => $rental->id,
                'start_date'  => $rental->start_date,
                'end_date'    => $rental->end_date,
                'return_time' => $rental->return_time,
                'status'      => $rental->status,

                // Client info
                'client' => $rental->client ? [
                    'id'    => $rental->client->id,
                    'name'  => $rental->client->name,
                    'phone' => $rental->client->phone ?? null,
                ] : null,
                'client_id' => $rental->client_id,

                // Car info
                'car' => $rental->car ? [
                    'id'            => $rental->car->id,
                    'license_plate' => $rental->car->license_plate,
                    'name'          => $rental->car->name ?? null,
                ] : null,

                // Car model info
                'carModel' => $rental->carModel ? [
                    'brand' => $rental->carModel->brand,
                    'model' => $rental->carModel->model,
                ] : null,

                // Payment info
                'paid_amount'     => $paidAmount,
                'total_amount'    => $totalAmount,
                'reste_a_payer'   => $remainingAmount,
                'has_payment_due' => $remainingAmount > 0,
                'payment_status'  => $rental->payment_status ?? null,
            ];
        });

        return Inertia::render('Dashboard', [
            'carsAvailable'         => $carsAvailable,
            'bookingsStartToday'    => $bookingsStartToday,
            'bookingsEndToday'      => $bookingsEndToday,
            'pendingConfirmedCount' => $pendingConfirmedCount,
            'activeOverdueCount'    => $activeOverdueCount,
            'activeOverdueRentals'  => $activeOverdueRentals,
        ]);
    }
}