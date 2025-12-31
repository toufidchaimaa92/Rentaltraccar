<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rental_car_changes', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('rental_id')
                  ->constrained('rentals')
                  ->onDelete('cascade');

            $table->foreignId('old_car_id')
                  ->nullable()
                  ->constrained('cars')
                  ->onDelete('set null');

            $table->foreignId('new_car_id')
                  ->constrained('cars')
                  ->onDelete('cascade');

            $table->foreignId('changed_by')
                  ->constrained('users')
                  ->onDelete('cascade');

            // When the switch happens (inclusive split boundary)
            $table->date('change_date');

            // Totals BEFORE vs AFTER the change
            $table->decimal('old_total', 10, 2);
            $table->decimal('new_total', 10, 2);

            // ---- Audit & override context (NEW) ----
            // Daily prices (base) used on each side of the split
            $table->decimal('old_price_per_day', 10, 2)->nullable();
            $table->decimal('new_price_per_day', 10, 2)->nullable();

            // Per-day discounts used on each side
            $table->decimal('old_discount_per_day', 10, 2)->nullable();
            $table->decimal('new_discount_per_day', 10, 2)->nullable();

            // Whether an explicit override was applied
            $table->boolean('override_price_applied')->default(false);
            $table->boolean('override_total_applied')->default(false);

            // Any additional fees applied to the NEW segment (JSON array of {label, amount})
            $table->json('fees_json')->nullable();

            // Free-text note (why the override happened, internal memo, etc.)
            $table->text('note')->nullable();

            $table->timestamps();

            // Helpful indexes
            $table->index(['rental_id', 'change_date']);
            $table->index(['old_car_id']);
            $table->index(['new_car_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_car_changes');
    }
};
