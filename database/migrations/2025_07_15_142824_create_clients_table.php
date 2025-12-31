<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();

            // Informations de base
            $table->string('name');
            $table->string('phone');

            // Informations supplémentaires
            $table->string('driver_name')->nullable();
            $table->string('identity_card_number')->nullable();
            $table->string('address')->nullable();
            $table->string('license_number')->nullable();
            $table->date('license_date')->nullable();
            $table->date('license_expiration_date')->nullable();

            // Images des documents
            $table->string('license_front_image')->nullable();  // Permis - Recto
            $table->string('license_back_image')->nullable();   // Permis - Verso
            $table->string('cin_front_image')->nullable();      // CIN - Recto
            $table->string('cin_back_image')->nullable();       // CIN - Verso

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
