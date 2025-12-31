<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('car_benefits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained()->onDelete('cascade');
            $table->foreignId('rental_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2); // earned money
            $table->date('start_date');       // start of period for this car
            $table->date('end_date');         // end of period for this car
            $table->integer('days');          // number of days for this period
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('car_benefits');
    }
};
