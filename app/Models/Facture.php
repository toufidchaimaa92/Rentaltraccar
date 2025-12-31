<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $fillable = [
        'invoice_number',
        'client_name',
        'client_address',
        'client_rc',
        'client_ice',
        'tax_rate',
        'date',
        'notes',
        'payment_status',
    ];

    public function items()
    {
        return $this->hasMany(FactureItem::class);
    }
}
