<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Order;
use App\Models\ReturnRequest;
use App\Services\RefundService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends BaseApiController
{
    public function __construct(
        protected RefundService $refundService
    ) {}

    /**
     * Customer support order lookup
     */
    public function orders(Request $request): JsonResponse
    {
        $q = $request->get('q');

        $query = Order::with(['user', 'items.store', 'shipments', 'payment']);

        if ($q) {
            $query->where(function ($sub) use ($q) {
                $sub->where('order_number', 'like', "%{$q}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$q}%")->orWhere('phone', 'like', "%{$q}%"));
            });
        }

        $orders = $query->latest()->paginate(20);

        return $this->respondSuccess($orders);
    }

    /**
     * Return dispute requests
     */
    public function returns(): JsonResponse
    {
        $returns = ReturnRequest::with(['user', 'orderItem.store', 'orderItem.order'])
            ->latest()
            ->paginate(20);

        return $this->respondSuccess($returns);
    }

    /**
     * Resolve return request (support resolution)
     */
    public function reviewReturn(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $returnRequest = ReturnRequest::with(['orderItem.order.payment', 'orderItem.variant'])->findOrFail($id);

        if ($validated['status'] === 'approved') {
            try {
                $refund = $this->refundService->processRefund(
                    $returnRequest,
                    $request->user(),
                    $validated['notes']
                );

                return $this->respondSuccess($refund, 'Return approved and refund issued.');
            } catch (Exception $e) {
                return $this->respondError($e->getMessage(), 422);
            }
        }

        $returnRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_notes' => $validated['notes'],
        ]);

        return $this->respondSuccess($returnRequest, 'Return request rejected.');
    }
}
