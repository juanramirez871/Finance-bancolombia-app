<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function ($table) {
            $table->decimal('amount', 15, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function ($table) {
            $table->unsignedBigInteger('amount')->change();
        });
    }
};