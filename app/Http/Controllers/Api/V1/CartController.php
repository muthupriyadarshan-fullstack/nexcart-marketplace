<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\AddToCartRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends BaseApiController
{
    protected function getOrCreateUserCart(Request $request): Cart
    {
        $userId = $request->user()->id;

        return Cart::firstOrCreate(
            ['user_id' => $userId],
            ['session_id' => session()->getId()]
        );
    }

    public function getCart(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateUserCart($request);
        $cart->load(['items.variant.product.store', 'items.variant.product.primaryImage', 'items.variant.inventory', 'coupon']);

        return $this->respondSuccess(new CartResource($cart));
    }

    public function addItem(AddToCartRequest $request): JsonResponse
    {
        $variant = ProductVariant::with(['inventory', 'product'])->findOrFail($request->product_variant_id);
        $available = $variant->inventory?->available_quantity ?? 0;

        if ($available < $request->quantity) {
            return $this->respondError("Requested quantity exceeds available stock ({$available} available).", 422);
        }

        $cart = $this->getOrCreateUserCart($request);

        $cartItem = CartItem::where('cart_id', $cart->id)
            ->where('product_variant_id', $variant->id)
            ->first();

        if ($cartItem) {
            $newQuantity = $cartItem->quantity + $request->quantity;
            if ($available < $newQuantity) {
                return $this->respondError("Total cart quantity exceeds available stock ({$available} available).", 422);
            }
            $cartItem->quantity = $newQuantity;
            $cartItem->save();
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_variant_id' => $variant->id,
                'quantity' => $request->quantity,
            ]);
        }

        $cart->load(['items.variant.product.store', 'items.variant.product.primaryImage', 'items.variant.inventory', 'coupon']);

        return $this->respondSuccess(new CartResource($cart), 'Item added to cart.');
    }

    public function updateItem(int $id, Request $request): JsonResponse
    {
        $request->validate(['quantity' => ['required', 'integer', 'min:1', 'max:50']]);

        $cart = $this->getOrCreateUserCart($request);
        $item = CartItem::where('cart_id', $cart->id)->where('id', $id)->firstOrFail();

        $available = $item->variant->inventory?->available_quantity ?? 0;
        if ($available < $request->quantity) {
            return $this->respondError("Requested quantity exceeds available stock ({$available} available).", 422);
        }

        $item->quantity = $request->quantity;
        $item->save();

        $cart->load(['items.variant.product.store', 'items.variant.product.primaryImage', 'items.variant.inventory', 'coupon']);

        return $this->respondSuccess(new CartResource($cart), 'Cart updated.');
    }

    public function removeItem(int $id, Request $request): JsonResponse
    {
        $cart = $this->getOrCreateUserCart($request);
        $item = CartItem::where('cart_id', $cart->id)->where('id', $id)->firstOrFail();
        $item->delete();

        $cart->load(['items.variant.product.store', 'items.variant.product.primaryImage', 'items.variant.inventory', 'coupon']);

        return $this->respondSuccess(new CartResource($cart), 'Item removed from cart.');
    }

    public function applyCoupon(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string']]);

        $cart = $this->getOrCreateUserCart($request);
        $coupon = Coupon::where('code', strtoupper(trim($request->code)))->first();

        if (! $coupon) {
            return $this->respondError('Coupon not found.', 404);
        }

        if (! $coupon->isValidFor($cart->subtotal, $request->user()->id)) {
            return $this->respondError('Coupon conditions are not met or usage limit reached.', 422);
        }

        $cart->coupon_id = $coupon->id;
        $cart->save();
        $cart->load(['items.variant.product.store', 'items.variant.product.primaryImage', 'items.variant.inventory', 'coupon']);

        return $this->respondSuccess(new CartResource($cart), 'Coupon applied successfully.');
    }

    public function removeCoupon(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateUserCart($request);
        $cart->coupon_id = null;
        $cart->save();
        $cart->load(['items.variant.product.store', 'items.variant.product.primaryImage', 'items.variant.inventory', 'coupon']);

        return $this->respondSuccess(new CartResource($cart), 'Coupon removed.');
    }
}

