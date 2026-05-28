<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('team_name');
        });

        Schema::table('participants', function (Blueprint $table) {
            $table->dropColumn('team_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('team_name')->nullable()->after('institution');
        });

        Schema::table('participants', function (Blueprint $table) {
            $table->string('team_name')->nullable()->after('nickname');
        });
    }
};
