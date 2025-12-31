<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarExpense extends Model
{
    protected $fillable = [
        'car_id',
        'type',
        'invoice_number',
        'amount',
        'expense_date',
        'notes',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount' => 'decimal:2',
    ];

    // 🔹 Relation back to Car
    public function car()
    {
        return $this->belongsTo(Car::class);
    }
}
