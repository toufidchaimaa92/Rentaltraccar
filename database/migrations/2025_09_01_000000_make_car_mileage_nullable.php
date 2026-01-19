<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->integer('mileage')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->integer('mileage')->default(0)->nullable(false)->change();
        });
    }
};
