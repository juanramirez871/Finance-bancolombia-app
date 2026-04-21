<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('gmail_access_token')->nullable();
            $table->text('gmail_refresh_token')->nullable();
            $table->string('gmail_token_type')->nullable();
            $table->timestamp('gmail_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'gmail_access_token',
                'gmail_refresh_token',
                'gmail_token_type',
                'gmail_expires_at',
            ]);
        });
    }
};
