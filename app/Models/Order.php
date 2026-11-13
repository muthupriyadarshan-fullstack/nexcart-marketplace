<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'shipping_address',
        'billing_address',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'shipping_fee',
        'grand_total',
        'currency',
        'status',
        'payment_status',
        'placed_at',
    ];

    protected function casts(): array
    {
        return [
            'shipping_address' => 'array',
            'billing_address' => 'array',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'shipping_fee' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'placed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function couponUsage(): HasOne
    {
        return $this->hasOne(CouponUsage::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    /**
     * Get vendor-wise subtotal breakdown for multi-vendor transparency.
     */
    public function getVendorSplits(): array
    {
        $splits = [];
        foreach ($this->items as $item) {
            $storeId = $item->store_id;
            if (! isset($splits[$storeId])) {
                $splits[$storeId] = [
                    'store_id' => $storeId,
                    'store_name' => $item->store?->name ?? 'Unknown Store',
                    'subtotal' => 0.00,
                    'commission' => 0.00,
                    'net_vendor_earnings' => 0.00,
                    'items_count' => 0,
                ];
            }
            $splits[$storeId]['subtotal'] += (float) $item->total_price;
            $splits[$storeId]['commission'] += (float) $item->commission_amount;
            $splits[$storeId]['net_vendor_earnings'] += (float) $item->vendor_earnings;
            $splits[$storeId]['items_count'] += $item->quantity;
        }

        return array_values($splits);
    }
}

