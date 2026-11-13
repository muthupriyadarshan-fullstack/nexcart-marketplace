<?php

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentWebhook;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use App\Models\Store;
use App\Models\User;
use App\Models\Vendor;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->admin = User::create([
        'name' => 'Admin Boss',
        'email' => 'admin@test.in',
        'password' => Hash::make('password'),
    ]);
    $this->admin->assignRole('Super Admin');

    $this->customer = User::create([
        'name' => 'Shopper',
        'email' => 'shopper@test.in',
        'password' => Hash::make('password'),
    ]);
    $this->customer->assignRole('Customer');

    $vendorUser = User::create([
        'name' => 'Vendor Test',
        'email' => 'vtest@test.in',
        'password' => Hash::make('password'),
    ]);
    $vendorUser->assignRole('Vendor');
    $vendor = Vendor::create(['user_id' => $vendorUser->id, 'status' => 'approved']);
    $this->store = Store::create([
        'vendor_id' => $vendor->id,
        'name' => 'Test Store',
        'slug' => 'test-store',
        'commission_rate' => 10.00,
        'status' => 'active',
    ]);

    $cat = Category::create(['name' => 'Test Cat', 'slug' => 'test-cat', 'is_active' => true]);
    $this->product = Product::create([
        'store_id' => $this->store->id,
        'category_id' => $cat->id,
        'name' => 'Test Product',
        'slug' => 'test-product',
        'description' => 'Test product description',
        'base_price' => 1000.00,
        'status' => 'approved',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'SKU-TEST-01',
        'title' => 'V1',
        'price' => 1000.00,
        'attributes' => ['edition' => 'standard'],
    ]);

    $this->inventory = Inventory::create([
        'product_variant_id' => $this->variant->id,
        'quantity' => 10,
        'reserved_quantity' => 0,
    ]);
});

test('duplicate webhook events are processed idempotently', function () {
    $payload = [
        'event_id' => 'evt_test_unique_998877',
        'event' => 'payment.captured',
        'payload' => [
            'payment' => [
                'entity' => [
                    'id' => 'pay_test_001',
                    'order_id' => 'order_test_999',
                    'amount' => 100000,
                    'status' => 'captured',
                ],
            ],
        ],
    ];

    // First call
    $res1 = $this->postJson('/api/v1/webhooks/razorpay', $payload, [
        'X-Razorpay-Signature' => 'test_webhook_signature_valid',
    ]);

    $res1->assertStatus(200)
        ->assertJsonPath('status', 'success');

    $this->assertDatabaseHas('payment_webhooks', [
        'event_id' => 'evt_test_unique_998877',
        'processed' => true,
    ]);

    // Second call with same event_id
    $res2 = $this->postJson('/api/v1/webhooks/razorpay', $payload, [
        'X-Razorpay-Signature' => 'test_webhook_signature_valid',
    ]);

    $res2->assertStatus(200)
        ->assertJsonPath('status', 'duplicate_ignored');
});

test('refund processing reverses commission and restocks inventory', function () {
    // Create paid order
    $order = Order::create([
        'order_number' => 'NEX-REFUND-001',
        'user_id' => $this->customer->id,
        'shipping_address' => ['city' => 'Delhi'],
        'billing_address' => ['city' => 'Delhi'],
        'subtotal' => 1000.00,
        'grand_total' => 1180.00,
        'status' => 'delivered',
        'payment_status' => 'captured',
    ]);

    $item = OrderItem::create([
        'order_id' => $order->id,
        'store_id' => $this->store->id,
        'product_variant_id' => $this->variant->id,
        'product_name' => $this->product->name,
        'variant_sku' => $this->variant->sku,
        'unit_price' => 1000.00,
        'quantity' => 2,
        'total_price' => 2000.00,
        'commission_rate' => 10.00,
        'commission_amount' => 200.00,
        'vendor_earnings' => 1800.00,
        'status' => 'delivered',
    ]);

    Payment::create([
        'order_id' => $order->id,
        'gateway' => 'razorpay',
        'gateway_order_id' => 'order_test_ref_01',
        'gateway_payment_id' => 'pay_test_ref_01',
        'amount' => 1180.00,
        'status' => 'captured',
        'idempotency_key' => 'idemp_ref_01',
    ]);

    // Customer requests return
    $return = ReturnRequest::create([
        'order_item_id' => $item->id,
        'user_id' => $this->customer->id,
        'reason' => 'Defective',
        'status' => 'requested',
    ]);

    // Initial stock before refund
    expect($this->inventory->quantity)->toBe(10);

    // Admin processes refund
    $response = $this->actingAs($this->admin, 'sanctum')->postJson("/api/v1/admin/refunds/{$return->id}/process", [
        'notes' => 'Defect confirmed. Gateway refund authorized.',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true);

    // Verify refund created
    $this->assertDatabaseHas('refunds', [
        'return_id' => $return->id,
        'status' => 'processed',
    ]);

    // Verify inventory restocked (+2)
    $this->inventory->refresh();
    expect($this->inventory->quantity)->toBe(12);

    // Verify item marked refunded
    $item->refresh();
    expect($item->status)->toBe('refunded');
});

