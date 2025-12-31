<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');

            // salaries: only one applies depending on pay_schedule
            $table->decimal('monthly_salary', 10, 2)->nullable();
            $table->decimal('weekly_salary', 10, 2)->nullable();
            $table->decimal('daily_rate', 10, 2)->nullable();

            // type & schedule
            $table->enum('employee_type', ['coffee', 'location'])->default('coffee');
            $table->enum('pay_schedule', ['monthly', 'weekly', 'daily'])->default('monthly');

            // schedule-specific day fields
            $table->unsignedTinyInteger('monthly_day')->nullable(); // 1–28
            $table->unsignedTinyInteger('weekly_day')->nullable();  // 0=Sunday..6=Saturday

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // (Optional) indexes if you plan to filter often by these
            $table->index(['employee_type']);
            $table->index(['pay_schedule']);
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
