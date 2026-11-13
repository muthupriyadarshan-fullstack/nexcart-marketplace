<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ReturnSubmitRequest;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use App\Models\Review;
use App\Services\RefundService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerInteractionController extends BaseApiController
{
    public function __construct(
        protected RefundService $refundService
    ) {
    }

    public function submitReview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_item_id' => ['required', 'exists:order_items,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:200'],
            'comment' => ['required', 'string', 'max:2000'],
        ]);

        $item = OrderItem::with('order.user')->findOrFail($validated['order_item_id']);

        if ($item->order->user_id !== $request->user()->id) {
            return $this->respondForbidden('You can only review items you purchased.');
        }

        if ($item->order->status !== 'delivered' && $item->order->status !== 'paid') {
            return $this->respondError('You can only review items that have been paid or delivered.', 422);
        }

        if (Review::where('order_item_id', $item->id)->exists()) {
            return $this->respondError('You have already submitted a review for this purchase.', 422);
        }

        $review = Review::create([
            'product_id' => $item->variant->product_id,
            'user_id' => $request->user()->id,
            'order_item_id' => $item->id,
            'rating' => $validated['rating'],
            'title' => $validated['title'],
            'comment' => $validated['comment'],
            'is_approved' => true,
        ]);

        return $this->respondSuccess($review, 'Thank you! Your verified review has been submitted.', 201);
    }

    public function submitReturn(ReturnSubmitRequest $request): JsonResponse
    {
        try {
            $return = $this->refundService->requestReturn(
                $request->user(),
                $request->order_item_id,
                $request->reason,
                $request->description
            );

            return $this->respondSuccess($return, 'Return request submitted. Our team will review shortly.', 201);
        } catch (Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    public function returns(Request $request): JsonResponse
    {
        $returns = ReturnRequest::where('user_id', $request->user()->id)
            ->with(['orderItem.store', 'orderItem.variant.product', 'refund'])
            ->latest()
            ->get();

        return $this->respondSuccess($returns);
    }
}

