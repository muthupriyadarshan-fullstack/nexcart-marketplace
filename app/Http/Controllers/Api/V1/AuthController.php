<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\VendorRegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Cart;
use App\Models\Store;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends BaseApiController
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'status' => 'active',
            ]);

            $user->assignRole('Customer');

            // Initialize empty cart
            Cart::create(['user_id' => $user->id]);

            return $user;
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->respondSuccess([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Customer registered successfully', 201);
    }

    public function vendorRegister(VendorRegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'status' => 'active',
            ]);

            $user->assignRole('Vendor');

            $vendor = Vendor::create([
                'user_id' => $user->id,
                'status' => 'pending', // Awaiting super admin review
            ]);

            VendorProfile::create([
                'vendor_id' => $vendor->id,
                'company_name' => $request->company_name,
                'tax_id_gst' => $request->tax_id_gst,
                'pan_number' => $request->pan_number,
                'bank_name' => $request->bank_name,
                'bank_account_number' => $request->bank_account_number,
                'bank_ifsc_code' => $request->bank_ifsc_code,
            ]);

            $slug = Str::slug($request->store_name);
            if (Store::where('slug', $slug)->exists()) {
                $slug .= '-' . Str::random(4);
            }

            Store::create([
                'vendor_id' => $vendor->id,
                'name' => $request->store_name,
                'slug' => $slug,
                'description' => $request->store_description,
                'commission_rate' => 10.00,
                'status' => 'inactive', // Active once vendor is approved
            ]);

            return $user;
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->respondSuccess([
            'user' => new UserResource($user),
            'token' => $token,
            'message' => 'Vendor application submitted. Store is pending admin approval.',
        ], 'Vendor registered successfully', 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->respondError('Invalid email or password credentials.', 401);
        }

        if ($user->status === 'suspended') {
            return $this->respondForbidden('Your account has been suspended by administration.');
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->respondSuccess([
            'user' => new UserResource($user),
            'token' => $token,
        ], 'Login successful');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->respondSuccess(new UserResource($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->respondSuccess(null, 'Successfully logged out.');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user->update($validated);

        return $this->respondSuccess(new UserResource($user), 'Profile updated successfully.');
    }
}

