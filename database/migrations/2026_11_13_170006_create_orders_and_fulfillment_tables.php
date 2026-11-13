<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 60)->unique();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->json('shipping_address');
            $table->json('billing_address');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('shipping_fee', 12, 2)->default(0.00);
            $table->decimal('grand_total', 12, 2);
            $table->string('currency', 5)->default('INR');
            $table->string('status', 40)->default('pending_payment')->index(); // pending_payment, paid, processing, partially_shipped, shipped, delivered, cancelled, refunded
            $table->string('payment_status', 30)->default('pending')->index(); // pending, authorized, captured, failed, refunded
            $table->timestamp('placed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('product_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->string('product_name');
            $table->string('variant_sku', 100);
            $table->decimal('unit_price', 12, 2);
            $table->integer('quantity');
            $table->decimal('total_price', 12, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->decimal('vendor_earnings', 12, 2);
            $table->string('status', 40)->default('pending')->index(); // pending, processing, shipped, delivered, cancelled, refunded
            $table->timestamps();
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->string('tracking_number', 100)->nullable()->index();
            $table->string('carrier', 100)->nullable();
            $table->string('status', 40)->default('pending')->index(); // pending, dispatched, in_transit, out_for_delivery, delivered, returned
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('gateway', 50)->default('razorpay');
            $table->string('gateway_order_id', 120)->unique();
            $table->string('gateway_payment_id', 120)->nullable()->index();
            $table->string('gateway_signature', 255)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 5)->default('INR');
            $table->string('status', 30)->default('created')->index(); // created, attempted, captured, failed, refunded
            $table->string('idempotency_key', 120)->unique();
            $table->timestamps();
        });

        Schema::create('payment_webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('event_id', 120)->unique();
            $table->string('event_type', 100)->index();
            $table->string('gateway', 50)->default('razorpay');
            $table->json('payload');
            $table->boolean('processed')->default(false)->index();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhooks');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
