<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarBenefit extends Model
{
    protected $fillable = ['car_id', 'rental_id', 'amount', 'start_date', 'end_date', 'days'];

    public function car() {
        return $this->belongsTo(Car::class);
    }

    public function rental() {
        return $this->belongsTo(Rental::class);
    }
}
