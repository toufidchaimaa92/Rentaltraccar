<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_type',
        'company_name',
        'rc',
        'ice',
        'company_address',
        'contact_person',
        'contact_phone',
        'driver_name',
        'name',
        'phone',
        'rating',
        'note',
        'identity_card_number',
        'address',
        'license_number',
        'license_date',
        'license_expiration_date',
        'license_front_image',
        'license_back_image',
        'cin_front_image',
        'cin_back_image',
    ];

    // Un client peut avoir plusieurs locations
    public function rentals()
    {
        return $this->hasMany(Rental::class);
    }

    // Un client peut avoir plusieurs paiements
    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    // Méthode pour calculer la dette totale du client
    public function getTotalDebtAttribute()
    {
        $debt = 0;

        foreach ($this->rentals as $rental) {
            $paid = $rental->payments->sum('amount');
            $due = $rental->total_price - $paid;
            if ($due > 0) {
                $debt += $due;
            }
        }

        return $debt;
    }
}
