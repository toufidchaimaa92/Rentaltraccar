<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarModel extends Model
{
    protected $fillable = [
        'brand', 'model', 'fuel_type', 'price_per_day', 'transmission', 'finish'
    ];

    public function cars()
    {
        return $this->hasMany(Car::class);
    }

    public function photos()
    {
        return $this->hasMany(CarModelPhoto::class)->orderBy('order');
    }
}
