<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LongTermInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_id',
        'amount_due',
        'due_date',
        'status',
        'paid_at',
        'is_prorated',
        'description',
    ];

    protected $casts = [
        'amount_due' => 'decimal:2',
        'due_date' => 'date',
        'paid_at' => 'date',
        'is_prorated' => 'boolean',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }
}
