<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id();

            $table->unsignedBigInteger('car_model_id');
            $table->foreign('car_model_id')
                  ->references('id')
                  ->on('car_models')
                  ->onDelete('cascade');

            $table->string('license_plate')->nullable()->unique();
            $table->string('wwlicense_plate')->nullable();
            $table->enum('status', ['available', 'rented', 'reserved', 'maintenance'])->default('available');

            $table->date('insurance_expiry_date')->nullable();
            $table->date('technical_check_expiry_date')->nullable();

            $table->integer('mileage')->default(0);

            // 🔹 Nouveaux champs financiers
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->decimal('monthly_credit', 12, 2)->nullable();  
            $table->date('credit_start_date')->nullable();  
            $table->date('credit_end_date')->nullable();  

            // 🔹 Prix annuel assurance
            $table->decimal('assurance_prix_annuel', 12, 2)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
