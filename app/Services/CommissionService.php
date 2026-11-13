<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Order;
use App\Models\OrderItem;

class CommissionService
{
    /**
     * Compute fee splits for an item line.
     */
    public function calculateItemCommission(float $itemTotal, float $commissionRate): array
    {
        $platformFee = round(($itemTotal * $commissionRate) / 100, 2);
        $vendorEarnings = round($itemTotal - $platformFee, 2);

        return [
            'commission_rate' => $commissionRate,
            'platform_fee' => $platformFee,
            'net_vendor_earnings' => $vendorEarnings,
        ];
    }

    /**
     * Record commission ledger records for confirmed order items.
     */
    public function recordOrderCommissions(Order $order): void
    {
        foreach ($order->items as $item) {
            Commission::updateOrCreate(
                [
                    'order_item_id' => $item->id,
                ],
                [
                    'store_id' => $item->store_id,
                    'order_amount' => $item->total_price,
                    'commission_rate' => $item->commission_rate,
                    'platform_fee' => $item->commission_amount,
                    'net_vendor_earnings' => $item->vendor_earnings,
                    'status' => 'earned',
                ]
            );
        }
    }

    /**
     * Reverse commissions when an order or item is refunded.
     */
    public function reverseItemCommission(OrderItem $item): void
    {
        $commission = Commission::where('order_item_id', $item->id)->first();
        if ($commission) {
            $commission->status = 'reversed';
            $commission->save();
        }
    }
}

