<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'subtotal' => (float) $this->subtotal,
            'discount_amount' => (float) $this->discount_amount,
            'tax_amount' => (float) $this->tax_amount,
            'shipping_fee' => (float) $this->shipping_fee,
            'grand_total' => (float) $this->grand_total,
            'currency' => $this->currency,
            'shipping_address' => $this->shipping_address,
            'billing_address' => $this->billing_address,
            'placed_at' => $this->placed_at?->toIso8601String(),
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'store_id' => $item->store_id,
                'store_name' => $item->store?->name,
                'product_name' => $item->product_name,
                'variant_sku' => $item->variant_sku,
                'unit_price' => (float) $item->unit_price,
                'quantity' => $item->quantity,
                'total_price' => (float) $item->total_price,
                'status' => $item->status,
                'is_reviewed' => $item->review !== null,
                'has_return_request' => $item->returnRequest !== null,
            ]),
            'vendor_splits' => $this->getVendorSplits(),
            'shipments' => $this->shipments->map(fn ($shipment) => [
                'id' => $shipment->id,
                'store_id' => $shipment->store_id,
                'store_name' => $shipment->store?->name,
                'tracking_number' => $shipment->tracking_number,
                'carrier' => $shipment->carrier,
                'status' => $shipment->status,
                'shipped_at' => $shipment->shipped_at?->toIso8601String(),
                'delivered_at' => $shipment->delivered_at?->toIso8601String(),
            ]),
            'payment' => $this->payment ? [
                'gateway' => $this->payment->gateway,
                'gateway_order_id' => $this->payment->gateway_order_id,
                'gateway_payment_id' => $this->payment->gateway_payment_id,
                'status' => $this->payment->status,
                'amount' => (float) $this->payment->amount,
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
