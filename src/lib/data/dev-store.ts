// Development data store used when Supabase isn't configured. Mirrors the
// database tables in memory and saves them to .data/dev-store.json so the
// admin app and storefront can be exercised end to end before launch.

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { seedCategories, seedMaterials } from "@/lib/catalog/seed";
import { lineTotal } from "@/lib/metres";
import type {
  Category,
  Customer,
  CustomerSummary,
  Material,
  MaterialInput,
  NewOrder,
  NewOrderItem,
  Order,
  OrderDetail,
  OrderEvent,
  OrderItem,
  OrderStatus,
  PromoCode,
  PromoInput,
  Repo,
  StockMovement,
  StockReason,
} from "./types";
import { SOLD_STATUSES } from "./types";

type Tables = {
  categories: Category[];
  materials: Material[];
  customers: Customer[];
  orders: Order[];
  order_items: (OrderItem & { order_id: string })[];
  order_events: (OrderEvent & { order_id: string })[];
  promo_codes: PromoCode[];
  stock_movements: StockMovement[];
  next_order_number: number;
  next_movement_id: number;
};

const FILE = path.join(process.cwd(), ".data", "dev-store.json");
const g = globalThis as unknown as { __htDevStore?: Tables };

function load(): Tables {
  if (g.__htDevStore) return g.__htDevStore;
  try {
    if (existsSync(FILE)) {
      g.__htDevStore = JSON.parse(readFileSync(FILE, "utf8")) as Tables;
      return g.__htDevStore;
    }
  } catch (err) {
    console.warn("Dev store unreadable, starting fresh", err);
  }
  g.__htDevStore = initialTables();
  persist();
  return g.__htDevStore;
}

function persist() {
  try {
    mkdirSync(path.dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(g.__htDevStore));
  } catch (err) {
    console.warn("Could not save dev store", err);
  }
}

const now = () => new Date().toISOString();
const clone = <T,>(v: T): T => structuredClone(v);

