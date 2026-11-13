<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'items' => $this->items->map(function ($item) {
                $variant = $item->variant;
                $product = $variant?->product;
                return [
                    'id' => $item->id,
                    'product_id' => $product?->id,
                    'product_name' => $product?->name,
                    'product_slug' => $product?->slug,
                    'variant_id' => $variant?->id,
                    'variant_title' => $variant?->title,
                    'sku' => $variant?->sku,
                    'price' => (float) ($variant?->price ?? 0),
                    'quantity' => $item->quantity,
                    'subtotal' => $item->subtotal,
                    'image' => $product?->primaryImage?->image_url ?? $product?->images->first()?->image_url,
                    'store' => [
                        'id' => $product?->store?->id,
                        'name' => $product?->store?->name,
                    ],
                    'in_stock' => ($variant?->inventory?->available_quantity ?? 0) >= $item->quantity,
                    'available_stock' => $variant?->inventory?->available_quantity ?? 0,
                ];
            }),
            'items_count' => $this->items->sum('quantity'),
            'subtotal' => $this->subtotal,
            'discount_amount' => $this->discount_amount,
            'coupon' => $this->coupon ? [
                'code' => $this->coupon->code,
                'discount_type' => $this->coupon->discount_type,
                'discount_value' => (float) $this->coupon->discount_value,
            ] : null,
            'estimated_tax' => round(($this->subtotal - $this->discount_amount) * 0.18, 2),
            'shipping_fee' => $this->subtotal > 999 ? 0.00 : 99.00,
            'grand_total' => $this->grand_total,
        ];
    }
}

