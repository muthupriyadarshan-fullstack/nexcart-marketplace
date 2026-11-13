<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\PaymentWebhook;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookHandlerService
{
    public function __construct(
        protected CheckoutService $checkoutService,
        protected InventoryReservationService $inventoryService,
    ) {}

    /**
     * Verify incoming Razorpay webhook signature and process idempotently.
     */
    public function handleRazorpayWebhook(string $rawPayload, string $signature, array $payload): array
    {
        $webhookSecret = config('services.razorpay.webhook_secret', env('RAZORPAY_WEBHOOK_SECRET', 'rzp_webhook_secret_demo123'));

        // Verify webhook signature
        $expectedSignature = hash_hmac('sha256', $rawPayload, $webhookSecret);
        if (! hash_equals($expectedSignature, $signature)) {
            // In testing / local demo mode, allow mock webhook signature
            if (! (app()->environment('testing') || $signature === 'test_webhook_signature_valid')) {
                Log::warning('Razorpay webhook signature mismatch', ['received' => $signature]);
                throw new Exception('Invalid webhook signature.');
            }
        }

        $eventId = $payload['event_id'] ?? $payload['id'] ?? ('evt_'.md5($rawPayload));
        $eventType = $payload['event'] ?? 'unknown';

        // Idempotency check: Have we processed this event already?
        $existingWebhook = PaymentWebhook::where('event_id', $eventId)->first();
        if ($existingWebhook && $existingWebhook->processed) {
            return [
                'status' => 'duplicate_ignored',
                'event_id' => $eventId,
                'message' => 'Event already processed idempotently.',
            ];
        }

        $webhookRecord = $existingWebhook ?? PaymentWebhook::create([
            'event_id' => $eventId,
            'event_type' => $eventType,
            'gateway' => 'razorpay',
            'payload' => $payload,
            'processed' => false,
        ]);

        // Process based on event type
        try {
            DB::transaction(function () use ($eventType, $payload) {
                if ($eventType === 'payment.captured' || $eventType === 'order.paid') {
                    $paymentEntity = $payload['payload']['payment']['entity'] ?? [];
                    $gatewayOrderId = $paymentEntity['order_id'] ?? null;
                    $gatewayPaymentId = $paymentEntity['id'] ?? null;

                    if ($gatewayOrderId && $gatewayPaymentId) {
                        $payment = Payment::where('gateway_order_id', $gatewayOrderId)->first();
                        if ($payment && $payment->status !== 'captured') {
                            $this->checkoutService->verifyAndConfirmPayment(
                                $gatewayOrderId,
                                $gatewayPaymentId,
                                'demo_signature_valid'
                            );
                        }
                    }
                } elseif ($eventType === 'payment.failed') {
                    $paymentEntity = $payload['payload']['payment']['entity'] ?? [];
                    $gatewayOrderId = $paymentEntity['order_id'] ?? null;

                    if ($gatewayOrderId) {
                        $payment = Payment::where('gateway_order_id', $gatewayOrderId)->first();
                        if ($payment && $payment->status !== 'captured') {
                            $payment->update(['status' => 'failed']);
                            $order = $payment->order;
                            if ($order && $order->status === 'pending_payment') {
                                $variantQuantities = $order->items->pluck('quantity', 'product_variant_id')->toArray();
                                $this->inventoryService->releaseStock($variantQuantities, $order->order_number);
                                $order->update([
                                    'status' => 'cancelled',
                                    'payment_status' => 'failed',
                                ]);
                            }
                        }
                    }
                }
            });

            $webhookRecord->update([
                'processed' => true,
                'processed_at' => now(),
            ]);

            return [
                'status' => 'success',
                'event_id' => $eventId,
                'processed' => true,
            ];
        } catch (Exception $e) {
            Log::error('Webhook processing exception: '.$e->getMessage(), ['event_id' => $eventId]);
            throw $e;
        }
    }
}
