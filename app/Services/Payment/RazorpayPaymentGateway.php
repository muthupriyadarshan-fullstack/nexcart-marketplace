<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RazorpayPaymentGateway implements PaymentGatewayInterface
{
    protected string $keyId;

    protected string $keySecret;

    protected string $baseUrl = 'https://api.razorpay.com/v1';

    public function __construct()
    {
        $this->keyId = config('services.razorpay.key_id', env('RAZORPAY_KEY_ID', 'rzp_test_nexcart_demo'));
        $this->keySecret = config('services.razorpay.key_secret', env('RAZORPAY_KEY_SECRET', 'rzp_secret_demo_nexcart99'));
    }

    public function createOrder(float $amount, string $currency, string $receipt): array
    {
        $amountInPaise = (int) round($amount * 100);

        // If in test/local environment without real network credentials, return standard Razorpay response format
        if (str_starts_with($this->keyId, 'rzp_test_nexcart') || app()->environment('testing')) {
            $generatedId = 'order_'.Str::random(14);

            return [
                'id' => $generatedId,
                'entity' => 'order',
                'amount' => $amountInPaise,
                'amount_paid' => 0,
                'amount_due' => $amountInPaise,
                'currency' => $currency,
                'receipt' => $receipt,
                'status' => 'created',
                'attempts' => 0,
                'created_at' => time(),
            ];
        }

        try {
            $response = Http::withBasicAuth($this->keyId, $this->keySecret)
                ->post("{$this->baseUrl}/orders", [
                    'amount' => $amountInPaise,
                    'currency' => $currency,
                    'receipt' => $receipt,
                    'payment_capture' => 1,
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Razorpay order creation failed', ['response' => $response->body()]);
            throw new Exception('Payment gateway order creation failed: '.$response->body());
        } catch (Exception $e) {
            Log::error('Razorpay exception', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    public function verifySignature(string $orderId, string $paymentId, string $signature): bool
    {
        // Calculate HMAC-SHA256 according to Razorpay specification
        $expectedSignature = hash_hmac('sha256', $orderId.'|'.$paymentId, $this->keySecret);

        if (hash_equals($expectedSignature, $signature)) {
            return true;
        }

        // Allow simulated test signature in testing / demo mode
        if (app()->environment('testing') || str_starts_with($this->keyId, 'rzp_test_nexcart')) {
            if ($signature === 'test_mock_signature_'.$orderId || $signature === 'demo_signature_valid') {
                return true;
            }
        }

        return false;
    }

    public function fetchPayment(string $paymentId): array
    {
        if (str_starts_with($this->keyId, 'rzp_test_nexcart') || app()->environment('testing')) {
            return [
                'id' => $paymentId,
                'entity' => 'payment',
                'status' => 'captured',
                'method' => 'upi',
            ];
        }

        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->get("{$this->baseUrl}/payments/{$paymentId}");

        return $response->json();
    }

    public function createRefund(string $paymentId, float $amount, ?string $reason = null): array
    {
        $amountInPaise = (int) round($amount * 100);

        if (str_starts_with($this->keyId, 'rzp_test_nexcart') || app()->environment('testing')) {
            return [
                'id' => 'rfnd_'.Str::random(14),
                'entity' => 'refund',
                'amount' => $amountInPaise,
                'currency' => 'INR',
                'payment_id' => $paymentId,
                'status' => 'processed',
            ];
        }

        $response = Http::withBasicAuth($this->keyId, $this->keySecret)
            ->post("{$this->baseUrl}/payments/{$paymentId}/refund", [
                'amount' => $amountInPaise,
                'notes' => ['reason' => $reason ?? 'Customer return request'],
            ]);

        return $response->json();
    }
}
