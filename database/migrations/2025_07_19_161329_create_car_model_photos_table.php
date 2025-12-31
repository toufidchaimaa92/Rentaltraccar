<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('car_model_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_model_id')
                  ->constrained()
                  ->onDelete('cascade'); // Supprime les photos si le modèle est supprimé
            $table->string('photo_path'); // Chemin de l'image
            $table->unsignedInteger('order')->default(0); // Ordre d'affichage
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_model_photos');
    }
};
