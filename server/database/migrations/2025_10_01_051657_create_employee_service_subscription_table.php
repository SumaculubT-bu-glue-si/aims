<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_service_subscription', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_subscription_id');
            $table->string('employee_id'); // matches employees.employee_id
            $table->timestamps();

            // foreign keys
            $table->foreign('service_subscription_id')
                ->references('id')->on('service_subscriptions')
                ->onDelete('cascade');

            $table->foreign('employee_id')
                ->references('employee_id')->on('employees')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_service_subscription');
    }
};
