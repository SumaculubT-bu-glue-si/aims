<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            // Drop the old foreign key first if it exists
            $table->dropForeign(['subscription_id']);

            // Rename the column
            $table->renameColumn('subscription_id', 'service_subscription_id');

            // Re-add the foreign key with the new column name
            $table->foreign('service_subscription_id')
                ->references('id')
                ->on('service_subscriptions')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('licenses', function (Blueprint $table) {
            $table->dropForeign(['service_subscription_id']);
            $table->renameColumn('service_subscription_id', 'subscription_id');
            $table->foreign('subscription_id')
                ->references('id')
                ->on('subscriptions')
                ->onDelete('cascade');
        });
    }
};
