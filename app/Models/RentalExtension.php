<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RentalExtension extends Model
{
    use HasFactory;

    protected $fillable = [
        'rental_id',
        'old_end_date',
        'new_end_date',
        'old_total',
        'new_total',
        'changed_by',
    ];

    protected $casts = [
        'old_end_date' => 'date',
        'new_end_date' => 'date',
        'old_total' => 'decimal:2',
        'new_total' => 'decimal:2',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
