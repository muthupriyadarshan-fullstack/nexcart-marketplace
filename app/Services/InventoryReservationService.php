<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Exception;
use Illuminate\Support\Facades\DB;

class InventoryReservationService
{
    /**
     * Atomically reserve stock for requested items using SELECT ... FOR UPDATE.
     *
     * @param  array<int, int>  $variantQuantities  Mapping of product_variant_id => quantity
     * @param  string  $referenceId  Order number or reservation reference
     *
     * @throws Exception If stock is insufficient
     */
    public function reserveStock(array $variantQuantities, string $referenceId): void
    {
        DB::transaction(function () use ($variantQuantities, $referenceId) {
            foreach ($variantQuantities as $variantId => $requestedQty) {
                if ($requestedQty <= 0) {
                    continue;
                }

                // Row-level lock on inventory row
                $inventory = Inventory::where('product_variant_id', $variantId)
                    ->lockForUpdate()
                    ->first();

                if (! $inventory) {
                    throw new Exception("Inventory record missing for variant #{$variantId}");
                }

                $available = $inventory->quantity - $inventory->reserved_quantity;
                if ($available < $requestedQty) {
                    $variant = ProductVariant::find($variantId);
                    $name = $variant?->product?->name ?? "SKU: {$variant?->sku}";
                    throw new Exception("Insufficient stock for item '{$name}'. Available: {$available}, Requested: {$requestedQty}");
                }

                $inventory->reserved_quantity += $requestedQty;
                $inventory->save();

                StockMovement::create([
                    'inventory_id' => $inventory->id,
                    'type' => 'order_reservation',
                    'quantity_change' => -$requestedQty,
                    'balance_after' => $inventory->quantity - $inventory->reserved_quantity,
                    'reference_id' => $referenceId,
                    'notes' => "Reserved {$requestedQty} units for checkout {$referenceId}",
                ]);
            }
        });
    }

    /**
     * Permanently deduct reserved stock once payment is confirmed.
     *
     * @param  array<int, int>  $variantQuantities  Mapping of product_variant_id => quantity
     * @param  string  $referenceId  Order number
     */
    public function deductStock(array $variantQuantities, string $referenceId): void
    {
        DB::transaction(function () use ($variantQuantities, $referenceId) {
            foreach ($variantQuantities as $variantId => $qty) {
                if ($qty <= 0) {
                    continue;
                }

                $inventory = Inventory::where('product_variant_id', $variantId)
                    ->lockForUpdate()
                    ->first();

                if ($inventory) {
                    $inventory->quantity = max(0, $inventory->quantity - $qty);
                    $inventory->reserved_quantity = max(0, $inventory->reserved_quantity - $qty);
                    $inventory->save();

                    StockMovement::create([
                        'inventory_id' => $inventory->id,
                        'type' => 'order_deduction',
                        'quantity_change' => -$qty,
                        'balance_after' => $inventory->quantity,
                        'reference_id' => $referenceId,
                        'notes' => "Deducted {$qty} units on payment capture for {$referenceId}",
                    ]);
                }
            }
        });
    }

    /**
     * Release reserved stock back to available inventory on checkout abort or expiration.
     *
     * @param  array<int, int>  $variantQuantities
     */
    public function releaseStock(array $variantQuantities, string $referenceId): void
    {
        DB::transaction(function () use ($variantQuantities, $referenceId) {
            foreach ($variantQuantities as $variantId => $qty) {
                if ($qty <= 0) {
                    continue;
                }

                $inventory = Inventory::where('product_variant_id', $variantId)
                    ->lockForUpdate()
                    ->first();

                if ($inventory) {
                    $inventory->reserved_quantity = max(0, $inventory->reserved_quantity - $qty);
                    $inventory->save();

                    StockMovement::create([
                        'inventory_id' => $inventory->id,
                        'type' => 'order_release',
                        'quantity_change' => +$qty,
                        'balance_after' => $inventory->quantity - $inventory->reserved_quantity,
                        'reference_id' => $referenceId,
                        'notes' => "Released {$qty} reserved units for {$referenceId}",
                    ]);
                }
            }
        });
    }

    /**
     * Restock inventory manually or from supply batch.
     */
    public function restock(ProductVariant $variant, int $qty, string $notes = 'Restock'): void
    {
        DB::transaction(function () use ($variant, $qty, $notes) {
            $inventory = Inventory::firstOrCreate(
                ['product_variant_id' => $variant->id],
                ['quantity' => 0, 'reserved_quantity' => 0, 'low_stock_threshold' => 5]
            );

            $inventory->quantity += $qty;
            $inventory->save();

            StockMovement::create([
                'inventory_id' => $inventory->id,
                'type' => 'restock',
                'quantity_change' => $qty,
                'balance_after' => $inventory->quantity,
                'notes' => $notes,
            ]);
        });
    }
}
