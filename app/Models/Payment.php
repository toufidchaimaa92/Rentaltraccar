<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'rental_id',
        'user_id',
        'amount',
        'method',      // cash, virement, cheque
        'reference',   // numéro chèque ou virement
        'date',
        'note',
    ];

    // Relation vers le client
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    // Relation vers la location (rental)
    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }

    // Relation vers l'utilisateur qui a saisi le paiement
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
