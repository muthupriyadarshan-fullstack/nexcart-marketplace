<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\CustomerInteractionController;
use App\Http\Controllers\Api\V1\SupportController;
use App\Http\Controllers\Api\V1\VendorDashboardController;
use App\Http\Controllers\Api\V1\WebhookController;
use App\Http\Controllers\Api\V1\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // -------------------------------------------------------------
    // Public Endpoints
    // -------------------------------------------------------------
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/vendor-register', [AuthController::class, 'vendorRegister']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Catalog & Discovery
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/categories/{slug}', [CatalogController::class, 'category']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/{slug}', [CatalogController::class, 'product']);
    Route::get('/stores/{slug}', [CatalogController::class, 'store']);

    // Asynchronous Webhooks
    Route::post('/webhooks/razorpay', [WebhookController::class, 'handleRazorpay']);

    // -------------------------------------------------------------
    // Authenticated Endpoints (Sanctum)
    // -------------------------------------------------------------
    Route::middleware('auth:sanctum')->group(function () {
        // User & Session
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

        // Customer Cart
        Route::get('/cart', [CartController::class, 'getCart']);
        Route::post('/cart/items', [CartController::class, 'addItem']);
        Route::put('/cart/items/{id}', [CartController::class, 'updateItem']);
        Route::delete('/cart/items/{id}', [CartController::class, 'removeItem']);
        Route::post('/cart/apply-coupon', [CartController::class, 'applyCoupon']);
        Route::delete('/cart/remove-coupon', [CartController::class, 'removeCoupon']);

        // Customer Wishlist
        Route::get('/wishlist', [WishlistController::class, 'index']);
        Route::post('/wishlist/{productId}', [WishlistController::class, 'toggle']);

        // Customer Addresses
        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{id}', [AddressController::class, 'update']);
        Route::delete('/addresses/{id}', [AddressController::class, 'destroy']);

        // Checkout & Orders
        Route::post('/checkout/initialize', [CheckoutController::class, 'initialize']);
        Route::post('/checkout/verify', [CheckoutController::class, 'verifyPayment']);
        Route::get('/orders', [CheckoutController::class, 'orders']);
        Route::get('/orders/{orderNumber}', [CheckoutController::class, 'orderDetail']);

        // Reviews & Returns
        Route::post('/reviews', [CustomerInteractionController::class, 'submitReview']);
        Route::post('/returns', [CustomerInteractionController::class, 'submitReturn']);
        Route::get('/returns', [CustomerInteractionController::class, 'returns']);

        // ---------------------------------------------------------
        // Vendor Portal (Role: Vendor)
        // ---------------------------------------------------------
        Route::middleware('role:Vendor')->prefix('vendor')->group(function () {
            Route::get('/dashboard', [VendorDashboardController::class, 'dashboard']);
            Route::get('/store', [VendorDashboardController::class, 'getStore']);
            Route::put('/store', [VendorDashboardController::class, 'updateStore']);

            Route::get('/products', [VendorDashboardController::class, 'products']);
            Route::post('/products', [VendorDashboardController::class, 'storeProduct']);
            Route::put('/products/{id}', [VendorDashboardController::class, 'updateProduct']);
            Route::delete('/products/{id}', [VendorDashboardController::class, 'deleteProduct']);

            Route::get('/inventory', [VendorDashboardController::class, 'inventory']);
            Route::put('/inventory/{variantId}', [VendorDashboardController::class, 'updateInventory']);

            Route::get('/orders', [VendorDashboardController::class, 'orders']);
            Route::put('/shipments/{id}', [VendorDashboardController::class, 'updateShipping']);

            Route::get('/commissions', [VendorDashboardController::class, 'commissions']);
            Route::get('/payouts', [VendorDashboardController::class, 'payouts']);
            Route::post('/payouts/request', [VendorDashboardController::class, 'requestPayout']);
        });

        // ---------------------------------------------------------
        // Admin Governance Hub (Role: Super Admin)
        // ---------------------------------------------------------
        Route::middleware('role:Super Admin')->prefix('admin')->group(function () {
            Route::get('/dashboard', [AdminController::class, 'dashboard']);

            Route::get('/vendors', [AdminController::class, 'vendors']);
            Route::put('/vendors/{id}/approve', [AdminController::class, 'approveVendor']);
            Route::put('/vendors/{id}/reject', [AdminController::class, 'rejectVendor']);
            Route::put('/vendors/{id}/commission', [AdminController::class, 'setVendorCommission']);

            Route::get('/categories', [AdminController::class, 'categories']);
            Route::post('/categories', [AdminController::class, 'storeCategory']);
            Route::put('/categories/{id}', [AdminController::class, 'updateCategory']);

            Route::get('/products', [AdminController::class, 'products']);
            Route::put('/products/{id}/moderate', [AdminController::class, 'moderateProduct']);

            Route::get('/orders', [AdminController::class, 'orders']);

            Route::get('/coupons', [AdminController::class, 'coupons']);
            Route::post('/coupons', [AdminController::class, 'storeCoupon']);
            Route::put('/coupons/{id}', [AdminController::class, 'updateCoupon']);

            Route::get('/refunds', [AdminController::class, 'refunds']);
            Route::post('/refunds/{id}/process', [AdminController::class, 'processRefund']);

            Route::get('/payouts', [AdminController::class, 'payouts']);
            Route::put('/payouts/{id}/approve', [AdminController::class, 'approvePayout']);

            Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
        });

        // ---------------------------------------------------------
        // Support Staff Operations (Role: Support Staff or Super Admin)
        // ---------------------------------------------------------
        Route::middleware('role:Support Staff|Super Admin')->prefix('support')->group(function () {
            Route::get('/orders', [SupportController::class, 'orders']);
            Route::get('/returns', [SupportController::class, 'returns']);
            Route::put('/returns/{id}/review', [SupportController::class, 'reviewReturn']);
        });
    });
});
