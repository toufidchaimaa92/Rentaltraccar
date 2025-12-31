<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'status')) {
                $table->enum('status', ['active', 'suspended'])->default('active')->after('role');
            }

            if (!Schema::hasColumn('users', 'notes')) {
                $table->text('notes')->nullable()->after('status');
            }
        });

        DB::statement(
            "ALTER TABLE users MODIFY role ENUM('admin','manager','employee','controller') DEFAULT 'employee'"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'notes')) {
                $table->dropColumn('notes');
            }

            if (Schema::hasColumn('users', 'status')) {
                $table->dropColumn('status');
            }
        });

        DB::statement(
            "ALTER TABLE users MODIFY role ENUM('admin','user','controller') DEFAULT 'user'"
        );
    }
};
