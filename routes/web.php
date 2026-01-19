<?php

use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;

// Controllers
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CarModelController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\RentalController;
use App\Http\Controllers\RentalActionController;
use App\Http\Controllers\RentalContractController;
use App\Http\Controllers\LongTermRentalController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\FactureController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\Account\ProfileController;
use App\Http\Controllers\Account\SecurityController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\EmployeePaymentController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\DocumentBackgroundController;
use App\Http\Controllers\CarExpenseController;
use App\Http\Controllers\CarBenefitController;
use App\Models\Rental;



// 🌐 Public Welcome Page
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/cars/available', [RentalController::class, 'getAvailableCars'])->middleware(['auth', 'active']);


// 🔐 Admin-only Employee & Payments
Route::middleware(['auth', 'active', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {

    // 👤 Employees CRUD
    Route::resource('employees', EmployeeController::class);

    Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::prefix('pdf-templates')->name('pdf-templates.')->group(function () {
        Route::get('/', [DocumentBackgroundController::class, 'index'])->name('index');
        Route::post('/', [DocumentBackgroundController::class, 'store'])->name('store');
        Route::post('/{documentBackground}/activate', [DocumentBackgroundController::class, 'activate'])->name('activate');
        Route::delete('/{documentBackground}', [DocumentBackgroundController::class, 'destroy'])->name('destroy');
    });

    Route::get('/gps/live-map', fn () => Inertia::render('Gps/LiveMap'))
        ->name('gps.live-map');
    Route::get('/gps/alerts', fn () => Inertia::render('Gps/Alerts'))
        ->name('gps.alerts');

    // 💰 Employee Payments (nested under employees)
    Route::prefix('employees/{employee}')->name('employees.')->group(function () {
        // List all payments for an employee
        Route::get('payments', [EmployeePaymentController::class, 'index'])->name('payments.index');

        // Store a new payment for an employee
        Route::post('payments', [EmployeePaymentController::class, 'store'])->name('payments.store');
    });

    // Optional: Delete a payment
    Route::delete('employee-payments/{employeePayment}', [EmployeePaymentController::class, 'destroy'])
        ->name('employee-payments.destroy');
});


// 🔐 Authenticated Routes
Route::middleware(['auth', 'active'])->group(function () {

    // 📆 Calendar
    Route::get('/calendar', fn () => Inertia::render('Calendar/FullCalendarPage', [
        'initialEvents' => [],
    ]))->name('calendar.full');

    Route::get('/calendar/year', [CalendarController::class, 'yearData'])->name('calendar.year');
    Route::get('/calendar/month', [CalendarController::class, 'monthData'])->name('calendar.month');
    Route::get('/calendar/week', [CalendarController::class, 'weekData'])->name('calendar.week');
    Route::get('/calendar/day', [CalendarController::class, 'dayData'])->name('calendar.day');
    Route::get('/calendar/all', [CalendarController::class, 'yearData'])->name('calendar.all');
    Route::get('/calendar/today', [CalendarController::class, 'dayData'])->name('calendar.today');

    // 📊 Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 🔐 Account - Security
    Route::get('/account/profile', fn () => Redirect::route('security.show'))->name('profile.show');
    Route::patch('/account/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/account/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/account/security', [SecurityController::class, 'show'])->name('security.show');

    // 👤 Clients
    Route::resource('clients', ClientController::class);
    Route::post('/clients/{client}/upload-image', [ClientController::class, 'uploadImage'])->name('clients.uploadImage');
    Route::delete('/clients/{client}/image/{field}', [ClientController::class, 'deleteImage'])->name('clients.deleteImage');
    Route::post('/clients/upload-temp', [ClientController::class, 'uploadTempImage'])->name('clients.uploadTempImage');

    // 🚗 Car Models
    Route::resource('car-models', CarModelController::class);

    // 🚗 Cars
    Route::resource('cars', CarController::class);


// 📄 Rentals
Route::prefix('rentals')->name('rentals.')->group(function () {
    Route::get('/', [RentalController::class, 'index'])->name('index');
    Route::get('/long-term', [LongTermRentalController::class, 'index'])->name('longTerm.index');
    Route::get('/select-type', [RentalController::class, 'selectType'])->name('selectType');
    Route::get('/create/immediate', [RentalController::class, 'createImmediate'])->name('createImmediate');
    Route::get('/create/reservation', [RentalController::class, 'createReservation'])->name('createReservation');
    Route::get('/create/long-term', [LongTermRentalController::class, 'create'])->name('createLongTerm');
    Route::get('/long-term/invoices/{invoice}', [LongTermRentalController::class, 'invoice'])->name('longTerm.invoice.show');
    Route::get('/long-term/invoices/{invoice}/pdf', [LongTermRentalController::class, 'downloadInvoice'])->name('longTerm.invoice.pdf');
    Route::get('/long-term/{rental}', [LongTermRentalController::class, 'show'])->name('longTerm.show');
    Route::post('/', [RentalController::class, 'store'])->name('store');
    Route::post('/long-term', [LongTermRentalController::class, 'store'])->name('storeLongTerm');
    Route::get('/{rental}', [RentalController::class, 'show'])->name('show');
    Route::delete('/{rental}', [RentalController::class, 'destroy'])->name('destroy');
    Route::patch('/{rental}/status', [RentalController::class, 'updateStatus'])->name('status.update');
    Route::post('/{rental}/long-term/payment', [LongTermRentalController::class, 'recordPayment'])->name('longTerm.recordPayment');
    Route::post('/{rental}/long-term/end', [LongTermRentalController::class, 'endRental'])->name('longTerm.end');

    // ✅ Edit & Update routes
    Route::get('/{rental}/edit', [RentalController::class, 'edit'])->name('edit');
    Route::put('/{rental}', [RentalController::class, 'update'])->name('update');

    // 🔁 EXTEND (Inertia)
    // 1) GET: show the extend page (so navigating to /rentals/{id}/extend works via GET)
    Route::get('/{rental}/extend', [RentalActionController::class, 'extendForm'])
        ->name('extend.form');

    // 2) POST/PATCH: submit the extension
    Route::match(['post', 'patch'], '/{rental}/extend', [RentalActionController::class, 'extend'])
        ->name('extend');

    // 🚗 Change Car
    Route::get('/{rental}/change-car', [RentalActionController::class, 'changeCarForm'])
        ->name('changeCar.form');
    Route::post('/{rental}/change-car', [RentalActionController::class, 'changeCar'])
        ->name('changeCar');

    // 📝 Contracts
    Route::get('/{rental}/contract', [RentalContractController::class, 'show'])->name('contract.show');
    Route::get('/{rental}/contract/pdf', [RentalContractController::class, 'downloadPdf'])->name('contract.pdf');

    Route::get('/{rental}/gps', function (Rental $rental) {
        if (strtolower((string) $rental->status) !== 'active') {
            abort(403);
        }

        $rental->load('car.carModel');

        return Inertia::render('Rentals/GpsLocation', [
            'rentalId' => $rental->id,
            'car' => $rental->car ? [
                'brand' => $rental->car->carModel->brand ?? '',
                'model' => $rental->car->carModel->model ?? '',
                'license_plate' => $rental->car->license_plate ?? $rental->car->wwlicense_plate ?? '',
            ] : null,
        ]);
    })->name('gps');

    Route::get('/{rental}/trip-history', function (Rental $rental) {
        $status = strtolower((string) $rental->status);
        if (! in_array($status, ['active', 'completed'], true)) {
            abort(403);
        }

        $rental->load('car.carModel');

        return Inertia::render('Rentals/TripHistory', [
            'rentalId' => $rental->id,
            'status' => $status,
            'car' => $rental->car ? [
                'brand' => $rental->car->carModel->brand ?? '',
                'model' => $rental->car->carModel->model ?? '',
                'license_plate' => $rental->car->license_plate ?? $rental->car->wwlicense_plate ?? '',
            ] : null,
        ]);
    })->name('trip-history');
});



    // 💰 Payments
    Route::prefix('payments')->name('payments.')->group(function () {
        Route::get('/', [PaymentController::class, 'index'])->name('index');
        Route::get('/create/{rental}', [PaymentController::class, 'create'])->name('create');
        Route::post('/', [PaymentController::class, 'store'])->name('store');
        Route::get('/manage/{rental}', [PaymentController::class, 'manage'])->name('manage');
        Route::get('/{payment}/invoice', [InvoiceController::class, 'show'])->name('invoice.show');
        Route::get('/{payment}/invoice/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoice.pdf');

    });



    // 📦 Factures
Route::prefix('factures')->name('factures.')->group(function () {
    Route::get('/', [FactureController::class, 'index'])->name('index');
    Route::get('/create', [FactureController::class, 'create'])->name('create');
    Route::post('/', [FactureController::class, 'store'])->name('store');
    Route::get('/{facture}/edit', [FactureController::class, 'edit'])->name('edit');
    Route::match(['put', 'patch'], '/{facture}', [FactureController::class, 'update'])->name('update');

    // ✅ put the download here
    Route::get('/{facture}/download', [FactureController::class, 'downloadPdf'])->name('download');

    Route::get('/{facture}', [FactureController::class, 'show'])->name('show');
    Route::match(['put', 'patch'], '/{facture}/payment-status', [FactureController::class, 'updatePaymentStatus'])->name('updatePaymentStatus');
    Route::post('/{facture}/pay', [FactureController::class, 'markAsPaid'])->name('pay');
});


    // 🚗 Car Benefits
    Route::prefix('cars/{carId}/benefits')->group(function () {
        Route::get('/', [CarBenefitController::class, 'index'])->name('car-benefits.index');
    });

    Route::prefix('cars/{carId}/expenses')->group(function () {
        Route::get('/', [CarExpenseController::class, 'index'])->name('car-expenses.index');
        Route::get('/create', [CarExpenseController::class, 'create'])->name('car-expenses.create');
        Route::post('/', [CarExpenseController::class, 'store'])->name('car-expenses.store');
        Route::get('/{expenseId}/edit', [CarExpenseController::class, 'edit'])->name('car-expenses.edit');
        Route::put('/{expenseId}', [CarExpenseController::class, 'update'])->name('car-expenses.update');
        Route::delete('/{expenseId}', [CarExpenseController::class, 'destroy'])->name('car-expenses.destroy');
    });



});

require __DIR__ . '/auth.php';
