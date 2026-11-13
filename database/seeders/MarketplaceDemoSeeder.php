<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\Shipment;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MarketplaceDemoSeeder extends Seeder
{
    public function run(): void
    {
        // -------------------------------------------------------------
        // 1. Core Users and Roles
        // -------------------------------------------------------------
        $admin = User::firstOrCreate(['email' => 'admin@nexcart.in'], [
            'name' => 'Vikramaditya Rao (Super Admin)',
            'phone' => '+919811122334',
            'password' => Hash::make('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('Super Admin');

        $support = User::firstOrCreate(['email' => 'support@nexcart.in'], [
            'name' => 'Pooja Verma (Support Staff)',
            'phone' => '+919822233445',
            'password' => Hash::make('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $support->assignRole('Support Staff');

        // Customer 1
        $customer1 = User::firstOrCreate(['email' => 'customer@nexcart.in'], [
            'name' => 'Rajesh Sharma',
            'phone' => '+919876543210',
            'password' => Hash::make('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $customer1->assignRole('Customer');

        // Customer 2
        $customer2 = User::firstOrCreate(['email' => 'ananya@nexcart.in'], [
            'name' => 'Ananya Patel',
            'phone' => '+919845671234',
            'password' => Hash::make('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $customer2->assignRole('Customer');

        // Customer Addresses
        $addr1 = Address::create([
            'user_id' => $customer1->id,
            'name' => 'Rajesh Sharma',
            'phone' => '+919876543210',
            'address_line1' => 'Flat 402, Prestige Acropolis, 20th Main Rd',
            'address_line2' => 'Koramangala 5th Block',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'postal_code' => '560095',
            'country' => 'India',
            'type' => 'both',
            'is_default' => true,
        ]);

        Address::create([
            'user_id' => $customer2->id,
            'name' => 'Ananya Patel',
            'phone' => '+919845671234',
            'address_line1' => 'Bungalow 12, Perry Cross Road',
            'address_line2' => 'Near Jogger’s Park, Bandra West',
            'city' => 'Mumbai',
            'state' => 'Maharashtra',
            'postal_code' => '400050',
            'country' => 'India',
            'type' => 'both',
            'is_default' => true,
        ]);

        // -------------------------------------------------------------
        // 2. Vendor 1: Apex Electronics India (Bengaluru)
        // -------------------------------------------------------------
        $vendorUser1 = User::firstOrCreate(['email' => 'apex@nexcart.in'], [
            'name' => 'Karthik Narayanan (Apex Electronics)',
            'phone' => '+919888877771',
            'password' => Hash::make('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $vendorUser1->assignRole('Vendor');

        $vendor1 = Vendor::create([
            'user_id' => $vendorUser1->id,
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $admin->id,
        ]);

        VendorProfile::create([
            'vendor_id' => $vendor1->id,
            'company_name' => 'Apex Digital Solutions Pvt Ltd',
            'tax_id_gst' => '29AABCU9603R1Z7',
            'pan_number' => 'AABCU9603R',
            'bank_name' => 'HDFC Bank',
            'bank_account_number' => '50200012345678',
            'bank_ifsc_code' => 'HDFC0000053',
        ]);

        $store1 = Store::create([
            'vendor_id' => $vendor1->id,
            'name' => 'Apex Electronics India',
            'slug' => 'apex-electronics',
            'description' => 'Authorized retailer for premier tech, smartphones, laptops, and audiophile gear.',
            'logo_url' => 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300',
            'banner_url' => 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
            'commission_rate' => 8.00, // 8% platform fee
            'status' => 'active',
        ]);

        // -------------------------------------------------------------
        // 3. Vendor 2: Desi Weaves & Handlooms (Varanasi/Surat)
        // -------------------------------------------------------------
        $vendorUser2 = User::firstOrCreate(['email' => 'desiweaves@nexcart.in'], [
            'name' => 'Ritu Srivastava (Desi Weaves)',
            'phone' => '+919777766662',
            'password' => Hash::make('password'),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
        $vendorUser2->assignRole('Vendor');

        $vendor2 = Vendor::create([
            'user_id' => $vendorUser2->id,
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $admin->id,
        ]);

        VendorProfile::create([
            'vendor_id' => $vendor2->id,
            'company_name' => 'Desi Weaves Artisanal LLP',
            'tax_id_gst' => '07AAECR4521M1Z4',
            'pan_number' => 'AAECR4521M',
            'bank_name' => 'State Bank of India',
            'bank_account_number' => '309988776655',
            'bank_ifsc_code' => 'SBIN0001234',
        ]);

        $store2 = Store::create([
            'vendor_id' => $vendor2->id,
            'name' => 'Desi Weaves & Handlooms',
            'slug' => 'desi-weaves',
            'description' => 'Authentic hand-woven pure Banarasi silk, Chanderi kurtas, and artisanal Indian ethnic couture.',
            'logo_url' => 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300',
            'banner_url' => 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200',
            'commission_rate' => 12.00, // 12% platform fee
            'status' => 'active',
        ]);

        // -------------------------------------------------------------
        // 4. Categories Hierarchy
        // -------------------------------------------------------------
        $electronics = Category::create([
            'name' => 'Consumer Electronics',
            'slug' => 'consumer-electronics',
            'description' => 'Flagship smartphones, laptops, audio systems, and smart accessories.',
            'image_url' => 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $phones = Category::create([
            'parent_id' => $electronics->id,
            'name' => 'Smartphones & Tablets',
            'slug' => 'smartphones-tablets',
            'description' => 'Latest flagship and 5G mobile devices.',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $audio = Category::create([
            'parent_id' => $electronics->id,
            'name' => 'Audio & Headphones',
            'slug' => 'audio-headphones',
            'description' => 'Noise-cancelling headsets, earbuds, and studio speakers.',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $fashion = Category::create([
            'name' => 'Fashion & Ethnic Wear',
            'slug' => 'fashion-ethnic-wear',
            'description' => 'Traditional Indian ethnic couture, handloom sarees, and designer attire.',
            'image_url' => 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $sarees = Category::create([
            'parent_id' => $fashion->id,
            'name' => 'Pure Silk Sarees',
            'slug' => 'pure-silk-sarees',
            'description' => 'Authentic Banarasi, Kanjeevaram, and Tussar handloom creations.',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $kurtas = Category::create([
            'parent_id' => $fashion->id,
            'name' => 'Kurtas & Ethnic Sets',
            'slug' => 'kurtas-ethnic-sets',
            'description' => 'Lucknowi Chikankari, hand-block printed cotton and silk kurtas.',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // -------------------------------------------------------------
        // 5. Products, Variants, Inventory & Images
        // -------------------------------------------------------------

        // Product 1: Apple iPhone 15 Pro
        $iphone = Product::create([
            'store_id' => $store1->id,
            'category_id' => $phones->id,
            'name' => 'Apple iPhone 15 Pro (256 GB) - Natural Titanium',
            'slug' => 'apple-iphone-15-pro-256gb-natural-titanium',
            'brand' => 'Apple',
            'short_description' => 'Aerospace-grade titanium design, A17 Pro chip, 48MP main camera system with 3x optical zoom.',
            'description' => 'iPhone 15 Pro is forged in titanium and features the groundbreaking A17 Pro chip, a customizable Action button, and the most versatile Pro camera system yet with USB-C superfast data transfer speeds.',
            'base_price' => 134900.00,
            'sale_price' => 127900.00,
            'status' => 'approved',
        ]);

        ProductImage::create([
            'product_id' => $iphone->id,
            'image_url' => 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
            'is_primary' => true,
            'sort_order' => 0,
        ]);
        ProductImage::create([
            'product_id' => $iphone->id,
            'image_url' => 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
            'is_primary' => false,
            'sort_order' => 1,
        ]);

        $varIphone1 = ProductVariant::create([
            'product_id' => $iphone->id,
            'sku' => 'IPH15P-256-NAT',
            'title' => '256GB / Natural Titanium',
            'attributes' => ['storage' => '256GB', 'color' => 'Natural Titanium'],
            'price' => 127900.00,
            'compare_at_price' => 134900.00,
        ]);
        $invIphone1 = Inventory::create([
            'product_variant_id' => $varIphone1->id,
            'quantity' => 20,
            'reserved_quantity' => 0,
            'low_stock_threshold' => 3,
        ]);
        StockMovement::create([
            'inventory_id' => $invIphone1->id,
            'type' => 'purchase',
            'quantity_change' => 20,
            'balance_after' => 20,
            'notes' => 'Initial lot from Apple Authorized Distro',
        ]);

        $varIphone2 = ProductVariant::create([
            'product_id' => $iphone->id,
            'sku' => 'IPH15P-512-BLK',
            'title' => '512GB / Black Titanium',
            'attributes' => ['storage' => '512GB', 'color' => 'Black Titanium'],
            'price' => 147900.00,
            'compare_at_price' => 154900.00,
        ]);
        $invIphone2 = Inventory::create([
            'product_variant_id' => $varIphone2->id,
            'quantity' => 12,
            'reserved_quantity' => 0,
            'low_stock_threshold' => 3,
        ]);
        StockMovement::create([
            'inventory_id' => $invIphone2->id,
            'type' => 'purchase',
            'quantity_change' => 12,
            'balance_after' => 12,
            'notes' => 'Initial lot from Apple Authorized Distro',
        ]);

        // Product 2: Sony WH-1000XM5
        $sony = Product::create([
            'store_id' => $store1->id,
            'category_id' => $audio->id,
            'name' => 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
            'slug' => 'sony-wh-1000xm5-wireless-noise-cancelling-headphones',
            'brand' => 'Sony',
            'short_description' => 'Industry-leading noise cancellation with 8 microphones, Auto NC Optimizer, and 30-hour battery life.',
            'description' => 'The WH-1000XM5 headphones rewrite the rules for distraction-free listening. Two processors control eight microphones for unprecedented noise cancellation and exceptional call quality.',
            'base_price' => 34990.00,
            'sale_price' => 29990.00,
            'status' => 'approved',
        ]);

        ProductImage::create([
            'product_id' => $sony->id,
            'image_url' => 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        $varSony1 = ProductVariant::create([
            'product_id' => $sony->id,
            'sku' => 'SONY-XM5-BLK',
            'title' => 'Matte Black',
            'attributes' => ['color' => 'Matte Black'],
            'price' => 29990.00,
            'compare_at_price' => 34990.00,
        ]);
        $invSony1 = Inventory::create([
            'product_variant_id' => $varSony1->id,
            'quantity' => 35,
            'reserved_quantity' => 0,
            'low_stock_threshold' => 5,
        ]);
        StockMovement::create([
            'inventory_id' => $invSony1->id,
            'type' => 'purchase',
            'quantity_change' => 35,
            'balance_after' => 35,
            'notes' => 'Sony India warehouse receipt',
        ]);

        $varSony2 = ProductVariant::create([
            'product_id' => $sony->id,
            'sku' => 'SONY-XM5-SLV',
            'title' => 'Silver Platinum',
            'attributes' => ['color' => 'Silver Platinum'],
            'price' => 29990.00,
            'compare_at_price' => 34990.00,
        ]);
        $invSony2 = Inventory::create([
            'product_variant_id' => $varSony2->id,
            'quantity' => 4, // low stock test
            'reserved_quantity' => 0,
            'low_stock_threshold' => 5,
        ]);
        StockMovement::create([
            'inventory_id' => $invSony2->id,
            'type' => 'purchase',
            'quantity_change' => 4,
            'balance_after' => 4,
            'notes' => 'Limited stock allocation',
        ]);

        // Product 3: Pure Katan Silk Banarasi Saree (Store 2)
        $saree = Product::create([
            'store_id' => $store2->id,
            'category_id' => $sarees->id,
            'name' => 'Royal Heritage Pure Katan Silk Banarasi Saree - Crimson Red',
            'slug' => 'royal-heritage-pure-katan-silk-banarasi-saree-crimson-red',
            'brand' => 'Desi Weaves',
            'short_description' => 'Masterfully handwoven in Varanasi using pure silver-gilt zari with floral kadwa motifs.',
            'description' => 'An heirloom bridal masterpiece hand-woven over 45 days by master weavers in Varanasi. Certified pure mulberry silk with traditional floral kadwa jaal and contrast gold border.',
            'base_price' => 24500.00,
            'sale_price' => 21999.00,
            'status' => 'approved',
        ]);

        ProductImage::create([
            'product_id' => $saree->id,
            'image_url' => 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        $varSaree = ProductVariant::create([
            'product_id' => $saree->id,
            'sku' => 'BS-KATAN-RED',
            'title' => 'Crimson Red / 6.5m with Blouse Piece',
            'attributes' => ['color' => 'Crimson Red', 'fabric' => 'Pure Katan Silk'],
            'price' => 21999.00,
            'compare_at_price' => 24500.00,
        ]);
        $invSaree = Inventory::create([
            'product_variant_id' => $varSaree->id,
            'quantity' => 15,
            'reserved_quantity' => 0,
            'low_stock_threshold' => 2,
        ]);
        StockMovement::create([
            'inventory_id' => $invSaree->id,
            'type' => 'purchase',
            'quantity_change' => 15,
            'balance_after' => 15,
            'notes' => 'Handloom weavers consignment',
        ]);

        // Product 4: Lucknowi Chikankari Kurta Set (Store 2)
        $kurta = Product::create([
            'store_id' => $store2->id,
            'category_id' => $kurtas->id,
            'name' => 'Handcrafted Lucknowi Chikankari Chanderi Silk Kurta Set',
            'slug' => 'handcrafted-lucknowi-chikankari-chanderi-silk-kurta-set',
            'brand' => 'Desi Weaves',
            'short_description' => 'Intricate shadow work and tepchi embroidery on pastel pistachio Chanderi silk.',
            'description' => 'Elegance personified with authentic GI-tagged Lucknowi hand embroidery. Comes paired with tailored modal trousers and organza dupatta.',
            'base_price' => 7499.00,
            'sale_price' => 5999.00,
            'status' => 'approved',
        ]);

        ProductImage::create([
            'product_id' => $kurta->id,
            'image_url' => 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800',
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        $varKurtaM = ProductVariant::create([
            'product_id' => $kurta->id,
            'sku' => 'LUCK-CHIK-M',
            'title' => 'Size M (38)',
            'attributes' => ['size' => 'M', 'color' => 'Pistachio Green'],
            'price' => 5999.00,
            'compare_at_price' => 7499.00,
        ]);
        Inventory::create([
            'product_variant_id' => $varKurtaM->id,
            'quantity' => 25,
            'reserved_quantity' => 0,
            'low_stock_threshold' => 5,
        ]);

        $varKurtaL = ProductVariant::create([
            'product_id' => $kurta->id,
            'sku' => 'LUCK-CHIK-L',
            'title' => 'Size L (40)',
            'attributes' => ['size' => 'L', 'color' => 'Pistachio Green'],
            'price' => 5999.00,
            'compare_at_price' => 7499.00,
        ]);
        Inventory::create([
            'product_variant_id' => $varKurtaL->id,
            'quantity' => 30,
            'reserved_quantity' => 0,
            'low_stock_threshold' => 5,
        ]);

        // -------------------------------------------------------------
        // 6. Coupons
        // -------------------------------------------------------------
        Coupon::create([
            'code' => 'WELCOME10',
            'discount_type' => 'percentage',
            'discount_value' => 10.00,
            'min_order_amount' => 1500.00,
            'max_discount_amount' => 1000.00,
            'usage_limit_total' => 500,
            'usage_limit_per_user' => 1,
            'used_count' => 1,
            'starts_at' => now()->subDays(10),
            'expires_at' => now()->addDays(60),
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'FESTIVE500',
            'discount_type' => 'fixed',
            'discount_value' => 500.00,
            'min_order_amount' => 3000.00,
            'usage_limit_total' => 250,
            'usage_limit_per_user' => 1,
            'used_count' => 0,
            'starts_at' => now()->subDays(5),
            'expires_at' => now()->addDays(45),
            'is_active' => true,
        ]);

        // -------------------------------------------------------------
        // 7. Seed Active Shopping Cart for Rajesh Sharma
        // -------------------------------------------------------------
        $cart = Cart::create([
            'user_id' => $customer1->id,
            'session_id' => 'sess_' . Str::random(24),
        ]);

        CartItem::create([
            'cart_id' => $cart->id,
            'product_variant_id' => $varSony1->id, // Sony Headphones
            'quantity' => 1,
        ]);
        CartItem::create([
            'cart_id' => $cart->id,
            'product_variant_id' => $varKurtaM->id, // Lucknowi Kurta
            'quantity' => 1,
        ]);

        // -------------------------------------------------------------
        // 8. Completed Multi-Vendor Sample Order (Contains Items from BOTH Stores!)
        // -------------------------------------------------------------
        $orderNumber = 'NEX-202611-8891';
        $subtotal = 127900.00 + 21999.00; // iPhone (Store 1) + Saree (Store 2) = ₹1,49,899
        $discount = 1000.00; // Max discount capped at ₹1,000 via WELCOME10
        $tax = round(($subtotal - $discount) * 0.18, 2); // 18% GST = ₹26,801.82
        $shipping = 0.00; // Free shipping
        $grandTotal = $subtotal - $discount + $tax + $shipping; // ₹1,75,700.82

        $order = Order::create([
            'order_number' => $orderNumber,
            'user_id' => $customer1->id,
            'shipping_address' => $addr1->toArray(),
            'billing_address' => $addr1->toArray(),
            'subtotal' => $subtotal,
            'discount_amount' => $discount,
            'tax_amount' => $tax,
            'shipping_fee' => $shipping,
            'grand_total' => $grandTotal,
            'currency' => 'INR',
            'status' => 'delivered',
            'payment_status' => 'captured',
            'placed_at' => now()->subDays(4),
        ]);

        // Order Item 1: Store 1 (iPhone)
        $item1Total = 127900.00;
        $comm1Rate = 8.00;
        $comm1Fee = round(($item1Total * $comm1Rate) / 100, 2); // ₹10,232.00
        $item1 = OrderItem::create([
            'order_id' => $order->id,
            'store_id' => $store1->id,
            'product_variant_id' => $varIphone1->id,
            'product_name' => $iphone->name,
            'variant_sku' => $varIphone1->sku,
            'unit_price' => $varIphone1->price,
            'quantity' => 1,
            'total_price' => $item1Total,
            'commission_rate' => $comm1Rate,
            'commission_amount' => $comm1Fee,
            'vendor_earnings' => $item1Total - $comm1Fee, // ₹1,17,668.00
            'status' => 'delivered',
        ]);

        // Order Item 2: Store 2 (Banarasi Saree)
        $item2Total = 21999.00;
        $comm2Rate = 12.00;
        $comm2Fee = round(($item2Total * $comm2Rate) / 100, 2); // ₹2,639.88
        $item2 = OrderItem::create([
            'order_id' => $order->id,
            'store_id' => $store2->id,
            'product_variant_id' => $varSaree->id,
            'product_name' => $saree->name,
            'variant_sku' => $varSaree->sku,
            'unit_price' => $varSaree->price,
            'quantity' => 1,
            'total_price' => $item2Total,
            'commission_rate' => $comm2Rate,
            'commission_amount' => $comm2Fee,
            'vendor_earnings' => $item2Total - $comm2Fee, // ₹19,359.12
            'status' => 'delivered',
        ]);

        // Shipments: Dispatched independently by each store!
        Shipment::create([
            'order_id' => $order->id,
            'store_id' => $store1->id,
            'tracking_number' => 'BLUEDART-88291024',
            'carrier' => 'Blue Dart Express',
            'status' => 'delivered',
            'shipped_at' => now()->subDays(3),
            'delivered_at' => now()->subDay(),
            'notes' => 'Delivered to recipient with OTP signature',
        ]);

        Shipment::create([
            'order_id' => $order->id,
            'store_id' => $store2->id,
            'tracking_number' => 'DELHIVERY-99481023',
            'carrier' => 'Delhivery Surface',
            'status' => 'delivered',
            'shipped_at' => now()->subDays(3),
            'delivered_at' => now()->subDay(),
            'notes' => 'Tamper-evident silk box delivered securely',
        ]);

        // Payment record
        Payment::create([
            'order_id' => $order->id,
            'gateway' => 'razorpay',
            'gateway_order_id' => 'order_RPZdemo88910',
            'gateway_payment_id' => 'pay_RPZdemo88910pay',
            'gateway_signature' => 'demo_signature_valid',
            'amount' => $grandTotal,
            'currency' => 'INR',
            'status' => 'captured',
            'idempotency_key' => (string) Str::uuid(),
        ]);

        // Reviews
        Review::create([
            'product_id' => $iphone->id,
            'user_id' => $customer1->id,
            'order_item_id' => $item1->id,
            'rating' => 5,
            'title' => 'Absolute powerhouse and pristine delivery!',
            'comment' => 'Received within 24 hours in Bengaluru. Natural Titanium finish looks gorgeous and the cameras are phenomenal.',
            'is_approved' => true,
        ]);

        Review::create([
            'product_id' => $saree->id,
            'user_id' => $customer1->id,
            'order_item_id' => $item2->id,
            'rating' => 5,
            'title' => 'Authentic Banarasi weave, pure elegance',
            'comment' => 'The zari work and silk weight are authentic Varanasi craftsmanship. Received Silk Mark tag as well.',
            'is_approved' => true,
        ]);
    }
}

