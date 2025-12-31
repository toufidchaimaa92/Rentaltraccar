<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\CarExpense;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CarExpenseController extends Controller
{
    private const ALLOWED_TYPES = ['mecanique', 'carrosserie', 'entretien', 'lavage'];

    private const TYPE_ALIASES = [
        // mécanique
        'mecanic' => 'mecanique',
        'mechanic' => 'mecanique',
        'reparation' => 'mecanique',
        'reparation mecanic' => 'mecanique',
        'reparation mécanique' => 'mecanique',
        'réparation mécanique' => 'mecanique',
        // carrosserie
        'bodywork' => 'carrosserie',
        // entretien
        'entrtien' => 'entretien',
        'maintenance' => 'entretien',
        'maint' => 'entretien',
        // lavage
        'wash' => 'lavage',
        'washing' => 'lavage',
        'nettoyage' => 'lavage',
        'clean' => 'lavage',
    ];

    public function index($carId)
    {
        $car = Car::with('expenses')->findOrFail($carId);

        return Inertia::render('Cars/Expenses/Index', [
            'car' => $car,
            'expenses' => $car->expenses()->orderBy('expense_date', 'desc')->get(),
            'allowedTypes' => self::ALLOWED_TYPES,
        ]);
    }

    public function create($carId)
    {
        $car = Car::findOrFail($carId);

        return Inertia::render('Cars/Expenses/Create', [
            'car' => $car,
            'allowedTypes' => self::ALLOWED_TYPES,
        ]);
    }

    public function store(Request $request, $carId)
    {
        $request->merge([
            'expense_date' => $this->parseDate($request->input('expense_date')),
            'type' => $this->normalizeType($request->input('type')),
        ]);

        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(self::ALLOWED_TYPES)],
            'invoice_number' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $validated['car_id'] = $carId;

        CarExpense::create($validated);

        // ⬇️ redirect to the car show page instead of the expenses index
        return redirect()
            ->route('cars.show', ['car' => $carId])
            ->with('success', 'Expense added successfully.');
    }

    public function edit($carId, $expenseId)
    {
        $car = Car::findOrFail($carId);
        $expense = CarExpense::findOrFail($expenseId);

        return Inertia::render('Cars/Expenses/Edit', [
            'car' => $car,
            'expense' => $expense,
            'allowedTypes' => self::ALLOWED_TYPES,
        ]);
    }

    public function update(Request $request, $carId, $expenseId)
    {
        $expense = CarExpense::findOrFail($expenseId);

        $request->merge([
            'expense_date' => $this->parseDate($request->input('expense_date')),
            'type' => $this->normalizeType($request->input('type')),
        ]);

        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(self::ALLOWED_TYPES)],
            'invoice_number' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $expense->update($validated);

        // ⬇️ redirect to the car show page after update too
        return redirect()
            ->route('cars.show', ['car' => $carId])
            ->with('success', 'Expense updated successfully.');
    }

    public function destroy($carId, $expenseId)
    {
        $expense = CarExpense::findOrFail($expenseId);
        $expense->delete();

        return redirect()
            ->route('car-expenses.index', ['carId' => $carId])
            ->with('success', 'Expense deleted successfully.');
    }

    private function parseDate($date)
    {
        if (!$date) return null;

        try {
            return Carbon::createFromFormat('d/m/Y', $date)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function normalizeType($type): ?string
    {
        if (!$type) return null;

        $normalized = Str::of($type)->squish()->lower();
        $normalizedAscii = Str::ascii($normalized);

        if (in_array($normalizedAscii, self::ALLOWED_TYPES, true)) {
            return $normalizedAscii;
        }

        if (array_key_exists($normalizedAscii, self::TYPE_ALIASES)) {
            return self::TYPE_ALIASES[$normalizedAscii];
        }

        return $normalizedAscii;
    }
}
