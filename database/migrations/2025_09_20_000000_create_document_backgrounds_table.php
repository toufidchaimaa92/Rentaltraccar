<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_backgrounds', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('name')->nullable();
            $table->string('file_path');
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->index('type');
            $table->index(['type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_backgrounds');
    }
};
