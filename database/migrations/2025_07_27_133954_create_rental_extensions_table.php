<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rental_extensions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('rental_id')
                  ->constrained('rentals')
                  ->onDelete('cascade');

            $table->date('old_end_date');
            $table->date('new_end_date');

            // Track the price changes
            $table->decimal('old_total', 10, 2)->nullable();
            $table->decimal('new_total', 10, 2)->nullable();

            $table->foreignId('changed_by')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_extensions');
    }
};
