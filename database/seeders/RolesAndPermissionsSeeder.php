<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Platform Permissions
        $permissions = [
            'manage-platform',
            'manage-vendors',
            'manage-categories',
            'moderate-products',
            'manage-coupons',
            'manage-refunds',
            'manage-payouts',
            'view-audit-logs',
            // Vendor Permissions
            'manage-store',
            'manage-products',
            'manage-inventory',
            'manage-shipments',
            'view-vendor-analytics',
            // Customer Permissions
            'browse-products',
            'manage-cart',
            'place-order',
            'review-product',
            // Support Permissions
            'support-view-orders',
            'support-manage-returns',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Roles
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        $vendor = Role::firstOrCreate(['name' => 'Vendor', 'guard_name' => 'web']);
        $vendor->syncPermissions([
            'manage-store',
            'manage-products',
            'manage-inventory',
            'manage-shipments',
            'view-vendor-analytics',
        ]);

        $customer = Role::firstOrCreate(['name' => 'Customer', 'guard_name' => 'web']);
        $customer->syncPermissions([
            'browse-products',
            'manage-cart',
            'place-order',
            'review-product',
        ]);

        $support = Role::firstOrCreate(['name' => 'Support Staff', 'guard_name' => 'web']);
        $support->syncPermissions([
            'support-view-orders',
            'support-manage-returns',
            'browse-products',
        ]);
    }
}

