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
        Schema::table('users', function (Blueprint $table) {
            // If role column already exists, modify it
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['admin', 'user', 'controller'])->default('user');
            } else {
                $table->dropColumn('role');
                $table->enum('role', ['admin', 'user', 'controller'])->default('user');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
