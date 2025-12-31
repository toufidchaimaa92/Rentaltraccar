<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_expenses', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();

            $table->unsignedBigInteger('car_id');
            $table->foreign('car_id')
                  ->references('id')
                  ->on('cars')
                  ->onDelete('cascade');

            // Restrict to the 4 allowed values
            $table->enum('type', ['mecanique', 'carrosserie', 'entretien', 'lavage']);

            $table->string('invoice_number')->nullable();
            $table->decimal('amount', 12, 2);
            $table->date('expense_date')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            // Optional helpful indexes
            $table->index(['car_id', 'expense_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_expenses');
    }
};
