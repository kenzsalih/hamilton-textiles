import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Customer,
  CustomerSummary,
  Material,
  MaterialInput,
  OrderDetail,
  PromoCode,
  Repo,
  StockMovement,
} from "./types";
import { SOLD_STATUSES } from "./types";

const MATERIAL_SELECT = "*, images:material_images(url, alt_en, alt_ar, sort_order)";
const ORDER_SELECT = "*, customer:customers(*), items:order_items(*), events:order_events(status, note, created_at)";

/** Throws on a query error. Callers of maybeSingle() still null-check the result. */
function check<T>(res: { data: T; error: unknown }): NonNullable<T> {
  if (res.error) throw res.error;
  return res.data as NonNullable<T>;
}

function toMaterial(row: Record<string, unknown>): Material {
  const images = ((row.images as { url: string; alt_en: string | null; alt_ar: string | null; sort_order: number }[]) ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ url, alt_en, alt_ar }) => ({ url, alt_en, alt_ar }));
  return {
    ...(row as unknown as Material),
    images,
    stock_m: Number(row.stock_m),
    low_stock_m: Number(row.low_stock_m),
    min_order_m: Number(row.min_order_m),
    step_m: Number(row.step_m),
  };
}

function toOrder(row: Record<string, unknown>): OrderDetail {
  const order = row as unknown as OrderDetail;
  return {
    ...order,
    items: (order.items ?? []).map((i) => ({ ...i, metres: Number(i.metres) })),
    events: [...(order.events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

export function createSupabaseRepo(db: SupabaseClient): Repo {
  const writeImages = async (materialId: string, urls: string[]) => {
    check(await db.from("material_images").delete().eq("material_id", materialId));
    if (urls.length) {
      check(await db.from("material_images").insert(urls.map((url, i) => ({ material_id: materialId, url, sort_order: i }))));
    }
  };

  const repo: Repo = {
    mode: "supabase",

    async listCategories() {
      return check(await db.from("categories").select("*").eq("is_active", true).order("sort_order"));
    },

    async listMaterials(opts) {
      let q = db.from("materials").select(MATERIAL_SELECT).order("created_at", { ascending: false });
      if (!opts?.includeHidden) q = q.eq("is_active", true);
      return (check(await q) as Record<string, unknown>[]).map(toMaterial);
    },

    async getMaterial(id) {
      const row = check(await db.from("materials").select(MATERIAL_SELECT).eq("id", id).maybeSingle());
      return row ? toMaterial(row) : null;
    },

    async createMaterial(input: MaterialInput, initialStockM) {
      const { images, ...fields } = input;
      const row = check(await db.from("materials").insert({ ...fields, stock_m: 0 }).select("id").single());
      await writeImages(row.id, images);
      if (initialStockM > 0) await repo.adjustStock(row.id, initialStockM, "restock", "Opening stock");
      return (await repo.getMaterial(row.id))!;
    },

    async updateMaterial(id, input) {
      const { images, ...fields } = input;
      check(await db.from("materials").update(fields).eq("id", id));
      await writeImages(id, images);
      return (await repo.getMaterial(id))!;
    },

    async deleteMaterial(id) {
      check(await db.from("materials").delete().eq("id", id));
    },

    async adjustStock(materialId, changeM, reason, note, orderId) {
      check(
        await db.rpc("adjust_stock", {
          p_material_id: materialId,
          p_change: changeM,
          p_reason: reason,
          p_note: note ?? null,
          p_order_id: orderId ?? null,
        }),
      );
    },

    async listStockMovements(materialId, limit = 20) {
      const rows = check(
        await db.from("stock_movements").select("*").eq("material_id", materialId).order("created_at", { ascending: false }).limit(limit),
      ) as StockMovement[];
      return rows.map((r) => ({ ...r, change_m: Number(r.change_m) }));
    },

    async uploadImage(bytes, contentType) {
      const ext = contentType === "image/webp" ? "webp" : contentType === "image/png" ? "png" : "jpg";
      const path = `${new Date().getFullYear()}/${randomUUID()}.${ext}`;
      check(await db.storage.from("materials").upload(path, bytes, { contentType, cacheControl: "31536000" }));
      return db.storage.from("materials").getPublicUrl(path).data.publicUrl;
    },

    async upsertCustomer(input) {
      const row = check(await db.from("customers").upsert(input, { onConflict: "phone" }).select("id").single());
      return row.id as string;
    },

    async listCustomers() {
      const customers = check(await db.from("customers").select("*")) as Customer[];
      const orders = check(await db.from("orders").select("customer_id, total_fils, status, created_at")) as {
        customer_id: string;
        total_fils: number;
        status: OrderDetail["status"];
        created_at: string;
      }[];
      return customers.map((c): CustomerSummary => {
        const mine = orders.filter((o) => o.customer_id === c.id);
        const sold = mine.filter((o) => SOLD_STATUSES.includes(o.status));
        return {
          ...c,
          order_count: sold.length,
          total_spent_fils: sold.reduce((s, o) => s + o.total_fils, 0),
          last_order_at: mine.map((o) => o.created_at).sort().at(-1) ?? null,
        };
      });
    },

    async getCustomer(id) {
      return check(await db.from("customers").select("*").eq("id", id).maybeSingle()) as Customer | null;
    },

    async updateCustomerNotes(id, notes) {
      check(await db.from("customers").update({ notes }).eq("id", id));
    },

    async createOrder(order, items) {
      const row = check(await db.from("orders").insert(order).select("id, order_number").single());
      check(await db.from("order_items").insert(items.map((i) => ({ ...i, order_id: row.id }))));
      return row as { id: string; order_number: string };
    },

    async setOrderPaymentRef(id, ref) {
      check(await db.from("orders").update({ payment_ref: ref }).eq("id", id));
    },

    async markOrderPaid(id, ref, method) {
      return Boolean(check(await db.rpc("mark_order_paid", { p_order_id: id, p_payment_ref: ref, p_method: method })));
    },

    async getOrder(id) {
      const row = check(await db.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle());
      return row ? toOrder(row) : null;
    },

    async getOrderByNumber(orderNumber) {
      const row = check(await db.from("orders").select(ORDER_SELECT).eq("order_number", orderNumber).maybeSingle());
      return row ? toOrder(row) : null;
    },

    async listOrders(opts) {
      let q = db.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(opts?.limit ?? 500);
      if (opts?.status) q = q.in("status", opts.status);
      if (opts?.since) q = q.gte("created_at", opts.since);
      if (opts?.customerId) q = q.eq("customer_id", opts.customerId);
      return (check(await q) as Record<string, unknown>[]).map(toOrder);
    },

    async setOrderStatus(id, status, note) {
      check(await db.rpc("set_order_status", { p_order_id: id, p_status: status, p_note: note ?? null }));
    },

    async listPromos() {
      return check(await db.from("promo_codes").select("*").order("created_at", { ascending: false })) as PromoCode[];
    },

    async getPromoByCode(code) {
      return check(await db.from("promo_codes").select("*").eq("code", code).maybeSingle()) as PromoCode | null;
    },

    async savePromo(input, id) {
      const q = id ? db.from("promo_codes").update(input).eq("id", id) : db.from("promo_codes").insert(input);
      return check(await q.select("*").single()) as PromoCode;
    },

    async deletePromo(id) {
      check(await db.from("promo_codes").delete().eq("id", id));
    },
  };
  return repo;
}
