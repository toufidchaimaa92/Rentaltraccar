<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class EmployeeController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:admin']); // Admin only
    }

    /**
     * Display a listing of employees with schedule-anchored period/paid/reste stats,
     * including full carry-over (impayés cumulés sur toutes les périodes précédentes).
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search'         => ['nullable', 'string', 'max:255'],
            'employee_type'  => ['nullable', 'in:coffee,location'],
            'pay_schedule'   => ['nullable', 'in:monthly,weekly,daily'],
            'status'         => ['nullable', 'in:active,inactive'],
            'sort'           => ['nullable', 'string', 'max:50'],
        ]);

        $sortParam = $validated['sort'] ?? null;
        $sortDir = 'asc';
        $sortBy = 'name';

        if (is_string($sortParam)) {
            [$by, $dir] = array_pad(explode('_', $sortParam), 2, null);
            $allowedSorts = [
                'name'          => 'name',
                'type'          => 'employee_type',
                'schedule'      => 'pay_schedule',
                'status'        => 'is_active',
                'payments'      => 'payments_count',
            ];

            if (isset($allowedSorts[$by])) {
                $sortBy = $allowedSorts[$by];
                $sortDir = $dir === 'desc' ? 'desc' : 'asc';
            }
        }

        $employeesQuery = Employee::query()
            ->withCount('payments')
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('employee_type', 'like', "%{$search}%");
                });
            })
            ->when($validated['employee_type'] ?? null, function ($query, $type) {
                $query->where('employee_type', $type);
            })
            ->when($validated['pay_schedule'] ?? null, function ($query, $schedule) {
                $query->where('pay_schedule', $schedule);
            })
            ->when($validated['status'] ?? null, function ($query, $status) {
                $query->where('is_active', $status === 'active');
            })
            ->orderBy($sortBy, $sortDir);

        $employees = $employeesQuery
            ->paginate(10)
            ->withQueryString()
            ->through(function (Employee $e) {
                // Fenêtre de période ANCRÉE sur monthly_day / weekly_day
                $period = $this->currentPeriod($e);

                // Montant attendu pour la période (mensuel/hebdo/quotidien)
                $target = $this->targetAmountForPeriod($e);

                // Somme payée dans la fenêtre courante
                $paid = $e->payments()
                    ->whereBetween('payment_date', [$period['start'], $period['end']])
                    ->sum('amount');

                $resteInPeriod = max(0, ($target ?? 0) - $paid);

                // ------- Pour l'affichage uniquement : période précédente -------
                $prevPeriod = $this->previousPeriod($e, $period['start']);
                $prevTarget = $this->targetAmountForPeriod($e);
                $prevPaid = $e->payments()
                    ->whereBetween('payment_date', [$prevPeriod['start'], $prevPeriod['end']])
                    ->sum('amount');
                $prevReste = max(0, ($prevTarget ?? 0) - $prevPaid);

                // ------- Cumuler TOUT l'impayé depuis le début -------
                // Point de départ "début d'emploi" : created_at si dispo, sinon 1ère date de paiement, sinon large fallback.
                $employeeStart = $e->created_at
                    ?? $e->payments()->min('payment_date')
                    ?? $period['start']->copy()->subYears(20);

                $dueCumulative = (float) $resteInPeriod; // commence par la période courante
                $totalPaidToDate = (float) $e->payments()
                    ->whereDate('payment_date', '<=', $period['end'])
                    ->sum('amount');

                // Compteur "attendu" global pour info (inclura la période courante plus bas)
                $totalExpected = 0.0;

                // Remonte période par période jusqu'à employeeStart (exclus)
                $cursorStart = $period['start']->copy();
                $iterations = 0;
                $maxIterations = 4000; // garde-fou : largement suffisant

                while ($cursorStart->gt(Carbon::parse($employeeStart)->startOfDay()) && $iterations++ < $maxIterations) {
                    $prev = $this->previousPeriod($e, $cursorStart);

                    $perPeriodTarget = $this->targetAmountForPeriod($e);
                    $prevPaidLoop = $e->payments()
                        ->whereBetween('payment_date', [$prev['start'], $prev['end']])
                        ->sum('amount');

                    $prevResteLoop = max(0, ($perPeriodTarget ?? 0) - $prevPaidLoop);

                    $dueCumulative += (float) $prevResteLoop;
                    $totalExpected += (float) ($perPeriodTarget ?? 0);

                    $cursorStart = $prev['start']->copy();
                }

                // Ajoute la période courante à l'attendu global
                $totalExpected += (float) ($target ?? 0);

                // DTO propre (on ne modifie pas l’instance Eloquent)
                return [
                    'id'              => $e->id,
                    'name'            => $e->name,
                    'employee_type'   => $e->employee_type,
                    'pay_schedule'    => $e->pay_schedule,
                    'monthly_day'     => $e->monthly_day,
                    'weekly_day'      => $e->weekly_day,
                    'monthly_salary'  => $e->monthly_salary,
                    'weekly_salary'   => $e->weekly_salary,
                    'daily_rate'      => $e->daily_rate,
                    'is_active'       => (bool) $e->is_active,
                    'payments_count'  => (int) ($e->payments_count ?? 0),

                    // Champs dérivés (non stockés en DB)
                    'next_pay_date'   => optional($e->nextPayDate())->toDateString(),
                    'period'          => [
                        'label' => $period['label'],
                        'start' => $period['start']->toDateString(),
                        'end'   => $period['end']->toDateString(),
                    ],
                    'target_amount'   => $target,
                    'paid_in_period'  => (float) $paid,
                    'reste_in_period' => (float) $resteInPeriod,

                    // Période précédente (pour l'UX, facultatif)
                    'prev_period'     => [
                        'label' => $prevPeriod['label'],
                        'start' => $prevPeriod['start']->toDateString(),
                        'end'   => $prevPeriod['end']->toDateString(),
                    ],
                    'prev_reste'      => (float) $prevReste,

                    // ✅ Total dû cumulé sur toutes les périodes depuis le début
                    'due_with_carry'  => (float) $dueCumulative,

                    // ✅ Stats globales optionnelles
                    'total_expected_to_date' => (float) $totalExpected,
                    'total_paid_to_date'     => (float) $totalPaidToDate,
                ];
            });

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'filters'   => [
                'search'        => $validated['search'] ?? null,
                'employee_type' => $validated['employee_type'] ?? null,
                'pay_schedule'  => $validated['pay_schedule'] ?? null,
                'status'        => $validated['status'] ?? null,
                'sort'          => $validated['sort'] ?? 'name_asc',
            ],
        ]);
    }

    /**
     * Show the form for creating a new employee.
     */
    public function create()
    {
        return Inertia::render('Employees/Create', [
            'meta' => [
                'employee_types' => ['coffee', 'location'],
                'pay_schedules'  => ['monthly', 'weekly', 'daily'],

                // ✅ Jours de la semaine (0..6) mais affichage commençant par Lundi
                'weekdays'       => [
                    ['value' => 1, 'label' => 'Lundi'],
                    ['value' => 2, 'label' => 'Mardi'],
                    ['value' => 3, 'label' => 'Mercredi'],
                    ['value' => 4, 'label' => 'Jeudi'],
                    ['value' => 5, 'label' => 'Vendredi'],
                    ['value' => 6, 'label' => 'Samedi'],
                    ['value' => 0, 'label' => 'Dimanche'],
                ],

                'monthly_days'   => range(1, 28), // 1..28
            ],
        ]);
    }

    /**
     * Store a newly created employee.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',

            // Schedules & types
            'employee_type'  => 'required|in:coffee,location',
            'pay_schedule'   => 'required|in:monthly,weekly,daily',

            // Days (conditional)
            'monthly_day'    => 'nullable|required_if:pay_schedule,monthly|integer|between:1,28',
            'weekly_day'     => 'nullable|required_if:pay_schedule,weekly|integer|between:0,6',

            // Salaries (conditional)
            'monthly_salary' => 'nullable|required_if:pay_schedule,monthly|numeric|min:0',
            'weekly_salary'  => 'nullable|required_if:pay_schedule,weekly|numeric|min:0',
            'daily_rate'     => 'nullable|required_if:pay_schedule,daily|numeric|min:0',

            'is_active'      => 'sometimes|boolean',
        ]);

        // Normalisation des champs non pertinents
        if (($data['pay_schedule'] ?? null) !== 'monthly') {
            $data['monthly_day'] = null;
            $data['monthly_salary'] = null;
        }
        if (($data['pay_schedule'] ?? null) !== 'weekly') {
            $data['weekly_day'] = null;
            $data['weekly_salary'] = null;
        }
        if (($data['pay_schedule'] ?? null) !== 'daily') {
            $data['daily_rate'] = null;
        }

        $data['is_active'] = $data['is_active'] ?? true;

        Employee::create($data);

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Employee created successfully.');
    }

    /**
     * Show the form for editing an employee.
     */
    public function edit(Employee $employee)
    {
        return Inertia::render('Employees/Edit', [
            'employee' => $employee,
            'meta' => [
                'employee_types' => ['coffee', 'location'],
                'pay_schedules'  => ['monthly', 'weekly', 'daily'],

                // ✅ Jours en français (affichage Lundi→Dimanche)
                'weekdays'       => [
                    ['value' => 1, 'label' => 'Lundi'],
                    ['value' => 2, 'label' => 'Mardi'],
                    ['value' => 3, 'label' => 'Mercredi'],
                    ['value' => 4, 'label' => 'Jeudi'],
                    ['value' => 5, 'label' => 'Vendredi'],
                    ['value' => 6, 'label' => 'Samedi'],
                    ['value' => 0, 'label' => 'Dimanche'],
                ],

                'monthly_days'   => range(1, 28),
            ],
        ]);
    }

    /**
     * Update an employee.
     */
    public function update(Request $request, Employee $employee)
    {
        $data = $request->validate([
            'name'           => 'required|string|max:255',

            'employee_type'  => 'required|in:coffee,location',
            'pay_schedule'   => 'required|in:monthly,weekly,daily',

            'monthly_day'    => 'nullable|required_if:pay_schedule,monthly|integer|between:1,28',
            'weekly_day'     => 'nullable|required_if:pay_schedule,weekly|integer|between:0,6',

            'monthly_salary' => 'nullable|required_if:pay_schedule,monthly|numeric|min:0',
            'weekly_salary'  => 'nullable|required_if:pay_schedule,weekly|numeric|min:0',
            'daily_rate'     => 'nullable|required_if:pay_schedule,daily|numeric|min:0',

            'is_active'      => 'sometimes|boolean',
        ]);

        if ($data['pay_schedule'] !== 'monthly') {
            $data['monthly_day'] = null;
            $data['monthly_salary'] = null;
        }
        if ($data['pay_schedule'] !== 'weekly') {
            $data['weekly_day'] = null;
            $data['weekly_salary'] = null;
        }
        if ($data['pay_schedule'] !== 'daily') {
            $data['daily_rate'] = null;
        }

        // Conserver is_active si non envoyé
        if (!array_key_exists('is_active', $data)) {
            $data['is_active'] = $employee->is_active;
        }

        $employee->update($data);

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Employee updated successfully.');
    }

    /**
     * Delete an employee.
     */
    public function destroy(Employee $employee)
    {
        $employee->delete();

        return redirect()
            ->route('admin.employees.index')
            ->with('success', 'Employee deleted successfully.');
    }

    /**
     * Show payment history of an employee.
     */
    public function payments(Employee $employee)
    {
        $payments = $employee->payments()->orderByDesc('payment_date')->get();

        return Inertia::render('Employees/Payments', [
            'employee'      => $employee,
            'payments'      => $payments,
            'next_pay_date' => optional($employee->nextPayDate())->toDateString(),
        ]);
    }

    // ------------------------------------------------------------------
    // Helpers used by index(): schedule-anchored current period & target
    // ------------------------------------------------------------------

    /**
     * Détermine la fenêtre de période courante selon l’ancre :
     * - monthly : Jour du mois (1..28)  → [prevAnchor + 1j, nextAnchor]
     * - weekly  : Jour de la semaine (0..6) → [prevAnchor + 1j, nextAnchor]
     * - daily   : aujourd’hui
     */
    protected function currentPeriod(Employee $employee, ?Carbon $ref = null): array
    {
        $ref = ($ref ?: now())->copy()->startOfDay();

        return match ($employee->pay_schedule) {
            'monthly' => $this->currentMonthlyPeriod($employee, $ref),
            'weekly'  => $this->currentWeeklyPeriod($employee, $ref),
            'daily'   => [
                'start' => $ref->copy()->startOfDay(),
                'end'   => $ref->copy()->endOfDay(),
                'label' => 'Période quotidienne (aujourd’hui)',
            ],
            default   => [
                'start' => $ref->copy()->startOfMonth(),
                'end'   => $ref->copy()->endOfMonth(),
                'label' => 'Période (par défaut: mois en cours)',
            ],
        };
    }

    /**
     * Renvoie la fenêtre de la période précédente en partant du début de la période courante.
     * On recule d’un jour, puis on recalcule "currentPeriod" à cette date.
     */
    protected function previousPeriod(Employee $employee, Carbon $startOfCurrent): array
    {
        $ref = $startOfCurrent->copy()->subDay()->startOfDay();
        $prev = $this->currentPeriod($employee, $ref);

        $prev['label'] = match ($employee->pay_schedule) {
            'monthly' => 'Période mensuelle (précédente)',
            'weekly'  => 'Période hebdomadaire (précédente)',
            'daily'   => 'Période quotidienne (précédente)',
            default   => 'Période (précédente)',
        };

        return $prev;
    }

    protected function currentMonthlyPeriod(Employee $employee, Carbon $ref): array
    {
        $day = (int) ($employee->monthly_day ?? 0);
        if ($day < 1 || $day > 28) {
            // fallback: mois calendaire si non configuré
            return [
                'start' => $ref->copy()->startOfMonth(),
                'end'   => $ref->copy()->endOfMonth(),
                'label' => 'Période mensuelle (mois calendaire)',
            ];
        }

        $next = $this->nextMonthlyAnchor($ref, $day); // prochain "day" (ou aujourd’hui si on est ce jour)
        $prev = $next->copy()->subMonth();

        return [
            'start' => $prev->copy()->addDay()->startOfDay(), // exclure l’ancre précédente
            'end'   => $next->copy()->endOfDay(),             // inclure l’ancre courante
            'label' => "Période mensuelle (ancrée jour $day)",
        ];
    }

    protected function currentWeeklyPeriod(Employee $employee, Carbon $ref): array
    {
        $w = $employee->weekly_day;
        if ($w === null) {
            // fallback: semaine ISO si non configuré (Lundi → Dimanche)
            return [
                'start' => $ref->copy()->startOfWeek(Carbon::MONDAY),
                'end'   => $ref->copy()->endOfWeek(Carbon::SUNDAY),
                'label' => 'Période hebdomadaire (semaine ISO)',
            ];
        }

        $next = $this->nextWeekdayAnchor($ref, (int) $w); // prochain jour w (ou aujourd’hui si on est ce jour)
        $prev = $next->copy()->subWeek();

        $nameFr = $this->frWeekdayName((int) $w);

        return [
            'start' => $prev->copy()->addDay()->startOfDay(), // exclure l’ancre précédente
            'end'   => $next->copy()->endOfDay(),             // inclure l’ancre courante
            'label' => "Période hebdomadaire (ancrée au $nameFr)",
        ];
    }

    protected function nextMonthlyAnchor(Carbon $from, int $day): Carbon
    {
        $day = max(1, min(28, $day));
        $candidate = Carbon::create(
            $from->year,
            $from->month,
            $day,
            0,
            0,
            0,
            $from->getTimezone()
        );

        // si l'ancre de ce mois est passée (strictement avant aujourd’hui), passer au mois suivant
        if ($candidate->lt($from->copy()->startOfDay())) {
            $candidate->addMonth();
        }
        return $candidate->startOfDay();
    }

    protected function nextWeekdayAnchor(Carbon $from, int $weekday0to6): Carbon
    {
        $weekday0to6 = max(0, min(6, $weekday0to6));
        $candidate = $from->copy()->startOfDay();

        while ((int) $candidate->dayOfWeek !== $weekday0to6) {
            $candidate->addDay();
        }

        return $candidate;
    }

    protected function frWeekdayName(int $weekday0to6): string
    {
        $map = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return $map[max(0, min(6, $weekday0to6))];
    }

    /**
     * Montant attendu pour la période courante.
     */
    protected function targetAmountForPeriod(Employee $employee): ?float
    {
        return match ($employee->pay_schedule) {
            'monthly' => $employee->monthly_salary !== null ? (float) $employee->monthly_salary : null,
            'weekly'  => $employee->weekly_salary  !== null ? (float) $employee->weekly_salary  : null,
            'daily'   => $employee->daily_rate     !== null ? (float) $employee->daily_rate     : null,
            default   => null,
        };
    }
}
