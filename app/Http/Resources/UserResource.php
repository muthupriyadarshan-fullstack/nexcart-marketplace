<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status,
            'roles' => $this->getRoleNames(),
            'store' => $this->when($this->vendor && $this->vendor->primaryStore, function () {
                $store = $this->vendor->primaryStore;

                return [
                    'id' => $store->id,
                    'name' => $store->name,
                    'slug' => $store->slug,
                    'commission_rate' => $store->commission_rate,
                    'status' => $store->status,
                ];
            }),
            'vendor_status' => $this->vendor?->status,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
