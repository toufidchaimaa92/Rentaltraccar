<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRentalsTable extends Migration
{
    public function up(): void
    {
        Schema::create('rentals', function (Blueprint $table) {
            $table->id();

            // Conducteur principal
            $table->foreignId('client_id')->constrained()->onDelete('cascade');

            // Second conducteur
            $table->foreignId('second_driver_id')->nullable()->constrained('clients')->onDelete('set null');

            // Modèle et voiture
            $table->foreignId('car_model_id')->constrained()->onDelete('cascade');
            $table->foreignId('car_id')->nullable()->constrained()->onDelete('set null');

            // Type de location
            $table->enum('rental_type', ['immediate', 'reservation'])->default('reservation');

            // Période
            $table->date('start_date');
            $table->date('end_date');
            $table->time('pickup_time');
            $table->time('return_time');
            $table->integer('days');

            // Tarification
            $table->decimal('initial_price_per_day', 10, 2);
            $table->decimal('price_per_day', 10, 2);
            $table->decimal('global_discount', 10, 2)->default(0);
            $table->decimal('total_price', 10, 2);
            $table->decimal('manual_total', 10, 2)->nullable();

            // Statut
            $table->enum('status', ['Pending', 'Confirmed', 'Active', 'Cancelled', 'Completed'])->default('Pending');

            // Confirmation
            $table->foreignId('confirmed_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('confirmed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rentals');
    }
}
