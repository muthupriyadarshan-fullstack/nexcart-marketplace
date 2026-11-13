<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BaseApiController extends Controller
{
    public function respondSuccess(mixed $data = null, string $message = 'Request successful', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    public function respondError(string $message, int $statusCode = 400, mixed $errors = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $statusCode);
    }

    public function respondUnauthorized(string $message = 'Unauthenticated'): JsonResponse
    {
        return $this->respondError($message, 401);
    }

    public function respondForbidden(string $message = 'Access forbidden'): JsonResponse
    {
        return $this->respondError($message, 403);
    }
}
