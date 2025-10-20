<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('service_name'); // Required by default
            $table->string('vendor')->nullable();
            $table->enum('license_type', ['subscription', 'perpetual']);
            $table->enum('pricing_type', ['per-license', 'per-seat']);
            $table->enum('status', ['active', 'inactive']);
            $table->string('category')->nullable();
            $table->string('payment_method')->nullable();
            $table->date('cancellation_date')->nullable();
            $table->string('official_website')->nullable();
            $table->string('official_support')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
