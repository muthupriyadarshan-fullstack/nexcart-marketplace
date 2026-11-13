<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Models\Vendor;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

test('vendor can create product with variants and initial stock', function () {
    $category = Category::create([
        'name' => 'Audio Systems',
        'slug' => 'audio-systems',
        'is_active' => true,
    ]);

    $vendorUser = User::create([
        'name' => 'Apex Vendor',
        'email' => 'vendor1@apex.in',
        'password' => Hash::make('password'),
    ]);
    $vendorUser->assignRole('Vendor');

    $vendor = Vendor::create([
        'user_id' => $vendorUser->id,
        'status' => 'approved',
    ]);

    $store = Store::create([
        'vendor_id' => $vendor->id,
        'name' => 'Apex Store',
        'slug' => 'apex-store',
        'commission_rate' => 10.00,
        'status' => 'active',
    ]);

    $response = $this->actingAs($vendorUser, 'sanctum')->postJson('/api/v1/vendor/products', [
        'name' => 'Sony Studio Monitor Headphones',
        'category_id' => $category->id,
        'brand' => 'Sony',
        'description' => 'Professional studio monitoring headset with 40mm drivers.',
        'base_price' => 12999.00,
        'variants' => [
            [
                'sku' => 'SONY-STUDIO-01',
                'title' => 'Standard Black',
                'price' => 12999.00,
                'quantity' => 25,
            ],
        ],
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('products', [
        'name' => 'Sony Studio Monitor Headphones',
        'store_id' => $store->id,
        'status' => 'pending_moderation',
    ]);

    $this->assertDatabaseHas('inventory', [
        'quantity' => 25,
        'reserved_quantity' => 0,
    ]);
});

test('vendor cannot modify or access another vendors product', function () {
    $category = Category::create([
        'name' => 'Handlooms',
        'slug' => 'handlooms',
        'is_active' => true,
    ]);

    // Vendor 1
    $vendorUser1 = User::create(['name' => 'V1', 'email' => 'v1@test.in', 'password' => Hash::make('password')]);
    $vendorUser1->assignRole('Vendor');
    $v1 = Vendor::create(['user_id' => $vendorUser1->id, 'status' => 'approved']);
    $store1 = Store::create(['vendor_id' => $v1->id, 'name' => 'Store 1', 'slug' => 'store-1', 'status' => 'active']);

    $prod1 = Product::create([
        'store_id' => $store1->id,
        'category_id' => $category->id,
        'name' => 'Store 1 Exclusive Product',
        'slug' => 'store-1-product',
        'description' => 'Exclusive description',
        'base_price' => 5000.00,
        'status' => 'approved',
    ]);

    // Vendor 2
    $vendorUser2 = User::create(['name' => 'V2', 'email' => 'v2@test.in', 'password' => Hash::make('password')]);
    $vendorUser2->assignRole('Vendor');
    $v2 = Vendor::create(['user_id' => $vendorUser2->id, 'status' => 'approved']);
    $store2 = Store::create(['vendor_id' => $v2->id, 'name' => 'Store 2', 'slug' => 'store-2', 'status' => 'active']);

    // Vendor 2 attempts to delete Vendor 1's product
    $response = $this->actingAs($vendorUser2, 'sanctum')->deleteJson("/api/v1/vendor/products/{$prod1->id}");

    $response->assertStatus(404);
    $this->assertDatabaseHas('products', ['id' => $prod1->id]);
});
