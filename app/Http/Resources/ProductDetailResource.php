<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avgRating = $this->reviews->where('is_approved', true)->avg('rating');
        $reviewCount = $this->reviews->where('is_approved', true)->count();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'brand' => $this->brand,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'base_price' => (float) $this->base_price,
            'sale_price' => $this->sale_price ? (float) $this->sale_price : null,
            'status' => $this->status,
            'category' => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ],
            'store' => [
                'id' => $this->store?->id,
                'name' => $this->store?->name,
                'slug' => $this->store?->slug,
                'logo_url' => $this->store?->logo_url,
                'description' => $this->store?->description,
            ],
            'images' => $this->images->map(fn ($img) => [
                'id' => $img->id,
                'url' => $img->image_url,
                'is_primary' => $img->is_primary,
            ]),
            'variants' => $this->variants->map(fn ($variant) => [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'title' => $variant->title,
                'attributes' => $variant->attributes,
                'price' => (float) $variant->price,
                'compare_at_price' => $variant->compare_at_price ? (float) $variant->compare_at_price : null,
                'in_stock' => ($variant->inventory?->available_quantity ?? 0) > 0,
                'available_quantity' => $variant->inventory?->available_quantity ?? 0,
            ]),
            'reviews' => $this->reviews->where('is_approved', true)->map(fn ($rev) => [
                'id' => $rev->id,
                'user_name' => $rev->user?->name ?? 'Verified Buyer',
                'rating' => $rev->rating,
                'title' => $rev->title,
                'comment' => $rev->comment,
                'created_at' => $rev->created_at?->toFormattedDateString(),
            ]),
            'rating_avg' => $avgRating ? round($avgRating, 1) : 4.5,
            'rating_count' => $reviewCount,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

