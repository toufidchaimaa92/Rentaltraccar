<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class Car extends Model
{
    protected $fillable = [
        'car_model_id',
        'license_plate',
        'wwlicense_plate',
        'status',
        'insurance_expiry_date',
        'technical_check_expiry_date',
        'mileage',
        // ✅ financials
        'purchase_price',
        'monthly_credit',
        'credit_start_date',
        'credit_end_date',
        // ✅ new
        'assurance_prix_annuel',
    ];

    protected $casts = [
        'mileage' => 'integer',
        'insurance_expiry_date' => 'date',
        'technical_check_expiry_date' => 'date',
        'credit_start_date' => 'date',
        'credit_end_date' => 'date',
        // ✅ precise money casting
        'purchase_price' => 'decimal:2',
        'monthly_credit' => 'decimal:2',
        'assurance_prix_annuel' => 'decimal:2', // ✅ cast new field
    ];

    /* -------------------- Relationships -------------------- */

    public function carModel()
    {
        return $this->belongsTo(CarModel::class);
    }

    public function benefits()
    {
        return $this->hasMany(CarBenefit::class);
    }

    public function expenses()
    {
        return $this->hasMany(CarExpense::class);
    }

    /* -------------------- Credit helpers -------------------- */

    /**
     * Does the credit period overlap a given [start, end] window?
     */
    public function creditOverlapsPeriod(Carbon $periodStart, Carbon $periodEnd): bool
    {
        $cs = $this->credit_start_date instanceof Carbon ? $this->credit_start_date : ($this->credit_start_date ? Carbon::parse($this->credit_start_date) : null);
        $ce = $this->credit_end_date instanceof Carbon ? $this->credit_end_date : ($this->credit_end_date ? Carbon::parse($this->credit_end_date) : null);

        if (!$this->monthly_credit) {
            return false; // no credit
        }

        if (!$cs) {
            Log::warning('Car monthly_credit missing credit_start_date; treating as always active.', [
                'car_id' => $this->id,
            ]);
            return true; // credit defined without a start date: treat as always active
        }

        // open-ended credit if no end date
        if (!$ce) {
            return $cs->lte($periodEnd);
        }

        // overlap if start <= periodEnd AND end >= periodStart
        return $cs->lte($periodEnd) && $ce->gte($periodStart);
    }

    /**
     * Return the monthly credit to apply for a window (0 or monthly_credit).
     * Use this in your controller when summing monthly expenses.
     */
    public function monthlyCreditForPeriod(Carbon $periodStart, Carbon $periodEnd): float
    {
        return $this->creditOverlapsPeriod($periodStart, $periodEnd) ? (float) $this->monthly_credit : 0.0;
    }

    /* -------------------- Assurance helpers -------------------- */

    /**
     * Return the monthly equivalent of the annual insurance price.
     * Example: 1200.00 €/year → 100.00 €/month
     */
    public function assurancePrixMensuel(): ?float
    {
        if (!$this->assurance_prix_annuel) {
            return null; // no insurance price set
        }

        return round(((float) $this->assurance_prix_annuel) / 12, 2);
    }

    /* -------------------- Accessors -------------------- */

    /**
     * Attribute: credit_summary
     * - paid: total paid so far (clamped to total if end date exists)
     * - months_paid: months counted from start up to today or end (whichever is earlier)
     * - months_total: total months if end date exists; null if open-ended
     * - remaining: remaining amount if months_total known; null otherwise
     */
    public function getCreditSummaryAttribute()
    {
        if (!$this->monthly_credit || !$this->credit_start_date) {
            return null;
        }

        /** @var Carbon $start */
        $start = $this->credit_start_date instanceof Carbon
            ? $this->credit_start_date->copy()->startOfDay()
            : Carbon::parse($this->credit_start_date)->startOfDay();

        /** @var Carbon|null $end */
        $end = $this->credit_end_date
            ? ($this->credit_end_date instanceof Carbon
                ? $this->credit_end_date->copy()->startOfDay()
                : Carbon::parse($this->credit_end_date)->startOfDay())
            : null;

        $today = Carbon::today();

        // Effective limit for counting paid months: up to today, but not beyond end (if any)
        $limit = $end ? $end->min($today) : $today;

        // If credit hasn't started yet or end < start, nothing paid.
        if ($limit->lt($start) || ($end && $end->lt($start))) {
            return [
                'paid'         => 0.0,
                'months_paid'  => 0,
                'months_total' => ($end && $end->gte($start)) ? ($start->diffInMonths($end) + 1) : ($end ? 0 : null),
                'remaining'    => ($end && $end->gte($start)) ? ($start->diffInMonths($end) + 1) * (float) $this->monthly_credit : ($end ? 0.0 : null),
            ];
        }

        // Months paid is month-diff inclusive
        $monthsPaid = $start->diffInMonths($limit) + 1;
        $monthsTotal = $end ? ($start->diffInMonths($end) + 1) : null;

        // Clamp monthsPaid to monthsTotal when closed-ended
        if ($monthsTotal !== null) {
            $monthsPaid = min($monthsPaid, $monthsTotal);
        }

        $paid = $monthsPaid * (float) $this->monthly_credit;
        $remaining = $monthsTotal !== null
            ? max(0, $monthsTotal - $monthsPaid) * (float) $this->monthly_credit
            : null;

        return [
            'paid'         => $paid,
            'months_paid'  => $monthsPaid,
            'months_total' => $monthsTotal,
            'remaining'    => $remaining,
        ];
    }
}
