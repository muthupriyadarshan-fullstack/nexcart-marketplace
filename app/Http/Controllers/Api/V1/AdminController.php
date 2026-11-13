<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payout;
use App\Models\Product;
use App\Models\Refund;
use App\Models\ReturnRequest;
use App\Models\Store;
use App\Models\User;
use App\Models\Vendor;
use App\Services\AuditLogService;
use App\Services\RefundService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminController extends BaseApiController
{
    public function __construct(
        protected RefundService $refundService
    ) {}

    /**
     * Admin Dashboard Global Analytics
     */
    public function dashboard(): JsonResponse
    {
        $totalGMV = (float) Order::whereIn('status', ['paid', 'processing', 'partially_shipped', 'shipped', 'delivered'])->sum('grand_total');
        $platformRevenue = (float) OrderItem::whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])->sum('commission_amount');
        $vendorsCount = Vendor::where('status', 'approved')->count();
        $pendingVendorsCount = Vendor::where('status', 'pending')->count();
        $customersCount = User::role('Customer')->count();
        $ordersCount = Order::count();
        $pendingRefundsCount = ReturnRequest::where('status', 'requested')->count();
        $pendingProductsCount = Product::where('status', 'pending_moderation')->count();

        // Recent orders
        $recentOrders = Order::with('user')->latest()->take(6)->get();

        return $this->respondSuccess([
            'metrics' => [
                'total_gmv' => $totalGMV,
                'platform_revenue' => $platformRevenue,
                'vendors_count' => $vendorsCount,
                'pending_vendors_count' => $pendingVendorsCount,
                'customers_count' => $customersCount,
                'orders_count' => $ordersCount,
                'pending_refunds_count' => $pendingRefundsCount,
                'pending_moderation_products' => $pendingProductsCount,
            ],
            'recent_orders' => $recentOrders->map(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'customer_name' => $o->user->name,
                'grand_total' => (float) $o->grand_total,
                'status' => $o->status,
                'payment_status' => $o->payment_status,
                'placed_at' => $o->created_at->toFormattedDateString(),
            ]),
        ]);
    }

    /**
     * Vendors list
     */
    public function vendors(Request $request): JsonResponse
    {
        $status = $request->get('status');

        $query = Vendor::with(['user', 'profile', 'stores']);

        if ($status) {
            $query->where('status', $status);
        }

        $vendors = $query->latest()->paginate(15);

        return $this->respondSuccess($vendors);
    }

    /**
     * Approve vendor application
     */
    public function approveVendor(int $id, Request $request): JsonResponse
    {
        $vendor = Vendor::findOrFail($id);
        $vendor->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        // Activate store
        Store::where('vendor_id', $vendor->id)->update(['status' => 'active']);

        AuditLogService::log('vendor.approved', $vendor, null, ['status' => 'approved']);

        return $this->respondSuccess($vendor, 'Vendor approved and store activated.');
    }

    /**
     * Reject vendor application
     */
    public function rejectVendor(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $vendor = Vendor::findOrFail($id);
        $vendor->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        AuditLogService::log('vendor.rejected', $vendor, null, $validated);

        return $this->respondSuccess($vendor, 'Vendor application rejected.');
    }

    /**
     * Set custom vendor commission rate
     */
    public function setVendorCommission(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:50'],
        ]);

        $vendor = Vendor::findOrFail($id);
        $store = $vendor->primaryStore;
        if (! $store) {
            return $this->respondError('Store not found for this vendor.', 404);
        }

        $old = $store->commission_rate;
        $store->update(['commission_rate' => $validated['commission_rate']]);

        AuditLogService::log('vendor.commission_changed', $store, ['commission_rate' => $old], $validated);

        return $this->respondSuccess($store, "Commission rate updated to {$validated['commission_rate']}%.");
    }

    /**
     * Product Moderation List
     */
    public function products(Request $request): JsonResponse
    {
        $status = $request->get('status');

        $query = Product::with(['store', 'category', 'primaryImage', 'variants.inventory']);

        if ($status) {
            $query->where('status', $status);
        }

        $products = $query->latest()->paginate(15);

        return $this->respondSuccess($products);
    }

    /**
     * Moderate product: approve or reject
     */
    public function moderateProduct(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'rejection_reason' => ['nullable', 'string', 'required_if:status,rejected'],
        ]);

        $product = Product::findOrFail($id);
        $product->update($validated);

        AuditLogService::log('product.moderated', $product, null, $validated);

        return $this->respondSuccess($product, "Product {$validated['status']}.");
    }

    /**
     * Categories CRUD
     */
    public function categories(): JsonResponse
    {
        $categories = Category::with(['parent', 'children'])->withCount('products')->get();

        return $this->respondSuccess($categories);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'url'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        if (Category::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] .= '-'.Str::random(4);
        }

        $category = Category::create($validated);

        return $this->respondSuccess($category, 'Category created.', 201);
    }

    public function updateCategory(int $id, Request $request): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'parent_id' => ['nullable', 'exists:categories,id'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'url'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $category->update($validated);

        return $this->respondSuccess($category, 'Category updated.');
    }

    /**
     * Orders List
     */
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::with(['user', 'items.store', 'shipments', 'payment'])
            ->latest()
            ->paginate(15);

        return $this->respondSuccess($orders);
    }

    /**
     * Coupons CRUD
     */
    public function coupons(): JsonResponse
    {
        $coupons = Coupon::latest()->get();

        return $this->respondSuccess($coupons);
    }

    public function storeCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'discount_type' => ['required', 'in:percentage,fixed'],
            'discount_value' => ['required', 'numeric', 'min:1'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit_total' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $coupon = Coupon::create($validated);

        return $this->respondSuccess($coupon, 'Coupon created.', 201);
    }

    public function updateCoupon(int $id, Request $request): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'discount_value' => ['required', 'numeric', 'min:1'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $coupon->update($validated);

        return $this->respondSuccess($coupon, 'Coupon updated.');
    }

    /**
     * Refund requests & approval
     */
    public function refunds(): JsonResponse
    {
        $returns = ReturnRequest::with(['user', 'orderItem.store', 'orderItem.order', 'refund'])
            ->latest()
            ->paginate(15);

        return $this->respondSuccess($returns);
    }

    public function processRefund(int $returnId, Request $request): JsonResponse
    {
        $returnRequest = ReturnRequest::with(['orderItem.order.payment', 'orderItem.variant'])->findOrFail($returnId);

        try {
            $refund = $this->refundService->processRefund(
                $returnRequest,
                $request->user(),
                $request->get('notes')
            );

            return $this->respondSuccess($refund, 'Refund successfully processed through payment gateway.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    /**
     * Payouts List and Approval
     */
    public function payouts(): JsonResponse
    {
        $payouts = Payout::with('store.vendor.profile')->latest()->paginate(15);

        return $this->respondSuccess($payouts);
    }

    public function approvePayout(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bank_reference' => ['required', 'string', 'max:100'],
        ]);

        $payout = Payout::findOrFail($id);
        $payout->update([
            'status' => 'completed',
            'bank_reference' => $validated['bank_reference'],
            'processed_at' => now(),
            'processed_by' => $request->user()->id,
        ]);

        AuditLogService::log('payout.completed', $payout, null, $validated);

        return $this->respondSuccess($payout, 'Payout marked as completed.');
    }

    /**
     * Audit Logs Trail
     */
    public function auditLogs(): JsonResponse
    {
        $logs = AuditLog::with('user')->latest()->paginate(25);

        return $this->respondSuccess($logs);
    }
}
