<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductDetailResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CatalogController extends BaseApiController
{
    /**
     * Get category tree with caching.
     */
    public function categories(): JsonResponse
    {
        $categories = Cache::remember('catalog_categories_tree', 3600, function () {
            return Category::whereNull('parent_id')
                ->where('is_active', true)
                ->with(['children' => fn ($q) => $q->where('is_active', true)])
                ->withCount(['products' => fn ($q) => $q->where('status', 'approved')])
                ->orderBy('sort_order')
                ->get();
        });

        return $this->respondSuccess(CategoryResource::collection($categories));
    }

    /**
     * Get single category by slug.
     */
    public function category(string $slug): JsonResponse
    {
        $category = Category::where('slug', $slug)
            ->where('is_active', true)
            ->with(['children', 'products' => fn ($q) => $q->where('status', 'approved')->with('primaryImage')])
            ->firstOrFail();

        return $this->respondSuccess(new CategoryResource($category));
    }

    /**
     * Search and filter products.
     */
    public function products(Request $request): JsonResponse
    {
        $filters = $request->only(['q', 'category_id', 'category_slug', 'brand', 'min_price', 'max_price', 'store_id']);
        $sortBy = $request->get('sort_by', 'latest');
        $perPage = (int) $request->get('per_page', 12);

        $query = Product::where('status', 'approved')
            ->filter($filters)
            ->with(['primaryImage', 'images', 'category', 'store', 'variants.inventory', 'reviews']);

        switch ($sortBy) {
            case 'price_asc':
                $query->orderBy('base_price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('base_price', 'desc');
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }

        $products = $query->paginate($perPage);

        return $this->respondSuccess([
            'items' => ProductResource::collection($products->items()),
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Product details with variants and store info.
     */
    public function product(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)
            ->where('status', 'approved')
            ->with([
                'category',
                'store',
                'images',
                'variants.inventory',
                'reviews.user',
            ])
            ->firstOrFail();

        return $this->respondSuccess(new ProductDetailResource($product));
    }

    /**
     * Store public view.
     */
    public function store(string $slug): JsonResponse
    {
        $store = Store::where('slug', $slug)
            ->where('status', 'active')
            ->with(['products' => function ($q) {
                $q->where('status', 'approved')->with('primaryImage', 'variants.inventory', 'reviews');
            }])
            ->firstOrFail();

        return $this->respondSuccess([
            'id' => $store->id,
            'name' => $store->name,
            'slug' => $store->slug,
            'description' => $store->description,
            'logo_url' => $store->logo_url,
            'banner_url' => $store->banner_url,
            'products' => ProductResource::collection($store->products),
        ]);
    }
}

