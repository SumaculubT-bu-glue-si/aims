<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            $table->boolean('used')->default(false)->after('service_subscription_id');
            $table->unsignedBigInteger('assigned_employee_id')->nullable()->after('used');

            $table->foreign('assigned_employee_id')
                ->references('id')
                ->on('employees')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            $table->dropForeign(['assigned_employee_id']);
            $table->dropColumn(['used', 'assigned_employee_id']);
        });
    }
};
