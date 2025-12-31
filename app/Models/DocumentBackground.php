<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DocumentBackground extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'file_path',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
