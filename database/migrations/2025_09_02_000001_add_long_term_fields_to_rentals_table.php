<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->enum('rental_type', ['immediate', 'reservation', 'long_term'])
                ->default('reservation')
                ->change();

            $table->date('end_date')->nullable()->change();
            $table->time('pickup_time')->nullable()->change();
            $table->time('return_time')->nullable()->change();
            $table->integer('days')->nullable()->default(0)->change();

            $table->decimal('monthly_price', 10, 2)->nullable()->after('price_per_day');
            $table->decimal('deposit', 10, 2)->nullable()->after('monthly_price');
            $table->integer('payment_cycle_days')->nullable()->after('deposit');
            $table->boolean('pro_rata_first_month')->default(false)->after('payment_cycle_days');
            $table->date('last_payment_date')->nullable()->after('pro_rata_first_month');
            $table->date('next_payment_due_date')->nullable()->after('last_payment_date');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn([
                'monthly_price',
                'deposit',
                'payment_cycle_days',
                'pro_rata_first_month',
                'last_payment_date',
                'next_payment_due_date',
            ]);

            $table->enum('rental_type', ['immediate', 'reservation'])
                ->default('reservation')
                ->change();
            $table->date('end_date')->nullable(false)->change();
            $table->time('pickup_time')->nullable(false)->change();
            $table->time('return_time')->nullable(false)->change();
            $table->integer('days')->nullable(false)->default(0)->change();
        });
    }
};
