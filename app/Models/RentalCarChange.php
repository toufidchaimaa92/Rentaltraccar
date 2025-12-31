<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RentalCarChange extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_id',
        'old_car_id',
        'new_car_id',
        'change_date',

        // Totals
        'old_total',
        'new_total',

        // Audit & overrides
        'old_price_per_day',
        'new_price_per_day',
        'old_discount_per_day',
        'new_discount_per_day',
        'override_price_applied',
        'override_total_applied',
        'fees_json',
        'note',

        'changed_by',
    ];

    protected $casts = [
        'change_date'            => 'date',
        'old_total'              => 'decimal:2',
        'new_total'              => 'decimal:2',
        'old_price_per_day'      => 'decimal:2',
        'new_price_per_day'      => 'decimal:2',
        'old_discount_per_day'   => 'decimal:2',
        'new_discount_per_day'   => 'decimal:2',
        'override_price_applied' => 'boolean',
        'override_total_applied' => 'boolean',
        'fees_json'              => 'array',   // JSON <-> array
    ];

    // --- Relationships ---
    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }

    public function oldCar()
    {
        return $this->belongsTo(Car::class, 'old_car_id');
    }

    public function newCar()
    {
        return $this->belongsTo(Car::class, 'new_car_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    // --- Optional: convenient accessor to read fees as 'fees' instead of 'fees_json' ---
    public function getFeesAttribute(): array
    {
        return $this->fees_json ?? [];
    }
}
