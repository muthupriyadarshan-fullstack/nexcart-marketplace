<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\WebhookHandlerService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookController extends BaseApiController
{
    public function __construct(
        protected WebhookHandlerService $webhookHandler
    ) {
    }

    public function handleRazorpay(Request $request): JsonResponse
    {
        $signature = $request->header('X-Razorpay-Signature', '');
        $rawPayload = $request->getContent();
        $payload = $request->all();

        try {
            $result = $this->webhookHandler->handleRazorpayWebhook(
                $rawPayload,
                $signature,
                $payload
            );

            return response()->json($result, 200);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}

