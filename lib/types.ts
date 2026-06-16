export type Role = "vendor" | "admin";
export type OrderStatus = "placed" | "accepted" | "ready" | "completed" | "declined" | "cancelled";
export type PayMethod = "offline" | "online";
export type PayStatus = "unpaid" | "paid" | "refunded";
export type Fulfilment = "pickup" | "delivery";

export interface Vendor {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  bio: string | null;
  area: string | null;
  hours: string | null;
  logo_url: string | null;
  accept_offline: boolean;
  accept_cash: boolean;
  accept_interac: boolean;
  offline_instructions: string | null;
  accept_online: boolean;
  stripe_account_id: string | null;
  status: string;
  accepting_orders: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  available_days: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Dish {
  id: string;
  vendor_id: string;
  service_id: string | null;
  name: string;
  description: string | null;
  price_cad: number;
  photo_url: string | null;
  veg: boolean;
  is_sold_out: boolean;
  is_active: boolean;
  available_days: string[];
  cutoff_time: string | null;
  options: unknown | null;
  created_at: string;
}

export interface Order {
  id: string;
  vendor_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  fulfilment: Fulfilment;
  requested_time: string | null;
  customer_note: string | null;
  payment_method: PayMethod;
  payment_label: string | null;
  payment_status: PayStatus;
  status: OrderStatus;
  subtotal_cad: number;
  stripe_payment_intent: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  dish_id: string | null;
  name_snapshot: string;
  service_snapshot: string | null;
  price_snapshot: number;
  qty: number;
  options_snapshot: unknown | null;
}

export interface CartLine {
  dishId: string;
  name: string;
  price: number;
  qty: number;
}