// ─── Sample history so the dashboard has something to show ───────────────
function initialTables(): Tables {
  const t: Tables = {
    categories: clone(seedCategories),
    materials: clone(seedMaterials),
    customers: [],
    orders: [],
    order_items: [],
    order_events: [],
    promo_codes: [
      { id: randomUUID(), code: "WELCOME10", kind: "percent", value: 10, min_order_fils: 0, max_uses: null, used_count: 3, starts_at: null, expires_at: null, is_active: true, created_at: now() },
      { id: randomUUID(), code: "EID2026", kind: "fixed", value: 2000, min_order_fils: 15000, max_uses: 100, used_count: 12, starts_at: null, expires_at: "2026-12-31T20:59:59.000Z", is_active: true, created_at: now() },
    ],
    stock_movements: [],
    next_order_number: 1001,
    next_movement_id: 1,
  };

  // Deterministic pseudo-random so the sample is stable between resets.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const names = ["Fatima Al-Sayed", "Maryam Hasan", "Ahmed Khalil", "Noor Abdulla", "Zainab Ali", "Hessa Yousif", "Layla Mansoor", "Sara Ebrahim", "Khalid Jaffar", "Aisha Saleh", "Reem Faisal", "Huda Mahdi"];
  t.customers = names.map((name, i) => ({
    id: randomUUID(),
    full_name: name,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    phone: `+97336000${String(100 + i)}`,
    country: i === 10 ? "SA" : i === 11 ? "KW" : "BH",
    notes: null,
    created_at: new Date(Date.now() - 40 * 864e5).toISOString(),
  }));

  for (let n = 0; n < 46; n++) {
    const daysAgo = Math.floor(rand() * 30);
    const created = new Date(Date.now() - daysAgo * 864e5 - Math.floor(rand() * 10) * 36e5);
    const customer = pick(t.customers);
    const lines = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => pick(t.materials));
    const unique = [...new Map(lines.map((m) => [m.id, m])).values()];
    const items = unique.map((m) => {
      const metres = Math.max(m.min_order_m, Math.round((1 + rand() * 5) * 2) / 2);
      return { id: randomUUID(), material_id: m.id, name_en: m.name_en, name_ar: m.name_ar, sku: m.sku, price_fils: m.price_fils, metres, line_total_fils: lineTotal(m.price_fils, metres) };
    });
    const subtotal = items.reduce((s, i) => s + i.line_total_fils, 0);
    const fulfilment = rand() < 0.3 ? "pickup" : "delivery";
    const shipping = fulfilment === "pickup" || subtotal >= 15000 ? 0 : 1500;
    const status: OrderStatus =
      daysAgo > 4 ? (rand() < 0.06 ? "cancelled" : "delivered") : daysAgo > 1 ? pick(["shipped", "ready_for_pickup", "packed"] as OrderStatus[]) : "paid";
    const id = randomUUID();
    const order: Order = {
      id,
      order_number: `HT-${t.next_order_number++}`,
      customer_id: customer.id,
      status: fulfilment === "pickup" && status === "shipped" ? "ready_for_pickup" : fulfilment === "delivery" && status === "ready_for_pickup" ? "shipped" : status,
      fulfilment,
      shipping_address: fulfilment === "delivery" ? { area: "Riffa", block: "901", road: "12", building: String(100 + n), country: customer.country } : null,
      subtotal_fils: subtotal,
      discount_fils: 0,
      shipping_fils: shipping,
      vat_fils: 0,
      total_fils: subtotal + shipping,
      promo_code_id: null,
      display_currency: "BHD",
      locale: rand() < 0.4 ? "ar" : "en",
      payment_provider: "tap",
      payment_method: rand() < 0.6 ? "benefitpay" : "card",
      payment_ref: `chg_sample${n}`,
      customer_note: null,
      paid_at: created.toISOString(),
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
    };
    t.orders.push(order);
    for (const item of items) t.order_items.push({ ...item, order_id: id });
    t.order_events.push({ order_id: id, status: "paid", note: null, created_at: created.toISOString() });
    if (order.status !== "paid") t.order_events.push({ order_id: id, status: order.status, note: null, created_at: new Date(created.getTime() + 864e5).toISOString() });
  }
  return t;
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function detail(t: Tables, order: Order): OrderDetail {
  return {
    ...clone(order),
    customer: clone(t.customers.find((c) => c.id === order.customer_id)!),
    items: t.order_items.filter((i) => i.order_id === order.id).map(({ order_id: _, ...i }) => clone(i)),
    events: t.order_events
      .filter((e) => e.order_id === order.id)
      .map(({ order_id: _, ...e }) => clone(e))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

function writeMaterial(input: MaterialInput) {
  const { images, ...rest } = input;
  return { ...rest, images: images.map((url) => ({ url, alt_en: null, alt_ar: null })) };
}

export const devRepo: Repo = {
  mode: "dev",

  async listCategories() {
    return clone(load().categories).sort((a, b) => a.sort_order - b.sort_order);
  },

  async listMaterials(opts) {
    return clone(load().materials)
      .filter((m) => opts?.includeHidden || m.is_active)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getMaterial(id) {
    const m = load().materials.find((x) => x.id === id);
    return m ? clone(m) : null;
  },

  async createMaterial(input, initialStockM) {
    const t = load();
    if (t.materials.some((m) => m.slug === input.slug || m.sku === input.sku)) throw new Error("duplicate");
    const material: Material = { ...writeMaterial(input), id: randomUUID(), stock_m: 0, created_at: now() };
    t.materials.push(material);
    persist();
    if (initialStockM > 0) await devRepo.adjustStock(material.id, initialStockM, "restock", "Opening stock");
    return clone(t.materials.find((m) => m.id === material.id)!);
  },

  async updateMaterial(id, input) {
    const t = load();
    const idx = t.materials.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error("not found");
    if (t.materials.some((m) => m.id !== id && (m.slug === input.slug || m.sku === input.sku))) throw new Error("duplicate");
    t.materials[idx] = { ...t.materials[idx], ...writeMaterial(input) };
    persist();
    return clone(t.materials[idx]);
  },

  async deleteMaterial(id) {
    const t = load();
    t.materials = t.materials.filter((m) => m.id !== id);
    t.stock_movements = t.stock_movements.filter((s) => s.material_id !== id);
    for (const item of t.order_items) if (item.material_id === id) item.material_id = null;
    persist();
  },

  async adjustStock(materialId, changeM, reason: StockReason, note, orderId) {
    const t = load();
    const m = t.materials.find((x) => x.id === materialId);
    if (!m) throw new Error("not found");
    m.stock_m = Math.max(0, Math.round((m.stock_m + changeM) * 100) / 100);
    t.stock_movements.push({ id: t.next_movement_id++, material_id: materialId, change_m: changeM, reason, order_id: orderId ?? null, note: note ?? null, created_at: now() });
    persist();
  },

  async listStockMovements(materialId, limit = 20) {
    return clone(load().stock_movements.filter((s) => s.material_id === materialId))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  },

  async uploadImage(bytes, contentType) {
    // Kept inline in development; Supabase Storage holds real photos.
    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  },

  async upsertCustomer(input) {
    const t = load();
    const existing = t.customers.find((c) => c.phone === input.phone);
    if (existing) {
      Object.assign(existing, { full_name: input.full_name, email: input.email, country: input.country });
      persist();
      return existing.id;
    }
    const id = randomUUID();
    t.customers.push({ ...input, id, notes: null, created_at: now() });
    persist();
    return id;
  },

  async listCustomers() {
    const t = load();
    return t.customers.map((c): CustomerSummary => {
      const sold = t.orders.filter((o) => o.customer_id === c.id && SOLD_STATUSES.includes(o.status));
      const all = t.orders.filter((o) => o.customer_id === c.id);
      return {
        ...clone(c),
        order_count: sold.length,
        total_spent_fils: sold.reduce((s, o) => s + o.total_fils, 0),
        last_order_at: all.map((o) => o.created_at).sort().at(-1) ?? null,
      };
    });
  },

  async getCustomer(id) {
    const c = load().customers.find((x) => x.id === id);
    return c ? clone(c) : null;
  },

  async updateCustomerNotes(id, notes) {
    const c = load().customers.find((x) => x.id === id);
    if (c) c.notes = notes;
    persist();
  },

  async createOrder(order: NewOrder, items: NewOrderItem[]) {
    const t = load();
    const id = randomUUID();
    const order_number = `HT-${t.next_order_number++}`;
    t.orders.push({ ...order, id, order_number, status: "pending_payment", payment_method: null, payment_ref: null, paid_at: null, created_at: now(), updated_at: now() });
    for (const item of items) t.order_items.push({ ...item, id: randomUUID(), order_id: id });
    t.order_events.push({ order_id: id, status: "pending_payment", note: null, created_at: now() });
    persist();
    return { id, order_number };
  },

  async setOrderPaymentRef(id, ref) {
    const o = load().orders.find((x) => x.id === id);
    if (o) o.payment_ref = ref;
    persist();
  },

  async markOrderPaid(id, ref, method) {
    const t = load();
    const o = t.orders.find((x) => x.id === id);
    if (!o || o.status !== "pending_payment") return false;
    for (const item of t.order_items.filter((i) => i.order_id === id && i.material_id)) {
      await devRepo.adjustStock(item.material_id!, -item.metres, "order", null, id);
    }
    if (o.promo_code_id) {
      const p = t.promo_codes.find((x) => x.id === o.promo_code_id);
      if (p) p.used_count++;
    }
    Object.assign(o, { status: "paid", paid_at: now(), payment_ref: ref, payment_method: method, updated_at: now() });
    t.order_events.push({ order_id: id, status: "paid", note: null, created_at: now() });
    persist();
    return true;
  },

  async getOrder(id) {
    const t = load();
    const o = t.orders.find((x) => x.id === id);
    return o ? detail(t, o) : null;
  },

  async getOrderByNumber(orderNumber) {
    const t = load();
    const o = t.orders.find((x) => x.order_number === orderNumber);
    return o ? detail(t, o) : null;
  },

  async listOrders(opts) {
    const t = load();
    return t.orders
      .filter((o) => !opts?.status || opts.status.includes(o.status))
      .filter((o) => !opts?.since || o.created_at >= opts.since)
      .filter((o) => !opts?.customerId || o.customer_id === opts.customerId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, opts?.limit ?? 500)
      .map((o) => detail(t, o));
  },

  async setOrderStatus(id, status, note) {
    const t = load();
    const o = t.orders.find((x) => x.id === id);
    if (!o) throw new Error("not found");
    o.status = status;
    o.updated_at = now();
    t.order_events.push({ order_id: id, status, note: note ?? null, created_at: now() });
    persist();
  },

  async listPromos() {
    return clone(load().promo_codes).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getPromoByCode(code) {
    const p = load().promo_codes.find((x) => x.code === code);
    return p ? clone(p) : null;
  },

  async savePromo(input: PromoInput, id) {
    const t = load();
    if (t.promo_codes.some((p) => p.code === input.code && p.id !== id)) throw new Error("duplicate");
    if (id) {
      const p = t.promo_codes.find((x) => x.id === id);
      if (!p) throw new Error("not found");
      Object.assign(p, input);
      persist();
      return clone(p);
    }
    const promo: PromoCode = { ...input, id: randomUUID(), used_count: 0, created_at: now() };
    t.promo_codes.push(promo);
    persist();
    return clone(promo);
  },

  async deletePromo(id) {
    const t = load();
    t.promo_codes = t.promo_codes.filter((p) => p.id !== id);
    for (const o of t.orders) if (o.promo_code_id === id) o.promo_code_id = null;
    persist();
  },
};
