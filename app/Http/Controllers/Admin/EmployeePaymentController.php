<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeePayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EmployeePaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'role:admin']);
    }

    /**
     * Show payments for an employee with schedule-aware summaries.
     */
    public function index(Employee $employee)
    {
        $employee->load('payments');

        // Current period (start/end) anchored on monthly_day / weekly_day
        $period = $this->currentPeriod($employee);

        // How much should be paid this period (monthly/weekly/daily)
        $targetAmount = $this->targetAmountForPeriod($employee);

        // Paid inside the current period
        $paidInPeriod = $employee->payments()
            ->whereBetween('payment_date', [$period['start'], $period['end']])
            ->sum('amount');

        $reste = max(0, ($targetAmount ?? 0) - $paidInPeriod);

        // -------- Nouveau : Calcul période précédente (carry-over) --------
        $prevPeriod = $this->previousPeriod($employee, $period['start']);
        $prevTarget = $this->targetAmountForPeriod($employee);

        $prevPaid = $employee->payments()
            ->whereBetween('payment_date', [$prevPeriod['start'], $prevPeriod['end']])
            ->sum('amount');

        $prevReste = max(0, ($prevTarget ?? 0) - $prevPaid);

        // Total dû "aujourd'hui" en ajoutant l'ancien impayé
        $dueWithCarry = ($targetAmount ?? 0) + $prevReste;

        // Additional summaries for UI
        [$breakdownLabel, $breakdown] = $this->periodBreakdown($employee, $period['start'], $period['end']);

        return Inertia::render('Employees/Show', [
            'employee'       => $employee,
            'period'         => [
                'label' => $period['label'],
                'start' => $period['start']->toDateString(),
                'end'   => $period['end']->toDateString(),
            ],
            'targetAmount'   => $targetAmount,
            'paidInPeriod'   => (float) $paidInPeriod,
            'reste'          => (float) $reste,

            // ---- Props liées au carry-over ----
            'prevPeriod'       => [
                'label' => $prevPeriod['label'],
                'start' => $prevPeriod['start']->toDateString(),
                'end'   => $prevPeriod['end']->toDateString(),
            ],
            'prevTargetAmount' => $prevTarget,
            'prevPaidInPeriod' => (float) $prevPaid,
            'prevReste'        => (float) $prevReste,
            'dueWithCarry'     => (float) $dueWithCarry,

            'breakdownLabel' => $breakdownLabel,
            'breakdown'      => $breakdown,
            'payments'       => $employee->payments()->orderByDesc('payment_date')->get(),
        ]);
    }

    /**
     * Store new payment.
     * Optionally merges previous period arrears into the amount if 'merge_prev_arrears' is true.
     */
    public function store(Request $request, Employee $employee)
    {
        $request->validate([
            'amount'             => 'required|numeric|min:0',
            'payment_date'       => 'required|date',
            'notes'              => 'nullable|string|max:255',
            'merge_prev_arrears' => 'nullable|boolean',
        ]);

        $amount = (float) $request->amount;

        // ---- Nouveau : inclure l’impayé de la période précédente si demandé ----
        if ($request->boolean('merge_prev_arrears')) {
            $current = $this->currentPeriod($employee);
            $prev    = $this->previousPeriod($employee, $current['start']);

            $prevPaid = $employee->payments()
                ->whereBetween('payment_date', [$prev['start'], $prev['end']])
                ->sum('amount');

            $prevTarget = $this->targetAmountForPeriod($employee);
            $prevReste  = max(0, ($prevTarget ?? 0) - $prevPaid);

            $amount += $prevReste;
        }

        $employee->payments()->create([
            'amount'       => $amount,
            'payment_date' => $request->payment_date,
            'notes'        => $request->notes,
        ]);

        return redirect()->back()->with('success', 'Paiement ajouté avec succès.');
    }

    /**
     * Delete a payment.
     */
    public function destroy(EmployeePayment $employeePayment)
    {
        $employeePayment->delete();

        return response()->json([
            'message' => 'Payment deleted successfully.',
        ]);
    }

    // -------------------------
    // Helpers
    // -------------------------

    /**
     * Determine current pay period window based on employee schedule.
     * Anchors:
     * - monthly: Jour du mois (1..28)
     * - weekly : Jour de la semaine (0..6, Dim..Sam)
     * - daily  : aujourd’hui
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
     * **** Nouveau ****
     * Get the previous period window, based on the start of the current one.
     * We step one day before the current start, then recompute "currentPeriod" at that date.
     */
    protected function previousPeriod(Employee $employee, Carbon $startOfCurrent): array
    {
        $ref = $startOfCurrent->copy()->subDay()->startOfDay();
        $prev = $this->currentPeriod($employee, $ref);

        // Adapter le libellé pour indiquer "précédente"
        $prev['label'] = match ($employee->pay_schedule) {
            'monthly' => 'Période mensuelle (précédente)',
            'weekly'  => 'Période hebdomadaire (précédente)',
            'daily'   => 'Période quotidienne (précédente)',
            default   => 'Période (précédente)',
        };

        return $prev;
    }

    /**
     * Mensuel: période ancrée sur monthly_day:
     * [prevAnchor + 1 jour, nextAnchor] (non chevauchante).
     */
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

        $next = $this->nextMonthlyAnchor($ref, $day);   // ex: prochain "5" (ou aujourd’hui si on est le 5)
        $prev = $next->copy()->subMonth();              // le "5" précédent

        return [
            'start' => $prev->copy()->addDay()->startOfDay(), // prev+1 (exclure l’ancre précédente)
            'end'   => $next->copy()->endOfDay(),             // inclure l’ancre courante
            'label' => "Période mensuelle (ancrée jour $day)",
        ];
    }

    /**
     * Hebdo: période ancrée sur weekly_day (0=Dim..6=Sam):
     * [prevAnchor + 1 jour, nextAnchor].
     */
    protected function currentWeeklyPeriod(Employee $employee, Carbon $ref): array
    {
        $w = $employee->weekly_day;
        if ($w === null) {
            // fallback: semaine ISO si non configuré
            return [
                'start' => $ref->copy()->startOfWeek(Carbon::MONDAY),
                'end'   => $ref->copy()->endOfWeek(Carbon::SUNDAY),
                'label' => 'Période hebdomadaire (semaine ISO)',
            ];
        }

        $next = $this->nextWeekdayAnchor($ref, (int) $w); // prochain jour w (ou aujourd’hui si on est ce jour)
        $prev = $next->copy()->subWeek();                 // même jour la semaine passée

        return [
            'start' => $prev->copy()->addDay()->startOfDay(), // exclure l’ancre précédente
            'end'   => $next->copy()->endOfDay(),             // inclure l’ancre courante
            'label' => "Période hebdomadaire (ancrée jour $w)",
        ];
    }

    /**
     * Prochaine ancre mensuelle (jour du mois 1..28), "aujourd’hui" inclus si on est déjà au bon jour.
     */
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

        // si l'ancre de ce mois est passée (strictement avant aujourd’hui), on passe au mois suivant
        if ($candidate->lt($from->copy()->startOfDay())) {
            $candidate->addMonth();
        }
        return $candidate->startOfDay();
    }

    /**
     * Prochaine ancre hebdo pour un weekday (0=Dim..6=Sam), "aujourd’hui" inclus si on est le bon jour.
     */
    protected function nextWeekdayAnchor(Carbon $from, int $weekday0to6): Carbon
    {
        $weekday0to6 = max(0, min(6, $weekday0to6));
        $candidate = $from->copy()->startOfDay();

        // avancer jusqu’au prochain jour voulu; si c’est déjà aujourd’hui, on s’arrête
        while ((int) $candidate->dayOfWeek !== $weekday0to6) {
            $candidate->addDay();
        }

        return $candidate;
    }

    /**
     * Return the target amount for the current period.
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

    /**
     * Build a UI-friendly breakdown for the current period.
     * - monthly → group by ISO week
     * - weekly/daily → group by day
     */
    protected function periodBreakdown(Employee $employee, Carbon $start, Carbon $end): array
    {
        if ($employee->pay_schedule === 'monthly') {
            // Use a non-reserved alias (week_key) instead of "key"
            $rows = $employee->payments()
                ->select(
                    DB::raw("CONCAT(YEAR(payment_date), '-', LPAD(WEEK(payment_date, 1), 2, '0')) as week_key"),
                    DB::raw("MIN(payment_date) as start_date"),
                    DB::raw("MAX(payment_date) as end_date"),
                    DB::raw("SUM(amount) as total")
                )
                ->whereBetween('payment_date', [$start, $end])
                ->groupBy('week_key')
                ->orderBy('start_date')
                ->get()
                ->map(function ($row) {
                    return [
                        'key'        => $row->week_key,
                        'start_date' => Carbon::parse($row->start_date)->toDateString(),
                        'end_date'   => Carbon::parse($row->end_date)->toDateString(),
                        'total'      => (float) $row->total,
                    ];
                });

            return ['Récap par semaine (période courante)', $rows];
        }

        // Weekly / Daily → group by day
        $rows = $employee->payments()
            ->select(
                DB::raw("DATE(payment_date) as day_key"),
                DB::raw("SUM(amount) as total")
            )
            ->whereBetween('payment_date', [$start, $end])
            ->groupBy('day_key')
            ->orderBy('day_key')
            ->get()
            ->map(function ($row) {
                return [
                    'key'        => $row->day_key,
                    'start_date' => $row->day_key,
                    'total'      => (float) $row->total,
                ];
            });

        return ['Récap par jour (période courante)', $rows];
    }
}
