<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Rental;
use App\Models\LongTermInvoice;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function yearData(Request $request)
    {
        $year = $request->query('year', Carbon::now()->year);

        $rangeStart = Carbon::create($year, 1, 1)->startOfYear();
        $rangeEnd   = $rangeStart->copy()->endOfYear();

        $rentals = Rental::where(function ($query) use ($year) {
                $query->whereYear('start_date', $year)
                      ->orWhereYear('end_date', $year);
            })
            ->with(['client', 'carModel', 'car.carModel'])
            ->withSum('payments', 'amount')
            ->get();

        $longTermInvoices = LongTermInvoice::whereBetween('due_date', [$rangeStart, $rangeEnd])
            ->whereHas('rental', fn ($q) => $q->where('rental_type', 'long_term'))
            ->with(['rental.client', 'rental.carModel', 'rental.car.carModel'])
            ->get();

        $events = $this->mapRentalsToEvents($rentals)
            ->concat($this->mapInvoicesToEvents($longTermInvoices))
            ->values();

        return Inertia::render('Calendar/FullCalendarPage', [
            'initialEvents' => $events,
            'today' => Carbon::today()->toDateString(),
        ])->withViewData(['inertia' => true]);
    }

    public function weekData(Request $request)
    {
        $startOfWeek = Carbon::parse($request->query('start', Carbon::now()->startOfWeek()));
        $endOfWeek   = $startOfWeek->copy()->endOfWeek();

        $rentals = Rental::where(function ($query) use ($startOfWeek, $endOfWeek) {
                $query->whereBetween('start_date', [$startOfWeek, $endOfWeek])
                      ->orWhereBetween('end_date', [$startOfWeek, $endOfWeek])
                      ->orWhere(function ($q) use ($startOfWeek, $endOfWeek) {
                          $q->where('start_date', '<=', $startOfWeek)
                            ->where('end_date', '>=', $endOfWeek);
                      });
            })
            ->with(['client', 'carModel', 'car.carModel'])
            ->withSum('payments', 'amount')
            ->get();

        $longTermInvoices = LongTermInvoice::whereBetween('due_date', [$startOfWeek, $endOfWeek])
            ->whereHas('rental', fn ($q) => $q->where('rental_type', 'long_term'))
            ->with(['rental.client', 'rental.carModel', 'rental.car.carModel'])
            ->get();

        $events = $this->mapRentalsToEvents($rentals)
            ->concat($this->mapInvoicesToEvents($longTermInvoices))
            ->values();

        return Inertia::render('Calendar/FullCalendarPage', [
            'events' => $events,
            'today' => Carbon::today()->toDateString(),
        ])->withViewData(['inertia' => true]);
    }

    public function monthData(Request $request)
    {
        $year  = $request->query('year', Carbon::now()->year);
        $month = $request->query('month', Carbon::now()->month);

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth   = $startOfMonth->copy()->endOfMonth();

        $rentals = Rental::where(function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                      ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth])
                      ->orWhere(function ($q) use ($startOfMonth, $endOfMonth) {
                          $q->where('start_date', '<=', $startOfMonth)
                            ->where('end_date', '>=', $endOfMonth);
                      });
            })
            ->with(['client', 'carModel', 'car.carModel'])
            ->withSum('payments', 'amount')
            ->get();

        $longTermInvoices = LongTermInvoice::whereBetween('due_date', [$startOfMonth, $endOfMonth])
            ->whereHas('rental', fn ($q) => $q->where('rental_type', 'long_term'))
            ->with(['rental.client', 'rental.carModel', 'rental.car.carModel'])
            ->get();

        $events = $this->mapRentalsToEvents($rentals)
            ->concat($this->mapInvoicesToEvents($longTermInvoices))
            ->values();

        return Inertia::render('Calendar/FullCalendarPage', [
            'events' => $events,
            'today' => Carbon::today()->toDateString(),
        ])->withViewData(['inertia' => true]);
    }

    public function dayData(Request $request)
    {
        $date = $request->query('date', Carbon::today()->toDateString());
        $day  = Carbon::parse($date);

        $rentals = Rental::where(function ($query) use ($day) {
                $query->whereDate('start_date', $day)
                      ->orWhereDate('end_date', $day)
                      ->orWhere(function ($q) use ($day) {
                          $q->where('start_date', '<=', $day)
                            ->where('end_date', '>=', $day);
                      });
            })
            ->with(['client', 'carModel', 'car.carModel'])
            ->withSum('payments', 'amount')
            ->get();

        $longTermInvoices = LongTermInvoice::whereDate('due_date', $day)
            ->whereHas('rental', fn ($q) => $q->where('rental_type', 'long_term'))
            ->with(['rental.client', 'rental.carModel', 'rental.car.carModel'])
            ->get();

        $events = $this->mapRentalsToEvents($rentals)
            ->concat($this->mapInvoicesToEvents($longTermInvoices))
            ->values();

        return Inertia::render('Calendar/FullCalendarPage', [
            'events' => $events,
            'today' => $day->toDateString(),
        ])->withViewData(['inertia' => true]);
    }

    protected function mapRentalsToEvents($rentals)
    {
        $appTz = config('app.timezone', 'Africa/Casablanca');

        return $rentals->map(function ($rental) use ($appTz) {
            if (!$rental->start_date || !$rental->end_date) {
                return null;
            }

            $hasPickup = !empty($rental->pickup_time);
            $hasReturn = !empty($rental->return_time);
            $isAllDay  = !$hasPickup && !$hasReturn;

            if ($isAllDay) {
                $start = $rental->start_date->copy()->startOfDay()->timezone($appTz);
                $end   = $rental->end_date->copy()->addDay()->startOfDay()->timezone($appTz);
            } else {
                $start = $rental->start_date->copy()
                    ->setTimeFromTimeString($rental->pickup_time ?? '00:00:00')
                    ->timezone($appTz);

                $end = $rental->end_date->copy()
                    ->setTimeFromTimeString($rental->return_time ?? '23:59:59')
                    ->timezone($appTz);

                if ($end->lessThanOrEqualTo($start)) {
                    $end = $start->copy()->addMinute();
                }
            }

            $brand = $rental->carModel?->brand ?? $rental->car?->carModel?->brand ?? 'Unknown';
            $model = $rental->carModel?->model ?? $rental->car?->carModel?->model ?? 'Unknown';
            $paidAmount = (float) ($rental->payments_sum_amount ?? $rental->total_paid ?? 0);
            $totalAmount = (float) ($rental->effective_total ?? $rental->total_price ?? 0);
            $remainingAmount = max(0, $totalAmount - $paidAmount);

            return [
                'id'     => (string) $rental->id,
                'title'  => $rental->client?->name ?? "Rental #{$rental->id}",
                'start'  => $start->toIso8601String(),
                'end'    => $end->toIso8601String(),
                'allDay' => $isAllDay,
                'status' => strtolower($rental->status ?? 'pending'),
                'car_id' => $rental->car_id,

                'car_model_id' => $rental->car_model_id,

                'client' => $rental->client ? [
                    'name'  => $rental->client->name,
                    'phone' => $rental->client->phone ?? null,
                ] : null,
                'client_id' => $rental->client_id,

                'carModel' => [
                    'brand' => $brand,
                    'model' => $model,
                ],

                'car' => $rental->car ? [
                    'make'          => $brand,
                    'model'         => $model,
                    'license_plate' => $rental->car->license_plate,
                ] : null,

                'paid_amount' => $paidAmount,
                'total_amount' => $totalAmount,
                'reste_a_payer' => $remainingAmount,
                'has_payment_due' => $remainingAmount > 0,
            ];
        })->filter()->values();
    }

    protected function mapInvoicesToEvents($invoices)
    {
        $appTz = config('app.timezone', 'Africa/Casablanca');

        return $invoices->map(function ($invoice) use ($appTz) {
            $rental = $invoice->rental;
            if (!$rental || !$invoice->due_date) {
                return null;
            }

            $start = Carbon::parse($invoice->due_date)->startOfDay()->timezone($appTz);
            $end   = $start->copy()->addMinutes(1);

            $brand = $rental->carModel?->brand ?? $rental->car?->carModel?->brand ?? 'Unknown';
            $model = $rental->carModel?->model ?? $rental->car?->carModel?->model ?? 'Unknown';
            $remainingAmount = (float) ($invoice->amount_due ?? 0);

            return [
                'id'     => 'invoice-' . $invoice->id,
                'title'  => ($rental->client?->name ? $rental->client->name . ' - ' : '') . 'Échéance',
                'start'  => $start->toIso8601String(),
                'end'    => $end->toIso8601String(),
                'allDay' => false,
                'status' => 'due',
                'car_id' => $rental->car_id,

                'car_model_id' => $rental->car_model_id,

                'client' => $rental->client ? [
                    'name'  => $rental->client->name,
                    'phone' => $rental->client->phone ?? null,
                ] : null,
                'client_id' => $rental->client_id,

                'carModel' => [
                    'brand' => $brand,
                    'model' => $model,
                ],

                'car' => $rental->car ? [
                    'make'          => $brand,
                    'model'         => $model,
                    'license_plate' => $rental->car->license_plate,
                ] : null,

                'paid_amount' => 0,
                'total_amount' => (float) ($invoice->amount_due ?? 0),
                'reste_a_payer' => $remainingAmount,
                'has_payment_due' => $remainingAmount > 0,
            ];
        })->filter()->values();
    }
}
