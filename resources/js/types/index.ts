export type Role = 'Super Admin' | 'Vendor' | 'Customer' | 'Support Staff';

export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    status: 'active' | 'suspended' | 'pending';
    roles: Role[];
    store?: {
        id: number;
        name: string;
        slug: string;
        commission_rate: number;
        status: string;
    };
    vendor_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    parent_id?: number | null;
    children?: Category[];
    products_count?: number;
}

export interface ProductVariant {
    id: number;
    sku: string;
    title: string;
    attributes: Record<string, string>;
    price: number;
    compare_at_price?: number | null;
    in_stock: boolean;
    available_quantity: number;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    brand?: string;
    short_description?: string;
    description?: string;
    base_price: number;
    sale_price?: number | null;
    status: string;
    image?: string;
    images?: Array<{ id: number; url: string; is_primary: boolean }>;
    category: {
        id: number;
        name: string;
        slug: string;
    };
    store: {
        id: number;
        name: string;
        slug: string;
        logo_url?: string;
        description?: string;
    };
    variants?: ProductVariant[];
    rating_avg: number;
    rating_count: number;
    reviews?: Array<{
        id: number;
        user_name: string;
        rating: number;
        title?: string;
        comment: string;
        created_at: string;
    }>;
}

export interface CartItem {
    id: number;
    product_id: number;
    product_name: string;
    product_slug: string;
    variant_id: number;
    variant_title: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
    image?: string;
    store: {
        id: number;
        name: string;
    };
    in_stock: boolean;
    available_stock: number;
}

export interface Cart {
    id: number;
    items: CartItem[];
    items_count: number;
    subtotal: number;
    discount_amount: number;
    coupon?: {
        code: string;
        discount_type: string;
        discount_value: number;
    } | null;
    estimated_tax: number;
    shipping_fee: number;
    grand_total: number;
}

export interface Address {
    id: number;
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    type: 'shipping' | 'billing' | 'both';
    is_default: boolean;
}

export interface OrderItem {
    id: number;
    store_id: number;
    store_name: string;
    product_name: string;
    variant_sku: string;
    unit_price: number;
    quantity: number;
    total_price: number;
    status: string;
    is_reviewed: boolean;
    has_return_request: boolean;
}

export interface Shipment {
    id: number;
    store_id: number;
    store_name: string;
    tracking_number?: string;
    carrier?: string;
    status: string;
    shipped_at?: string;
    delivered_at?: string;
}

export interface Order {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_fee: number;
    grand_total: number;
    currency: string;
    shipping_address: Record<string, any>;
    billing_address: Record<string, any>;
    placed_at: string;
    items: OrderItem[];
    vendor_splits: Array<{
        store_id: number;
        store_name: string;
        subtotal: number;
        commission: number;
        net_vendor_earnings: number;
        items_count: number;
    }>;
    shipments: Shipment[];
    payment?: {
        gateway: string;
        gateway_order_id: string;
        gateway_payment_id?: string;
        status: string;
        amount: number;
    } | null;
    created_at: string;
}

