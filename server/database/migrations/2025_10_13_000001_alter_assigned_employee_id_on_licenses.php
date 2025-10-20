<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            // Drop existing FK to employees.id if it exists
            try {
                $table->dropForeign(['assigned_employee_id']);
            } catch (\Throwable $e) {
                // ignore if FK doesn't exist
            }
        });

        // Change column type to string to support 21+ digit external IDs
        // Using raw SQL to avoid doctrine/dbal dependency for column changes
        DB::statement("ALTER TABLE `licenses` MODIFY `assigned_employee_id` VARCHAR(64) NULL");

        Schema::table('licenses', function (Blueprint $table) {
            // Recreate FK to employees.employee_id (string external key)
            // Assumes employees.employee_id is indexed/unique
            $table->foreign('assigned_employee_id')
                ->references('employee_id')
                ->on('employees')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            try {
                $table->dropForeign(['assigned_employee_id']);
            } catch (\Throwable $e) {
                // ignore if FK doesn't exist
            }
        });

        // Revert column back to unsignedBigInteger
        DB::statement("ALTER TABLE `licenses` MODIFY `assigned_employee_id` BIGINT UNSIGNED NULL");

        Schema::table('licenses', function (Blueprint $table) {
            $table->foreign('assigned_employee_id')
                ->references('id')
                ->on('employees')
                ->nullOnDelete();
        });
    }
};