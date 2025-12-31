<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Rental;
use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function create($rentalId)
    {
        $rental = Rental::with('client')->findOrFail($rentalId);

        return view('payments.create', compact('rental'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rental_id' => 'required|exists:rentals,id',
            'client_id' => 'required|exists:clients,id',
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:cash,virement,cheque',
            'reference' => 'nullable|string|max:255',
        ]);

        $validated['user_id'] = auth()->id();
        $validated['date'] = now(); // date actuelle forcée

        Payment::create($validated);

        $rental = Rental::findOrFail($validated['rental_id']);
        $totalPaid = (float) $rental->payments()->sum('amount');
        $totalAmount = (float) ($rental->effective_total ?? $rental->total_price ?? 0);
        $remainingAmount = max(0, $totalAmount - $totalPaid);

        $date = $rental->end_date ? $rental->end_date->toDateString() : now()->toDateString();
        $query = [
            'date' => $date,
            'view' => 'day',
            'rental_id' => $rental->id,
        ];

        if ($remainingAmount <= 0) {
            $query['completed_payment'] = 1;
        }

        return redirect()->to('/calendar/day?' . http_build_query($query))
            ->with('success', 'Paiement ajouté avec succès.');
    }

    public function index()
    {
        $payments = Payment::with(['client', 'rental', 'user'])
            ->orderBy('date', 'desc')
            ->paginate(20);

        return view('payments.index', compact('payments'));
    }

    public function byClient($clientId)
    {
        $client = Client::findOrFail($clientId);

        $payments = Payment::with('rental')
            ->where('client_id', $client->id)
            ->orderBy('date', 'desc')
            ->paginate(20);

        return view('payments.by-client', compact('client', 'payments'));
    }

    public function byRental($rentalId)
    {
        $rental = Rental::with('client')->findOrFail($rentalId);

        $payments = Payment::where('rental_id', $rentalId)
            ->orderBy('date', 'desc')
            ->get();

        return view('payments.by-rental', compact('rental', 'payments'));
    }

public function manage($rentalId)
{
    $rental = Rental::with(['client', 'payments.user'])->findOrFail($rentalId);

    // Calcul total payé
    $totalPaid = $rental->payments->sum('amount');

    // Calcul reste à payer
    $remainingAmount = max(0, $rental->total_price - $totalPaid);

    return Inertia::render('Payments/Manage', [
        'rental' => $rental,
        'client' => $rental->client,
        'payments' => $rental->payments->map(function ($payment) {
            return [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'method' => $payment->method,
                'date' => $payment->date,
                'reference' => $payment->reference,
                'user_name' => $payment->user?->name,
            ];
        }),
        'totalPaid' => $totalPaid,
        'remainingAmount' => $remainingAmount,
    ]);
}

}
