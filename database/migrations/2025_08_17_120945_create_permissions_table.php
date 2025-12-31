<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableNames = config('permission.table_names');

        throw_if(empty($tableNames), new Exception('Error: config/permission.php not loaded. Run [php artisan config:clear] and try again.'));

        Schema::create($tableNames['permissions'], static function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();

            $table->unique(['name', 'guard_name']);
        });
    }

    public function down(): void
    {
        $tableNames = config('permission.table_names');

        if (empty($tableNames)) {
            throw new Exception('Error: config/permission.php not loaded. Please publish the package configuration before rollback.');
        }

        Schema::dropIfExists($tableNames['permissions']);
    }
};
