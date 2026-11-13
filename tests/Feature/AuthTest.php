<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

test('customer can register and receives sanctum bearer token', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Meera Nair',
        'email' => 'meera@example.com',
        'phone' => '+919876500000',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'data' => [
                'user' => ['id', 'name', 'email', 'roles'],
                'token',
            ],
        ]);

    $this->assertDatabaseHas('users', ['email' => 'meera@example.com']);
    $user = User::where('email', 'meera@example.com')->first();
    expect($user->hasRole('Customer'))->toBeTrue();
});

test('vendor can onboard with store and tax information', function () {
    $response = $this->postJson('/api/v1/auth/vendor-register', [
        'name' => 'Amitabh Sen',
        'email' => 'amitabh@artisan.in',
        'phone' => '+919876511111',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'store_name' => 'Bengal Craftworks',
        'store_description' => 'Fine terracotta and brass handcrafted artifacts.',
        'company_name' => 'Bengal Craftworks LLP',
        'tax_id_gst' => '19AAECR1234M1Z5',
        'pan_number' => 'AAECR1234M',
        'bank_name' => 'Axis Bank',
        'bank_account_number' => '912010001234567',
        'bank_ifsc_code' => 'UTIB0000123',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('stores', ['name' => 'Bengal Craftworks', 'status' => 'inactive']);
    $this->assertDatabaseHas('vendors', ['status' => 'pending']);
});

test('user cannot login with incorrect password', function () {
    User::create([
        'name' => 'Test User',
        'email' => 'tester@example.com',
        'password' => Hash::make('secretpass'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'tester@example.com',
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(401)
        ->assertJsonPath('success', false);
});

test('role permissions block regular customer from vendor portal', function () {
    $customer = User::create([
        'name' => 'Regular Customer',
        'email' => 'regular@example.com',
        'password' => Hash::make('password'),
    ]);
    $customer->assignRole('Customer');

    $response = $this->actingAs($customer, 'sanctum')->getJson('/api/v1/vendor/dashboard');

    $response->assertStatus(403);
});
