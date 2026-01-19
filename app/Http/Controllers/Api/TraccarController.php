<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Rental;
use App\Services\Traccar\TraccarClient;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TraccarController extends Controller
{
    public function devices(TraccarClient $traccar)
    {
        return response()->json(
            $traccar->getDevices()
        );
    }

    public function devicePosition(int $deviceId, TraccarClient $traccar)
    {
        $position = $traccar->getLatestPositionForDevice($deviceId);

        if (! $position) {
            return response()->json([
                'message' => 'No position found',
            ], 404);
        }

        return response()->json($position);
    }

    public function carPositions(TraccarClient $traccar)
    {
        $cars = Car::query()
            ->whereNotNull('traccar_device_id')
            ->with('carModel')
            ->get(['id', 'car_model_id', 'license_plate', 'wwlicense_plate', 'traccar_device_id']);

        $payload = [];

        foreach ($cars as $car) {
            $position = $traccar->getLatestPositionForDevice((int) $car->traccar_device_id);

            if (! $position) {
                continue;
            }

            $latitude = $position['latitude'] ?? null;
            $longitude = $position['longitude'] ?? null;

            if ($latitude === null || $longitude === null) {
                continue;
            }

            $payload[] = [
                'car_id' => $car->id,
                'license_plate' => $car->license_plate ?: ($car->wwlicense_plate ?? ''),
                'car_brand' => $car->carModel->brand ?? null,
                'car_model' => $car->carModel->model ?? null,
                'latitude' => $latitude,
                'longitude' => $longitude,
                'speed' => $position['speed'] ?? 0,
                'updated_at' => $position['deviceTime'] ?? ($position['fixTime'] ?? null),
            ];
        }

        return response()->json($payload);
    }

    public function rentalPosition(int $rentalId, TraccarClient $traccar)
    {
        $rental = Rental::with('car')->findOrFail($rentalId);

        if (strtolower((string) $rental->status) !== 'active') {
            return response()->json(['message' => 'Rental is not active'], 403);
        }

        $car = $rental->car;

        if (! $car?->traccar_device_id) {
            return response()->json(null);
        }

        $position = $traccar->getLatestPositionForDevice((int) $car->traccar_device_id);

        if (! $position) {
            return response()->json(null);
        }

        $latitude = $position['latitude'] ?? null;
        $longitude = $position['longitude'] ?? null;

        if ($latitude === null || $longitude === null) {
            return response()->json(null);
        }

        return response()->json([
            'rental_id' => $rental->id,
            'car_id' => $car->id,
            'license_plate' => $car->license_plate ?: ($car->wwlicense_plate ?? ''),
            'latitude' => $latitude,
            'longitude' => $longitude,
            'speed' => $position['speed'] ?? 0,
            'updated_at' => $position['deviceTime'] ?? ($position['fixTime'] ?? null),
        ]);
    }

    public function alerts(Request $request, TraccarClient $traccar)
    {
        $activeRentals = Rental::query()
            ->with('car')
            ->where('status', 'active')
            ->whereNotNull('car_id')
            ->get();

        $deviceMap = [];

        foreach ($activeRentals as $rental) {
            $car = $rental->car;

            if (! $car?->traccar_device_id) {
                continue;
            }

            $deviceMap[(int) $car->traccar_device_id] = [
                'rental_id' => $rental->id,
                'car_id' => $car->id,
                'license_plate' => $car->license_plate ?: ($car->wwlicense_plate ?? ''),
            ];
        }

        if ($deviceMap === []) {
            return response()->json([]);
        }

        try {
            $events = $traccar->getEvents(array_keys($deviceMap));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Traccar is unavailable.'], 502);
        }
        $allowedTypes = [
            'deviceOverspeed' => 'Speed limit exceeded',
            'geofenceEnter' => 'Geofence entered',
            'geofenceExit' => 'Geofence exited',
        ];

        $payload = [];
        $rentalFilter = $request->query('rental_id');

        foreach ($events as $event) {
            $type = $event['type'] ?? null;
            $deviceId = $event['deviceId'] ?? null;

            if (! $type || ! isset($allowedTypes[$type]) || ! $deviceId) {
                continue;
            }

            $mapped = $deviceMap[(int) $deviceId] ?? null;
            if (! $mapped) {
                continue;
            }

            if ($rentalFilter && (int) $rentalFilter !== (int) $mapped['rental_id']) {
                continue;
            }

            $payload[] = [
                'rental_id' => $mapped['rental_id'],
                'car_id' => $mapped['car_id'],
                'license_plate' => $mapped['license_plate'],
                'type' => $type,
                'message' => $allowedTypes[$type],
                'event_time' => $event['eventTime'] ?? ($event['serverTime'] ?? null),
            ];
        }

        usort($payload, fn ($a, $b) => strcmp((string) $b['event_time'], (string) $a['event_time']));

        $limit = (int) $request->query('limit', 50);
        if ($limit > 0) {
            $payload = array_slice($payload, 0, $limit);
        }

        return response()->json($payload);
    }

    public function rentalTripHistory(int $rentalId, TraccarClient $traccar)
    {
        $rental = Rental::with('car')->findOrFail($rentalId);

        $status = strtolower((string) $rental->status);
        if (! in_array($status, ['active', 'completed'], true)) {
            return response()->json(['message' => 'Rental is not active or completed'], 403);
        }

        $car = $rental->car;
        if (! $car?->traccar_device_id) {
            return response()->json([
                'rental_id' => $rental->id,
                'car_id' => $car?->id,
                'license_plate' => $car?->license_plate ?: ($car?->wwlicense_plate ?? ''),
                'from' => null,
                'to' => null,
                'positions' => [],
            ]);
        }

        $rentalStart = $this->buildRentalTimestamp($rental->start_date, $rental->pickup_time, true);
        $rentalEnd = $status === 'active'
            ? Carbon::now()->toIso8601String()
            : $this->buildRentalTimestamp($rental->end_date, $rental->return_time, false);

        $from = request()->query('from');
        $to = request()->query('to');

        if (($from && ! $to) || ($to && ! $from)) {
            return response()->json(['message' => 'Both from and to are required.'], 422);
        }

        if ($from && $to) {
            try {
                $from = Carbon::parse($from)->toIso8601String();
                $to = Carbon::parse($to)->toIso8601String();
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Invalid date range.'], 422);
            }

        } else {
            $from = $rentalStart;
            $to = $rentalEnd;
        }

        $positions = [];
        if ($from && $to) {
            $positions = $traccar->getPositionHistory((int) $car->traccar_device_id, $from, $to);
        }

        $payload = array_map(function ($position) {
            return [
                'latitude' => $position['latitude'] ?? null,
                'longitude' => $position['longitude'] ?? null,
                'speed' => $position['speed'] ?? 0,
                'time' => $position['deviceTime'] ?? ($position['fixTime'] ?? null),
            ];
        }, $positions);

        $payload = array_values(array_filter($payload, fn ($item) => $item['latitude'] !== null && $item['longitude'] !== null));

        return response()->json([
            'rental_id' => $rental->id,
            'car_id' => $car->id,
            'license_plate' => $car->license_plate ?: ($car->wwlicense_plate ?? ''),
            'from' => $from,
            'to' => $to,
            'rental_start' => $rentalStart,
            'rental_end' => $rentalEnd,
            'positions' => $payload,
        ]);
    }

    private function buildRentalTimestamp($date, ?string $time, bool $start): ?string
    {
        if (! $date) {
            return null;
        }

        $dateTime = $time ? Carbon::parse($date->toDateString() . ' ' . $time) : Carbon::parse($date->toDateString());

        if (! $time) {
            $dateTime = $start ? $dateTime->startOfDay() : $dateTime->endOfDay();
        }

        return $dateTime->toIso8601String();
    }
}
