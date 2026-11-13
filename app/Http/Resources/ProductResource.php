<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $primaryImg = $this->primaryImage?->image_url ?? $this->images->first()?->image_url;

        // Calculate average rating
        $avgRating = $this->reviews->where('is_approved', true)->avg('rating');
        $reviewCount = $this->reviews->where('is_approved', true)->count();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'brand' => $this->brand,
            'short_description' => $this->short_description,
            'base_price' => (float) $this->base_price,
            'sale_price' => $this->sale_price ? (float) $this->sale_price : null,
            'status' => $this->status,
            'image' => $primaryImg,
            'category' => [
                'id' => $this->category?->id,
                'name' => $this->category?->name,
                'slug' => $this->category?->slug,
            ],
            'store' => [
                'id' => $this->store?->id,
                'name' => $this->store?->name,
                'slug' => $this->store?->slug,
            ],
            'rating_avg' => $avgRating ? round($avgRating, 1) : 4.5,
            'rating_count' => $reviewCount,
            'variants_count' => $this->variants->count(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

