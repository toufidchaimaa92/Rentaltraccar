<?php

// app/Models/FactureItem.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FactureItem extends Model
{
    protected $fillable = [
        'facture_id',
        'description',
        'period',
        'quantity',
        'unit_price',
    ];

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }
}
