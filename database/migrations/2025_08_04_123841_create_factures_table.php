<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number');
            $table->string('client_name');
            $table->string('client_address')->nullable();
            $table->string('client_rc')->nullable();
            $table->string('client_ice')->nullable();
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->date('date');
            $table->text('notes')->nullable();
            $table->string('payment_status')->default('Pas encore payée');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
