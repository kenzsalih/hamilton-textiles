"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { getRepo, type OrderStatus } from "@/lib/data";

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending_payment: ["cancelled"],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "ready_for_pickup", "cancelled"],
  shipped: ["delivered"],
  ready_for_pickup: ["delivered"],
  cancelled: ["refunded"],
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  opts: { note?: string; restock?: boolean } = {},
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const repo = getRepo();
  const order = await repo.getOrder(orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (!NEXT[order.status]?.includes(status)) return { ok: false, error: "That change isn't allowed for this order" };
  if (status === "refunded" && !order.paid_at) return { ok: false, error: "This order was never paid" };

  await repo.setOrderStatus(orderId, status, opts.note?.trim().slice(0, 300) || null);

  // Put the fabric back on the shelf when a paid order is cancelled before it ships.
  if (status === "cancelled" && opts.restock && ["paid", "packed"].includes(order.status)) {
    for (const item of order.items) {
      if (item.material_id) await repo.adjustStock(item.material_id, item.metres, "cancellation", null, orderId);
    }
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveCustomerNotes(customerId: string, notes: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await getRepo().updateCustomerNotes(customerId, notes.trim().slice(0, 1000) || null);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
