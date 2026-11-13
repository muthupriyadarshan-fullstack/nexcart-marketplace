<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $wishlists = Wishlist::where('user_id', $userId)
            ->with(['product.primaryImage', 'product.store', 'product.variants.inventory', 'product.reviews'])
            ->latest()
            ->get();

        $products = $wishlists->pluck('product')->filter();

        return $this->respondSuccess(ProductResource::collection($products));
    }

    public function toggle(int $productId, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $product = Product::findOrFail($productId);

        $existing = Wishlist::where('user_id', $userId)->where('product_id', $product->id)->first();

        if ($existing) {
            $existing->delete();
            return $this->respondSuccess(['in_wishlist' => false], 'Removed from wishlist.');
        }

        Wishlist::create([
            'user_id' => $userId,
            'product_id' => $product->id,
        ]);

        return $this->respondSuccess(['in_wishlist' => true], 'Added to wishlist.');
    }
}

