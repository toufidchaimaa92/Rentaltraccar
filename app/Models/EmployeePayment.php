<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'amount',
        'payment_date',
        'notes',
    ];

    /**
     * The employee this payment belongs to.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
