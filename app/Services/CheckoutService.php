<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\Shipment;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutService
{
    public function __construct(
        protected InventoryReservationService $inventoryService,
        protected CommissionService $commissionService,
        protected PaymentGatewayInterface $paymentGateway,
    ) {
    }

    /**
     * Atomically reserve stock, calculate vendor splits, and initialize payment.
     */
    public function initializeCheckout(User $user, array $data): array
    {
        $shippingAddress = null;
        if (! empty($data['shipping_address_id'])) {
            $address = Address::where('id', $data['shipping_address_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
            $shippingAddress = $address->toArray();
        } elseif (! empty($data['shipping_address'])) {
            $shippingAddress = $data['shipping_address'];
        } else {
            throw new Exception('Shipping address is required.');
        }

        $billingAddress = null;
        if (! empty($data['billing_address_id'])) {
            $address = Address::where('id', $data['billing_address_id'])
                ->where('user_id', $user->id)
                ->firstOrFail();
            $billingAddress = $address->toArray();
        } elseif (! empty($data['billing_address'])) {
            $billingAddress = $data['billing_address'];
        } else {
            $billingAddress = $shippingAddress;
        }

        $cart = Cart::with(['items.variant.product.store', 'coupon'])
            ->where('user_id', $user->id)
            ->first();

        if (! $cart || $cart->items->isEmpty()) {
            throw new Exception('Cart is empty.');
        }

        // Apply coupon if passed explicitly
        if (! empty($data['coupon_code'])) {
            $coupon = Coupon::where('code', strtoupper($data['coupon_code']))->first();
            if ($coupon && $coupon->isValidFor($cart->subtotal, $user->id)) {
                $cart->coupon_id = $coupon->id;
                $cart->save();
                $cart->load('coupon');
            }
        }

        $orderNumber = 'NEX-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        // Prepare inventory reservation mapping: variantId => requestedQty
        $variantQuantities = [];
        foreach ($cart->items as $cartItem) {
            $variantQuantities[$cartItem->product_variant_id] = $cartItem->quantity;
        }

        return DB::transaction(function () use ($user, $cart, $orderNumber, $shippingAddress, $billingAddress, $variantQuantities) {
            // 1. Atomically lock & reserve inventory
            $this->inventoryService->reserveStock($variantQuantities, $orderNumber);

            $subtotal = $cart->subtotal;
            $discountAmount = $cart->discount_amount;
            $taxAmount = round(($subtotal - $discountAmount) * 0.18, 2); // 18% GST (Standard Indian e-commerce GST rate)
            $shippingFee = $subtotal > 999 ? 0.00 : 99.00; // Free shipping above ₹999
            $grandTotal = round($subtotal - $discountAmount + $taxAmount + $shippingFee, 2);

            // 2. Create Master Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => $user->id,
                'shipping_address' => $shippingAddress,
                'billing_address' => $billingAddress,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'shipping_fee' => $shippingFee,
                'grand_total' => $grandTotal,
                'currency' => 'INR',
                'status' => 'pending_payment',
                'payment_status' => 'pending',
                'placed_at' => now(),
            ]);

            // 3. Create Order Items with vendor subtotal and platform commission
            foreach ($cart->items as $item) {
                $variant = $item->variant;
                $product = $variant->product;
                $store = $product->store;

                $itemTotal = round((float) $variant->price * $item->quantity, 2);
                $commissionRate = (float) ($store->commission_rate ?? 10.00);
                $commissionData = $this->commissionService->calculateItemCommission($itemTotal, $commissionRate);

                OrderItem::create([
                    'order_id' => $order->id,
                    'store_id' => $store->id,
                    'product_variant_id' => $variant->id,
                    'product_name' => $product->name,
                    'variant_sku' => $variant->sku,
                    'unit_price' => $variant->price,
                    'quantity' => $item->quantity,
                    'total_price' => $itemTotal,
                    'commission_rate' => $commissionData['commission_rate'],
                    'commission_amount' => $commissionData['platform_fee'],
                    'vendor_earnings' => $commissionData['net_vendor_earnings'],
                    'status' => 'pending',
                ]);
            }

            // 4. Initialize Razorpay Gateway Order
            $gatewayOrder = $this->paymentGateway->createOrder(
                $grandTotal,
                'INR',
                $orderNumber
            );

            // 5. Record Payment initialization
            $payment = Payment::create([
                'order_id' => $order->id,
                'gateway' => 'razorpay',
                'gateway_order_id' => $gatewayOrder['id'],
                'amount' => $grandTotal,
                'currency' => 'INR',
                'status' => 'created',
                'idempotency_key' => (string) Str::uuid(),
            ]);

            return [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'subtotal' => $order->subtotal,
                'discount_amount' => $order->discount_amount,
                'tax_amount' => $order->tax_amount,
                'shipping_fee' => $order->shipping_fee,
                'grand_total' => $order->grand_total,
                'currency' => $order->currency,
                'razorpay_order_id' => $gatewayOrder['id'],
                'razorpay_key_id' => env('RAZORPAY_KEY_ID', 'rzp_test_nexcart_demo'),
                'payment_id' => $payment->id,
            ];
        });
    }

    /**
     * Verify payment signature and finalize order execution.
     */
    public function verifyAndConfirmPayment(string $gatewayOrderId, string $gatewayPaymentId, string $signature): Order
    {
        $payment = Payment::where('gateway_order_id', $gatewayOrderId)->firstOrFail();
        $order = $payment->order;

        // Idempotency: If already captured, return immediately
        if ($payment->status === 'captured') {
            return $order->load(['items.store', 'shipments']);
        }

        // Verify Razorpay HMAC-SHA256 signature
        $isValid = $this->paymentGateway->verifySignature($gatewayOrderId, $gatewayPaymentId, $signature);
        if (! $isValid) {
            $payment->status = 'failed';
            $payment->save();

            // Release reserved inventory
            $variantQuantities = $order->items->pluck('quantity', 'product_variant_id')->toArray();
            $this->inventoryService->releaseStock($variantQuantities, $order->order_number);

            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
            ]);

            throw new Exception('Payment signature verification failed.');
        }

        return DB::transaction(function () use ($payment, $order, $gatewayPaymentId, $signature) {
            // 1. Mark Payment as captured
            $payment->update([
                'gateway_payment_id' => $gatewayPaymentId,
                'gateway_signature' => $signature,
                'status' => 'captured',
            ]);

            // 2. Mark Order as paid and processing
            $order->update([
                'status' => 'paid',
                'payment_status' => 'captured',
            ]);

            // 3. Deduct reserved stock permanently
            $variantQuantities = $order->items->pluck('quantity', 'product_variant_id')->toArray();
            $this->inventoryService->deductStock($variantQuantities, $order->order_number);

            // 4. Create Shipments per distinct vendor store
            $storeIds = $order->items->pluck('store_id')->unique();
            foreach ($storeIds as $storeId) {
                Shipment::firstOrCreate([
                    'order_id' => $order->id,
                    'store_id' => $storeId,
                ], [
                    'tracking_number' => 'TRK-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
                    'carrier' => 'Blue Dart Express',
                    'status' => 'pending',
                ]);
            }

            // 5. Record vendor commissions
            $this->commissionService->recordOrderCommissions($order);

            // 6. Record coupon usage and clear user cart
            $cart = Cart::where('user_id', $order->user_id)->first();
            if ($cart) {
                if ($cart->coupon_id) {
                    $coupon = Coupon::find($cart->coupon_id);
                    if ($coupon) {
                        CouponUsage::create([
                            'coupon_id' => $coupon->id,
                            'user_id' => $order->user_id,
                            'order_id' => $order->id,
                            'discount_applied' => $order->discount_amount,
                        ]);
                        $coupon->increment('used_count');
                    }
                }

                $cart->items()->delete();
                $cart->update(['coupon_id' => null]);
            }

            return $order->load(['items.store', 'shipments', 'payment']);
        });
    }
}

