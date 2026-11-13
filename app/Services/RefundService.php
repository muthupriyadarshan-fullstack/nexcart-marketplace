<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Refund;
use App\Models\ReturnRequest;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class RefundService
{
    public function __construct(
        protected PaymentGatewayInterface $paymentGateway,
        protected CommissionService $commissionService,
        protected InventoryReservationService $inventoryService,
    ) {
    }

    /**
     * Customer requests a return for a specific order item.
     */
    public function requestReturn(User $user, int $orderItemId, string $reason, ?string $description = null): ReturnRequest
    {
        $item = OrderItem::with('order')->where('id', $orderItemId)->firstOrFail();

        if ($item->order->user_id !== $user->id) {
            throw new Exception('Unauthorized to request return for this item.');
        }

        if ($item->order->status !== 'delivered' && $item->order->status !== 'paid') {
            throw new Exception('Cannot return item before delivery or completed payment.');
        }

        $existing = ReturnRequest::where('order_item_id', $orderItemId)->first();
        if ($existing) {
            throw new Exception('Return request already exists for this item.');
        }

        return ReturnRequest::create([
            'order_item_id' => $item->id,
            'user_id' => $user->id,
            'reason' => $reason,
            'description' => $description,
            'status' => 'requested',
        ]);
    }

    /**
     * Admin or Support Staff approves return request and triggers payment gateway refund.
     */
    public function processRefund(ReturnRequest $returnRequest, User $processor, ?string $notes = null): Refund
    {
        $item = $returnRequest->orderItem;
        $order = $item->order;
        $payment = $order->payment;

        if (! $payment || ! $payment->gateway_payment_id) {
            throw new Exception('Cannot process refund: No captured gateway payment ID found.');
        }

        return DB::transaction(function () use ($returnRequest, $item, $order, $payment, $processor, $notes) {
            $refundAmount = (float) $item->total_price;

            // 1. Trigger refund via Payment Gateway
            $gatewayResponse = $this->paymentGateway->createRefund(
                $payment->gateway_payment_id,
                $refundAmount,
                $returnRequest->reason
            );

            // 2. Record Refund model
            $refund = Refund::create([
                'return_id' => $returnRequest->id,
                'order_id' => $order->id,
                'amount' => $refundAmount,
                'gateway_refund_id' => $gatewayResponse['id'] ?? ('rfnd_' . uniqid()),
                'reason' => $returnRequest->reason,
                'status' => 'processed',
                'processed_by' => $processor->id,
                'processed_at' => now(),
            ]);

            // 3. Update return request status
            $returnRequest->update([
                'status' => 'completed',
                'reviewed_by' => $processor->id,
                'reviewed_at' => now(),
                'review_notes' => $notes,
            ]);

            // 4. Update order item status
            $item->update(['status' => 'refunded']);

            // 5. Reverse commission in ledger
            $this->commissionService->reverseItemCommission($item);

            // 6. Restock returned item into inventory
            $this->inventoryService->restock(
                $item->variant,
                $item->quantity,
                "Restocked on refund #{$refund->id} for order #{$order->order_number}"
            );

            // 7. Check if all items in order are refunded
            $unrefundedCount = $order->items()->where('status', '!=', 'refunded')->count();
            if ($unrefundedCount === 0) {
                $order->update([
                    'status' => 'refunded',
                    'payment_status' => 'refunded',
                ]);
            }

            // 8. Create Audit Log
            AuditLog::create([
                'user_id' => $processor->id,
                'event' => 'refund.processed',
                'auditable_type' => Refund::class,
                'auditable_id' => $refund->id,
                'new_values' => [
                    'amount' => $refundAmount,
                    'order_number' => $order->order_number,
                    'item_id' => $item->id,
                    'gateway_refund_id' => $refund->gateway_refund_id,
                ],
            ]);

            return $refund;
        });
    }
}

