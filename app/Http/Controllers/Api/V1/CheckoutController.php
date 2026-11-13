<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\CheckoutInitRequest;
use App\Http\Requests\PaymentVerifyRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\CheckoutService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends BaseApiController
{
    public function __construct(
        protected CheckoutService $checkoutService
    ) {}

    /**
     * Lock inventory, calculate vendor splits, and initialize payment.
     */
    public function initialize(CheckoutInitRequest $request): JsonResponse
    {
        try {
            $result = $this->checkoutService->initializeCheckout(
                $request->user(),
                $request->validated()
            );

            return $this->respondSuccess($result, 'Checkout initialized. Stock reserved for 15 minutes.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage(), 422);
        }
    }

    /**
     * Verify payment signature from frontend and confirm order.
     */
    public function verifyPayment(PaymentVerifyRequest $request): JsonResponse
    {
        try {
            $order = $this->checkoutService->verifyAndConfirmPayment(
                $request->razorpay_order_id,
                $request->razorpay_payment_id,
                $request->razorpay_signature
            );

            return $this->respondSuccess(new OrderResource($order), 'Payment confirmed successfully. Order placed.');
        } catch (Exception $e) {
            return $this->respondError($e->getMessage(), 400);
        }
    }

    /**
     * List user orders.
     */
    public function orders(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items.store', 'shipments', 'payment'])
            ->latest()
            ->paginate(10);

        return $this->respondSuccess([
            'items' => OrderResource::collection($orders->items()),
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Single order details with multi-vendor splits.
     */
    public function orderDetail(string $orderNumber, Request $request): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->where('user_id', $request->user()->id)
            ->with(['items.store', 'items.review', 'items.returnRequest', 'shipments', 'payment'])
            ->firstOrFail();

        return $this->respondSuccess(new OrderResource($order));
    }
}
