<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserProfile extends Model
{
    use HasFactory;

    // Table name (optional if following Laravel naming conventions)
    protected $table = 'user_profiles';

    // The attributes that are mass assignable
    protected $fillable = [
        'user_id',
        'bio',
        'paste_signature',
        'linkvertise_api',
    ];

    /**
     * Get the user that owns this profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
