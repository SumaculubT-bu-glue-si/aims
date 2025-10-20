<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('service_subscriptions', function (Blueprint $table) {
            $table->integer('per_seat_monthly_price')->nullable()->after('notes');
            $table->integer('per_seat_yearly_price')->nullable()->after('per_seat_monthly_price');
            $table->enum('per_seat_currency', ['jpy', 'usd'])->default('jpy')->after('per_seat_yearly_price');
        });
    }

    public function down(): void
    {
        Schema::table('service_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['per_seat_monthly_price', 'per_seat_yearly_price', 'per_seat_currency']);
        });
    }
};
