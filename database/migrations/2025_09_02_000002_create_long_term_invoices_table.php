<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('long_term_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rental_id')->constrained()->onDelete('cascade');
            $table->decimal('amount_due', 10, 2);
            $table->date('due_date');
            $table->enum('status', ['paid', 'unpaid', 'overdue'])->default('unpaid');
            $table->date('paid_at')->nullable();
            $table->boolean('is_prorated')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('long_term_invoices');
    }
};
