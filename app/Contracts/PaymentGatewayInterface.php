<?php

namespace App\Contracts;

interface PaymentGatewayInterface
{
    /**
     * Create an order on the gateway.
     */
    public function createOrder(float $amount, string $currency, string $receipt): array;

    /**
     * Verify server-side payment signature.
     */
    public function verifySignature(string $orderId, string $paymentId, string $signature): bool;

    /**
     * Fetch payment status from the gateway.
     */
    public function fetchPayment(string $paymentId): array;

    /**
     * Issue refund via the gateway.
     */
    public function createRefund(string $paymentId, float $amount, ?string $reason = null): array;
}

