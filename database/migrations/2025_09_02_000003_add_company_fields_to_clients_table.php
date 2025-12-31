<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->enum('client_type', ['individual', 'company'])->default('individual')->after('id');
            $table->string('company_name')->nullable()->after('name');
            $table->string('rc')->nullable()->after('company_name');
            $table->string('ice')->nullable()->after('rc');
            $table->string('company_address')->nullable()->after('ice');
            $table->string('contact_person')->nullable()->after('company_address');
            $table->string('contact_phone')->nullable()->after('contact_person');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'client_type',
                'company_name',
                'rc',
                'ice',
                'company_address',
                'contact_person',
                'contact_phone',
            ]);
        });
    }
};
