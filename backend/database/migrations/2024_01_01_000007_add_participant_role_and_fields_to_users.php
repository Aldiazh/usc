<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL: change enum column to string to support 'participant' role
        // Drop the old enum column and recreate as string
        Schema::table('users', function (Blueprint $table) {
            $table->string('institution')->nullable()->after('remember_token');
            $table->string('team_name')->nullable()->after('institution');
            $table->boolean('is_active')->default(true)->after('team_name');
        });

        // Convert role enum to string type to allow 'participant'
        // In PostgreSQL, we need raw SQL to alter enum type
        DB::statement("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255)");
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin'");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['institution', 'team_name', 'is_active']);
        });

        // Revert role back to enum
        DB::statement("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255)");
    }
};
