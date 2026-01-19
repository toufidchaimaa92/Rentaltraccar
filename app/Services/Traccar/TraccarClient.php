<?php

namespace App\Services\Traccar;

use App\Models\Car;
use Illuminate\Support\Facades\Http;

class TraccarClient
{
    protected string $baseUrl;
    protected string $user;
    protected string $pass;

    public function __construct()
    {
        $this->baseUrl = config('traccar.url');
        $this->user = config('traccar.user');
        $this->pass = config('traccar.pass');
    }

    protected function client()
    {
        return Http::withBasicAuth($this->user, $this->pass)
            ->acceptJson()
            ->timeout(10);
    }

    /** Get all devices */
    public function getDevices(): array
    {
        return $this->client()
            ->get("{$this->baseUrl}/api/devices")
            ->throw()
            ->json();
    }

    /** Get last position by position ID */
    public function getPositionById(int $positionId): ?array
    {
        $data = $this->client()
            ->get("{$this->baseUrl}/api/positions", [
                'id' => $positionId,
            ])
            ->throw()
            ->json();

        return $data[0] ?? null;
    }

    /** Get latest position for a device */
    public function getLatestPositionForDevice(int $deviceId): ?array
    {
        $positions = $this->client()
            ->get("{$this->baseUrl}/api/positions")
            ->throw()
            ->json();

        foreach ($positions as $position) {
            if ($position['deviceId'] === $deviceId) {
                return $position;
            }
        }

        return null;
    }

    /** Get events for the given device IDs */
    public function getEvents(array $deviceIds): array
    {
        return $this->client()
            ->get("{$this->baseUrl}/api/events", [
                'deviceId' => $deviceIds,
            ])
            ->throw()
            ->json();
    }

    /** Get historical positions for a device within a time range */
    public function getPositionHistory(int $deviceId, string $from, string $to): array
    {
        return $this->client()
            ->get("{$this->baseUrl}/api/positions", [
                'deviceId' => $deviceId,
                'from' => $from,
                'to' => $to,
            ])
            ->throw()
            ->json();
    }

    /** Get latest position for a car with an assigned Traccar device */
    public function getLatestPositionForCar(int $carId): ?array
    {
        $car = Car::find($carId);

        if (! $car?->traccar_device_id) {
            return null;
        }

        return $this->getLatestPositionForDevice((int) $car->traccar_device_id);
    }
}
