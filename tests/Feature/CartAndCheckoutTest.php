<?php

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\User;
use App\Models\Vendor;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->customer = User::create([
        'name' => 'Kiran Deshmukh',
        'email' => 'kiran@example.com',
        'password' => Hash::make('password'),
    ]);
    $this->customer->assignRole('Customer');

    $this->address = Address::create([
        'user_id' => $this->customer->id,
        'name' => 'Kiran Deshmukh',
        'phone' => '+919812345678',
        'address_line1' => 'Plot 44, Shivaji Nagar',
        'city' => 'Pune',
        'state' => 'Maharashtra',
        'postal_code' => '411005',
        'country' => 'India',
        'is_default' => true,
    ]);

    $category = Category::create([
        'name' => 'Gadgets',
        'slug' => 'gadgets',
        'is_active' => true,
    ]);

    $vendorUser = User::create([
        'name' => 'Tech Vendor',
        'email' => 'tech@vendor.in',
        'password' => Hash::make('password'),
    ]);
    $vendorUser->assignRole('Vendor');
    $vendor = Vendor::create(['user_id' => $vendorUser->id, 'status' => 'approved']);
    $this->store = Store::create([
        'vendor_id' => $vendor->id,
        'name' => 'TechZone Retail',
        'slug' => 'techzone-retail',
        'commission_rate' => 10.00,
        'status' => 'active',
    ]);

    $this->product = Product::create([
        'store_id' => $this->store->id,
        'category_id' => $category->id,
        'name' => 'Wireless Keyboard Pro',
        'slug' => 'wireless-keyboard-pro',
        'description' => 'Test wireless keyboard',
        'base_price' => 2999.00,
        'status' => 'approved',
    ]);

    $this->variant = ProductVariant::create([
        'product_id' => $this->product->id,
        'sku' => 'KEY-PRO-01',
        'title' => 'Standard US Layout',
        'price' => 2999.00,
        'attributes' => ['layout' => 'US'],
    ]);

    $this->inventory = Inventory::create([
        'product_variant_id' => $this->variant->id,
        'quantity' => 10,
        'reserved_quantity' => 0,
        'low_stock_threshold' => 2,
    ]);
});

test('customer can add product variant to cart', function () {
    $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/cart/items', [
        'product_variant_id' => $this->variant->id,
        'quantity' => 2,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.items_count', 2);
});

test('cannot add quantity exceeding available stock', function () {
    $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/cart/items', [
        'product_variant_id' => $this->variant->id,
        'quantity' => 15, // available is only 10
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false);
});

test('checkout initialization atomically reserves stock and creates order', function () {
    // Setup cart
    $cart = Cart::create(['user_id' => $this->customer->id]);
    CartItem::create([
        'cart_id' => $cart->id,
        'product_variant_id' => $this->variant->id,
        'quantity' => 3,
    ]);

    $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/checkout/initialize', [
        'shipping_address_id' => $this->address->id,
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'data' => [
                'order_number',
                'grand_total',
                'razorpay_order_id',
            ],
        ]);

    // Check row-level stock reservation
    $this->inventory->refresh();
    expect($this->inventory->reserved_quantity)->toBe(3);
    expect($this->inventory->available_quantity)->toBe(7);
});

test('payment verification permanently deducts reserved stock and clears cart', function () {
    $cart = Cart::create(['user_id' => $this->customer->id]);
    CartItem::create([
        'cart_id' => $cart->id,
        'product_variant_id' => $this->variant->id,
        'quantity' => 4,
    ]);

    $initRes = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/checkout/initialize', [
        'shipping_address_id' => $this->address->id,
    ]);

    $razorpayOrderId = $initRes->json('data.razorpay_order_id');

    // Verify payment with simulated signature
    $verifyRes = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/checkout/verify', [
        'razorpay_order_id' => $razorpayOrderId,
        'razorpay_payment_id' => 'pay_test_payment_9988',
        'razorpay_signature' => 'demo_signature_valid',
    ]);

    $verifyRes->assertStatus(200)
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.status', 'paid')
        ->assertJsonPath('data.payment_status', 'captured');

    // Verify stock deduction
    $this->inventory->refresh();
    expect($this->inventory->quantity)->toBe(6); // 10 - 4
    expect($this->inventory->reserved_quantity)->toBe(0); // cleared

    // Verify cart was emptied
    $cart->refresh();
    expect($cart->items()->count())->toBe(0);
});

