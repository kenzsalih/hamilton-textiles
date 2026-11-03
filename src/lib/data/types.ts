import type { Category, FabricPattern, Material } from "@/lib/catalog/types";

export type { Category, FabricPattern, Material };

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "ready_for_pickup",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses that count as a sale. */
export const SOLD_STATUSES: OrderStatus[] = ["paid", "packed", "shipped", "ready_for_pickup", "delivered"];

export type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  country: string;
  notes: string | null;
  created_at: string;
};

export type CustomerSummary = Customer & {
  order_count: number;
  total_spent_fils: number;
  last_order_at: string | null;
};

export type ShippingAddress = {
  area?: string;
  block?: string;
  road?: string;
  building?: string;
  flat?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postcode?: string;
  country?: string;
};

export type OrderItem = {
  id: string;
  material_id: string | null;
  name_en: string;
  name_ar: string;
  sku: string;
  price_fils: number;
  metres: number;
  line_total_fils: number;
};

export type OrderEvent = { status: OrderStatus; note: string | null; created_at: string };

export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  fulfilment: "delivery" | "pickup";
  shipping_address: ShippingAddress | null;
  subtotal_fils: number;
  discount_fils: number;
  shipping_fils: number;
  vat_fils: number;
  total_fils: number;
  promo_code_id: string | null;
  display_currency: string;
  locale: string;
  payment_provider: string | null;
  payment_method: string | null;
  payment_ref: string | null;
  customer_note: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderDetail = Order & {
  customer: Customer;
  items: OrderItem[];
  events: OrderEvent[];
};

export type NewOrder = Omit<
  Order,
  "id" | "order_number" | "status" | "payment_method" | "payment_ref" | "paid_at" | "created_at" | "updated_at"
>;
export type NewOrderItem = Omit<OrderItem, "id">;

export type PromoCode = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;
  min_order_fils: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type PromoInput = Omit<PromoCode, "id" | "used_count" | "created_at">;

export type StockReason = "order" | "restock" | "adjustment" | "cancellation";

export type StockMovement = {
  id: number;
  material_id: string;
  change_m: number;
  reason: StockReason;
  order_id: string | null;
  note: string | null;
  created_at: string;
};

export type MaterialInput = Omit<Material, "id" | "created_at" | "images" | "stock_m"> & {
  images: string[];
};

export interface Repo {
  readonly mode: "supabase" | "dev";

  listCategories(): Promise<Category[]>;
  listMaterials(opts?: { includeHidden?: boolean }): Promise<Material[]>;
  getMaterial(id: string): Promise<Material | null>;
  createMaterial(input: MaterialInput, initialStockM: number): Promise<Material>;
  updateMaterial(id: string, input: MaterialInput): Promise<Material>;
  deleteMaterial(id: string): Promise<void>;
  adjustStock(materialId: string, changeM: number, reason: StockReason, note?: string | null, orderId?: string | null): Promise<void>;
  listStockMovements(materialId: string, limit?: number): Promise<StockMovement[]>;
  uploadImage(bytes: ArrayBuffer, contentType: string): Promise<string>;

  upsertCustomer(input: { full_name: string; email: string | null; phone: string; country: string }): Promise<string>;
  listCustomers(): Promise<CustomerSummary[]>;
  getCustomer(id: string): Promise<Customer | null>;
  updateCustomerNotes(id: string, notes: string | null): Promise<void>;

  createOrder(order: NewOrder, items: NewOrderItem[]): Promise<{ id: string; order_number: string }>;
  setOrderPaymentRef(id: string, ref: string): Promise<void>;
  markOrderPaid(id: string, ref: string, method: string): Promise<void>;
  getOrder(id: string): Promise<OrderDetail | null>;
  getOrderByNumber(orderNumber: string): Promise<OrderDetail | null>;
  listOrders(opts?: { status?: OrderStatus[]; since?: string; customerId?: string; limit?: number }): Promise<OrderDetail[]>;
  setOrderStatus(id: string, status: OrderStatus, note?: string | null): Promise<void>;

  listPromos(): Promise<PromoCode[]>;
  getPromoByCode(code: string): Promise<PromoCode | null>;
  savePromo(input: PromoInput, id?: string): Promise<PromoCode>;
  deletePromo(id: string): Promise<void>;
}
