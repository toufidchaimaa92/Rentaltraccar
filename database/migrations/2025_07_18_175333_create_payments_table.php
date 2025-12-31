<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('rental_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // utilisateur qui a saisi le paiement
            $table->decimal('amount', 10, 2);
            $table->enum('method', ['cash', 'virement', 'cheque']);
            $table->string('reference')->nullable(); // numéro chèque ou virement
            $table->date('date')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('payments');
    }
};
