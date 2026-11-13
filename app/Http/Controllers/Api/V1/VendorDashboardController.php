<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\ProductResource;
use App\Models\Inventory;
use App\Models\OrderItem;
use App\Models\Payout;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Shipment;
use App\Models\StockMovement;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VendorDashboardController extends BaseApiController
{
    /**
     * Resolve vendor's store with strict ownership check.
     */
    protected function getVendorStore(Request $request): Store
    {
        $user = $request->user();
        $vendor = $user->vendor;

        if (! $vendor) {
            abort(403, 'User is not registered as a vendor.');
        }

        if ($vendor->status !== 'approved') {
            abort(403, 'Vendor account is pending approval or suspended.');
        }

        $store = $vendor->primaryStore;
        if (! $store) {
            abort(404, 'No store associated with this vendor.');
        }

        return $store;
    }

    /**
     * Vendor Dashboard Metrics
     */
    public function dashboard(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $totalSales = (float) OrderItem::where('store_id', $store->id)
            ->whereIn('status', ['pending', 'processing', 'shipped', 'delivered'])
            ->sum('total_price');

        $totalEarnings = (float) OrderItem::where('store_id', $store->id)
            ->whereIn('status', ['pending', 'processing', 'shipped', 'delivered'])
            ->sum('vendor_earnings');

        $totalOrdersCount = OrderItem::where('store_id', $store->id)->distinct('order_id')->count('order_id');

        $pendingShipmentsCount = Shipment::where('store_id', $store->id)->where('status', 'pending')->count();

        // Low stock items
        $lowStockVariants = ProductVariant::whereHas('product', fn ($q) => $q->where('store_id', $store->id))
            ->with(['inventory', 'product'])
            ->get()
            ->filter(fn ($v) => ($v->inventory?->available_quantity ?? 0) <= ($v->inventory?->low_stock_threshold ?? 5))
            ->values();

        // Recent orders
        $recentItems = OrderItem::where('store_id', $store->id)
            ->with(['order.user', 'variant'])
            ->latest()
            ->take(5)
            ->get();

        return $this->respondSuccess([
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'commission_rate' => $store->commission_rate,
            ],
            'metrics' => [
                'total_sales' => $totalSales,
                'total_earnings' => $totalEarnings,
                'total_orders' => $totalOrdersCount,
                'pending_shipments' => $pendingShipmentsCount,
                'low_stock_count' => $lowStockVariants->count(),
            ],
            'low_stock_items' => $lowStockVariants->map(fn ($v) => [
                'variant_id' => $v->id,
                'product_name' => $v->product->name,
                'sku' => $v->sku,
                'available_quantity' => $v->inventory?->available_quantity ?? 0,
                'threshold' => $v->inventory?->low_stock_threshold ?? 5,
            ]),
            'recent_orders' => $recentItems->map(fn ($i) => [
                'order_item_id' => $i->id,
                'order_number' => $i->order->order_number,
                'customer_name' => $i->order->user->name,
                'product_name' => $i->product_name,
                'quantity' => $i->quantity,
                'total_price' => (float) $i->total_price,
                'vendor_earnings' => (float) $i->vendor_earnings,
                'status' => $i->status,
                'placed_at' => $i->created_at->toFormattedDateString(),
            ]),
        ]);
    }

    public function getStore(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);
        return $this->respondSuccess($store);
    }

    public function updateStore(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'logo_url' => ['nullable', 'string', 'url'],
            'banner_url' => ['nullable', 'string', 'url'],
        ]);

        $store->update($validated);

        return $this->respondSuccess($store, 'Store updated successfully.');
    }

    /**
     * Vendor's Products List
     */
    public function products(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $products = Product::where('store_id', $store->id)
            ->with(['category', 'primaryImage', 'variants.inventory', 'reviews'])
            ->latest()
            ->paginate(15);

        return $this->respondSuccess([
            'items' => ProductResource::collection($products->items()),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Store new product with variants and inventory.
     */
    public function storeProduct(ProductRequest $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $product = DB::transaction(function () use ($request, $store) {
            $slug = Str::slug($request->name);
            if (Product::where('slug', $slug)->exists()) {
                $slug .= '-' . Str::random(5);
            }

            $product = Product::create([
                'store_id' => $store->id,
                'category_id' => $request->category_id,
                'name' => $request->name,
                'slug' => $slug,
                'brand' => $request->brand,
                'short_description' => $request->short_description,
                'description' => $request->description,
                'base_price' => $request->base_price,
                'sale_price' => $request->sale_price,
                'status' => 'pending_moderation', // Moderator reviews before public display
            ]);

            // Save images
            if ($request->has('images')) {
                foreach ($request->images as $idx => $img) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $img['image_url'],
                        'is_primary' => $img['is_primary'] ?? ($idx === 0),
                        'sort_order' => $idx,
                    ]);
                }
            }

            // Save variants
            if ($request->has('variants') && count($request->variants) > 0) {
                foreach ($request->variants as $var) {
                    $variant = ProductVariant::create([
                        'product_id' => $product->id,
                        'sku' => $var['sku'],
                        'title' => $var['title'],
                        'price' => $var['price'],
                        'compare_at_price' => $var['compare_at_price'] ?? null,
                        'attributes' => $var['attributes'] ?? [],
                    ]);

                    $qty = $var['quantity'] ?? 10;
                    $inv = Inventory::create([
                        'product_variant_id' => $variant->id,
                        'quantity' => $qty,
                        'reserved_quantity' => 0,
                        'low_stock_threshold' => 5,
                    ]);

                    StockMovement::create([
                        'inventory_id' => $inv->id,
                        'type' => 'purchase',
                        'quantity_change' => $qty,
                        'balance_after' => $qty,
                        'notes' => 'Initial stock on product creation',
                    ]);
                }
            } else {
                // Create default variant
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => 'SKU-' . strtoupper(Str::random(8)),
                    'title' => 'Default',
                    'price' => $product->base_price,
                    'attributes' => ['option' => 'Standard'],
                ]);

                $inv = Inventory::create([
                    'product_variant_id' => $variant->id,
                    'quantity' => 25,
                    'reserved_quantity' => 0,
                    'low_stock_threshold' => 5,
                ]);

                StockMovement::create([
                    'inventory_id' => $inv->id,
                    'type' => 'purchase',
                    'quantity_change' => 25,
                    'balance_after' => 25,
                    'notes' => 'Initial stock on default variant',
                ]);
            }

            return $product;
        });

        $product->load(['category', 'images', 'variants.inventory', 'store']);

        return $this->respondSuccess(new ProductDetailResource($product), 'Product created and submitted for moderation.', 201);
    }

    /**
     * Update vendor product
     */
    public function updateProduct(int $id, ProductRequest $request): JsonResponse
    {
        $store = $this->getVendorStore($request);
        $product = Product::where('store_id', $store->id)->findOrFail($id);

        $product->update([
            'category_id' => $request->category_id,
            'name' => $request->name,
            'brand' => $request->brand,
            'short_description' => $request->short_description,
            'description' => $request->description,
            'base_price' => $request->base_price,
            'sale_price' => $request->sale_price,
        ]);

        $product->load(['category', 'images', 'variants.inventory', 'store']);

        return $this->respondSuccess(new ProductDetailResource($product), 'Product updated successfully.');
    }

    /**
     * Delete vendor product
     */
    public function deleteProduct(int $id, Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);
        $product = Product::where('store_id', $store->id)->findOrFail($id);
        $product->delete();

        return $this->respondSuccess(null, 'Product deleted.');
    }

    /**
     * Vendor inventory list with stock movements
     */
    public function inventory(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $variants = ProductVariant::whereHas('product', fn ($q) => $q->where('store_id', $store->id))
            ->with(['inventory.movements' => fn ($q) => $q->latest()->take(5), 'product'])
            ->paginate(20);

        return $this->respondSuccess($variants);
    }

    /**
     * Restock / Adjust quantity
     */
    public function updateInventory(int $variantId, Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);
        $variant = ProductVariant::whereHas('product', fn ($q) => $q->where('store_id', $store->id))->findOrFail($variantId);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $inventory = Inventory::where('product_variant_id', $variant->id)->firstOrFail();
        $oldQty = $inventory->quantity;
        $change = $validated['quantity'] - $oldQty;

        $inventory->quantity = $validated['quantity'];
        $inventory->save();

        StockMovement::create([
            'inventory_id' => $inventory->id,
            'type' => 'manual_adjustment',
            'quantity_change' => $change,
            'balance_after' => $inventory->quantity,
            'notes' => $validated['notes'] ?? 'Vendor manual stock adjustment',
        ]);

        return $this->respondSuccess($inventory, 'Stock updated successfully.');
    }

    /**
     * Vendor orders (items belonging to this store)
     */
    public function orders(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $orderItems = OrderItem::where('store_id', $store->id)
            ->with(['order.user', 'variant.product'])
            ->latest()
            ->paginate(15);

        return $this->respondSuccess($orderItems);
    }

    /**
     * Update shipping / tracking details for a shipment
     */
    public function updateShipping(int $shipmentId, Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);
        $shipment = Shipment::where('store_id', $store->id)->findOrFail($shipmentId);

        $validated = $request->validate([
            'tracking_number' => ['required', 'string', 'max:100'],
            'carrier' => ['required', 'string', 'max:100'],
            'status' => ['required', 'string', 'in:dispatched,in_transit,out_for_delivery,delivered'],
        ]);

        $shipment->update([
            'tracking_number' => $validated['tracking_number'],
            'carrier' => $validated['carrier'],
            'status' => $validated['status'],
            'shipped_at' => $shipment->shipped_at ?? now(),
            'delivered_at' => $validated['status'] === 'delivered' ? now() : $shipment->delivered_at,
        ]);

        // Update corresponding order items status
        OrderItem::where('order_id', $shipment->order_id)
            ->where('store_id', $store->id)
            ->update(['status' => $validated['status'] === 'delivered' ? 'delivered' : 'shipped']);

        return $this->respondSuccess($shipment, 'Shipment tracking updated.');
    }

    /**
     * Vendor commissions breakdown
     */
    public function commissions(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $commissions = OrderItem::where('store_id', $store->id)
            ->select(
                'id',
                'order_id',
                'product_name',
                'total_price',
                'commission_rate',
                'commission_amount',
                'vendor_earnings',
                'status',
                'created_at'
            )
            ->latest()
            ->paginate(20);

        return $this->respondSuccess($commissions);
    }

    /**
     * Vendor payout history
     */
    public function payouts(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $payouts = Payout::where('store_id', $store->id)->latest()->get();

        $availableBalance = (float) OrderItem::where('store_id', $store->id)
            ->where('status', 'delivered')
            ->sum('vendor_earnings') - (float) Payout::where('store_id', $store->id)
            ->whereIn('status', ['requested', 'processing', 'completed'])
            ->sum('amount');

        return $this->respondSuccess([
            'available_balance' => max(0.00, round($availableBalance, 2)),
            'payouts' => $payouts,
        ]);
    }

    /**
     * Request payout of earned balance
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $store = $this->getVendorStore($request);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:500'],
        ]);

        $availableBalance = (float) OrderItem::where('store_id', $store->id)
            ->where('status', 'delivered')
            ->sum('vendor_earnings') - (float) Payout::where('store_id', $store->id)
            ->whereIn('status', ['requested', 'processing', 'completed'])
            ->sum('amount');

        if ($validated['amount'] > $availableBalance) {
            return $this->respondError("Requested amount ₹{$validated['amount']} exceeds available earnings balance (₹{$availableBalance}).", 422);
        }

        $payout = Payout::create([
            'store_id' => $store->id,
            'amount' => $validated['amount'],
            'status' => 'requested',
            'requested_at' => now(),
        ]);

        return $this->respondSuccess($payout, 'Payout request submitted successfully.', 201);
    }
}

