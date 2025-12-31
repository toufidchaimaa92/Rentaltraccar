<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'employee_type',    // 'coffee' | 'location'
        'pay_schedule',     // 'monthly' | 'weekly' | 'daily'
        'monthly_day',      // 1..28 (if monthly)
        'weekly_day',       // 0..6  (Sun..Sat; if weekly)

        // salaries (only one applies per schedule)
        'monthly_salary',   // required if monthly
        'weekly_salary',    // required if weekly
        'daily_rate',       // required if daily

        'is_active',
    ];

    protected $casts = [
        'monthly_day'     => 'integer',
        'weekly_day'      => 'integer',
        'monthly_salary'  => 'decimal:2',
        'weekly_salary'   => 'decimal:2',
        'daily_rate'      => 'decimal:2',
        'is_active'       => 'boolean',
    ];

    /**
     * All payments made to this employee.
     */
    public function payments()
    {
        return $this->hasMany(EmployeePayment::class);
    }

    /**
     * Sum of all payments made to this employee.
     */
    public function totalPaid(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    /**
     * Scope: only active employees.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Return the relevant salary value based on pay_schedule.
     * - monthly  -> monthly_salary
     * - weekly   -> weekly_salary
     * - daily    -> daily_rate
     */
    public function currentSalaryAmount(): ?float
    {
        return match ($this->pay_schedule) {
            'monthly' => $this->monthly_salary !== null ? (float) $this->monthly_salary : null,
            'weekly'  => $this->weekly_salary  !== null ? (float) $this->weekly_salary  : null,
            'daily'   => $this->daily_rate      !== null ? (float) $this->daily_rate      : null,
            default   => null,
        };
    }

    /**
     * Compute the next scheduled pay date based on pay_schedule and day fields.
     * Returns a Carbon date or null if the configuration is incomplete.
     */
    public function nextPayDate(?Carbon $from = null): ?Carbon
    {
        $from = $from ?: now();

        return match ($this->pay_schedule) {
            'daily'   => $from->copy()->addDay()->startOfDay(),
            'weekly'  => $this->weekly_day !== null
                ? $from->copy()->next($this->weekdayName($this->weekly_day))->startOfDay()
                : null,
            'monthly' => $this->monthly_day !== null
                ? $this->nextMonthlyDate($from, $this->monthly_day)
                : null,
            default   => null,
        };
    }

    /**
     * Convert numeric weekday (0..6) to Carbon's expected string name.
     */
    protected function weekdayName(int $weekday): string
    {
        return [
            'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
        ][$weekday] ?? 'Monday';
    }

    /**
     * Next YYYY-MM-{day} (clamped to 1..28 to avoid month-end gaps).
     */
    protected function nextMonthlyDate(Carbon $from, int $day): Carbon
    {
        $day = max(1, min(28, $day));
        $candidate = Carbon::create($from->year, $from->month, $day, 0, 0, 0);

        if ($candidate->lessThanOrEqualTo($from)) {
            $candidate->addMonth();
        }

        return $candidate->startOfDay();
    }
}
