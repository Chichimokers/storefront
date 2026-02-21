export interface ProductImage {
  id: number;
  image: string;
  is_primary: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image: string | null;
  parent: number | null;
  subcategories: Category[];
  products_count: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  compare_price: string | null;
  stock: number;
  category: Category;
  subcategory: Category | null;
  images: ProductImage[];
  main_image: ProductImage | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Tokens {
  refresh: string;
  access: string;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  maxStock: number;
}

export interface OrderProduct {
  id: number;
  name: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  id: number;
  products: OrderProduct[];
  total_amount: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes: string;
  created_at: string;
}

export interface OrdersResponse {
  count: number;
  results: Order[];
}

export interface CheckoutRequest {
  products: { id: number; quantity: number }[];
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  notes?: string;
}

export interface CheckoutResponse {
  order_id: number;
  phone: string;
  message: string;
  whatsapp_url: string;
  order_total: string;
}

export interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
}
