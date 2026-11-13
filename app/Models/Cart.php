<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'coupon_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function getSubtotalAttribute(): float
    {
        return (float) $this->items->sum(function (CartItem $item) {
            return (float) $item->subtotal;
        });
    }

    public function getDiscountAmountAttribute(): float
    {
        if (! $this->coupon) {
            return 0.00;
        }

        if (! $this->coupon->isValidFor($this->subtotal, $this->user_id)) {
            return 0.00;
        }

        return $this->coupon->calculateDiscount($this->subtotal);
    }

    public function getGrandTotalAttribute(): float
    {
        return max(0.00, round($this->subtotal - $this->discount_amount, 2));
    }
}

