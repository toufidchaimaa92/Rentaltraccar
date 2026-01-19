<?php

use App\Http\Controllers\Api\TraccarController;
use Illuminate\Support\Facades\Route;

Route::prefix('traccar')->group(function () {
    Route::get('/devices', [TraccarController::class, 'devices']);
    Route::get('/devices/{deviceId}/position', [TraccarController::class, 'devicePosition']);
    Route::get('/cars/positions', [TraccarController::class, 'carPositions']);
    Route::get('/rentals/{rentalId}/position', [TraccarController::class, 'rentalPosition']);
    Route::get('/alerts', [TraccarController::class, 'alerts']);
    Route::get('/rentals/{rentalId}/trip-history', [TraccarController::class, 'rentalTripHistory']);
});
