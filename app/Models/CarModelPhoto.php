<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CarModelPhoto extends Model
{
    protected $fillable = [
        'car_model_id',
        'photo_path',
        'order',
    ];

    public function model()
    {
        return $this->belongsTo(CarModel::class, 'car_model_id');
    }
}
