<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Rental extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'second_driver_id',
        'car_model_id',
        'car_id',
        'rental_type',
        'start_date',
        'end_date',
        'pickup_time',
        'return_time',
        'days',
        'initial_price_per_day', // ajouté
        'price_per_day',         // modifiable
        'monthly_price',
        'monthly_price_ht',
        'monthly_tva_amount',
        'monthly_price_ttc',
        'deposit',
        'payment_cycle_days',
        'pro_rata_first_month',
        'last_payment_date',
        'next_payment_due_date',
        'tva_rate',
        'price_input_type',
        'global_discount',       // remise globale
        'total_price',
        'manual_total',          // total saisi manuellement (optionnel)
        'status',
        'confirmed_by_user_id',
        'confirmed_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'last_payment_date' => 'date',
        'next_payment_due_date' => 'date',
        'confirmed_at' => 'datetime',
        // Optionnel: assure 2 décimales à l’output
        'initial_price_per_day' => 'decimal:2',
        'price_per_day'         => 'decimal:2',
        'monthly_price'         => 'decimal:2',
        'monthly_price_ht'      => 'decimal:2',
        'monthly_tva_amount'    => 'decimal:2',
        'monthly_price_ttc'     => 'decimal:2',
        'deposit'               => 'decimal:2',
        'tva_rate'              => 'decimal:2',
        'global_discount'       => 'decimal:2',
        'total_price'           => 'decimal:2',
        'manual_total'          => 'decimal:2',
    ];

    // Attributs calculés sérialisés automatiquement
    protected $appends = [
        'effective_total',
        'total_paid',
        'remaining_amount',
        'overdue_status',
        'last_extension_total', // 👈 nouveau: total de prolongation (delta)
    ];

    // --- Relations ---
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function secondDriver()
    {
        return $this->belongsTo(Client::class, 'second_driver_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function carModel()
    {
        return $this->belongsTo(CarModel::class);
    }

    public function car()
    {
        return $this->belongsTo(Car::class);
    }

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by_user_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function extensions()
    {
        return $this->hasMany(RentalExtension::class);
    }

    public function carChanges()
    {
        return $this->hasMany(RentalCarChange::class);
    }

    public function invoices()
    {
        return $this->hasMany(LongTermInvoice::class);
    }

    // --- Attributs calculés ---
    public function getTotalPaidAttribute()
    {
        return $this->relationLoaded('payments')
            ? (float) $this->payments->sum('amount')
            : (float) $this->payments()->sum('amount');
    }

    // total effectif (priorise manual_total si présent)
    public function getEffectiveTotalAttribute()
    {
        return $this->manual_total ?? $this->total_price;
    }

    public function getRemainingAmountAttribute()
    {
        return max(
            0,
            (float) ($this->effective_total ?? 0) - (float) ($this->total_paid ?? 0)
        );
    }

    /**
     * 👇 Nouveau: retourne le montant de la dernière prolongation
     * (delta entre new_total et old_total du dernier RentalExtension).
     * Null s'il n'y a pas de prolongation.
     */
    public function getLastExtensionTotalAttribute()
    {
        // Si déjà chargé par le contrôleur, on réutilise la collection
        $last = $this->relationLoaded('extensions')
            ? $this->extensions->sortByDesc('created_at')->first()
            : $this->extensions()->latest()->first();

        if (!$last) {
            return null;
        }

        return (float) $last->new_total - (float) $last->old_total;
    }

    public function getOverdueStatusAttribute()
    {
        if (!$this->relationLoaded('invoices')) {
            return null;
        }

        $latestInvoice = $this->invoices->sortByDesc('due_date')->first();
        if (!$latestInvoice) {
            return null;
        }

        $today = now()->startOfDay();
        if ($latestInvoice->status === 'paid') {
            return 'on_time';
        }

        $dueDate = $latestInvoice->due_date instanceof \Carbon\Carbon
            ? $latestInvoice->due_date
            : now()->parse($latestInvoice->due_date);

        if ($today->greaterThan($dueDate->copy()->addDays(4))) {
            return 'overdue';
        }

        if ($today->greaterThanOrEqualTo($dueDate->copy()->subDays(3))) {
            return 'due_soon';
        }

        return 'on_time';
    }

    // --- Comportements automatiques ---
    protected static function booted()
    {
        // Auto-sync du modèle depuis la voiture sélectionnée + recalcul du total
        static::saving(function ($rental) {
            if ($rental->car_id) {
                $car = Car::find($rental->car_id);
                if ($car) {
                    $rental->car_model_id = $car->car_model_id;
                }
            }

            // (Re)calcule total_price si possible (sans toucher manual_total)
            // total_price = max(0, days * price_per_day - global_discount)
            $days           = (int) ($rental->days ?? 0);
            $pricePerDay    = (float) ($rental->price_per_day ?? 0);
            $globalDiscount = (float) ($rental->global_discount ?? 0);

            if ($days > 0 && $pricePerDay >= 0) {
                $calculated = ($days * $pricePerDay) - $globalDiscount;
                $rental->total_price = max(0, round($calculated, 2));
            }
            // NE PAS modifier $rental->manual_total ici (override utilisateur)
        });
    }
}
