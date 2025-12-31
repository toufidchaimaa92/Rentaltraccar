<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_models', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();
            $table->string('brand');
            $table->string('model');
            $table->string('fuel_type');
            $table->decimal('price_per_day', 10, 0);
            $table->string('transmission')->nullable();
            $table->string('finish')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_models');
    }
};
