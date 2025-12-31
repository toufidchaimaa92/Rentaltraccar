<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->decimal('monthly_price_ht', 10, 2)->nullable()->after('monthly_price');
            $table->decimal('monthly_tva_amount', 10, 2)->nullable()->after('monthly_price_ht');
            $table->decimal('monthly_price_ttc', 10, 2)->nullable()->after('monthly_tva_amount');
            $table->decimal('tva_rate', 5, 2)->default(20)->after('monthly_price_ttc');
            $table->string('price_input_type')->default('ttc')->after('tva_rate');
        });
    }

    public function down(): void
    {
        Schema::table('rentals', function (Blueprint $table) {
            $table->dropColumn([
                'monthly_price_ht',
                'monthly_tva_amount',
                'monthly_price_ttc',
                'tva_rate',
                'price_input_type',
            ]);
        });
    }
};
