import { getRepo } from "@/lib/data";
import { sendOrderEmails } from "@/lib/email";
import { retrieveCharge } from "./tap";

export type ConfirmResult =
  | { status: "paid"; orderNumber: string }
  | { status: "pending"; orderNumber: string }
  | { status: "failed"; orderNumber: string | null; reason: string };

/**
 * Confirms a Tap charge by fetching it straight from Tap (never trusting the
 * redirect query or webhook body), checks it matches the order, then marks the
 * order paid. Safe to call from both the redirect page and the webhook.
 */
export async function confirmCharge(chargeId: string): Promise<ConfirmResult> {
  const repo = getRepo();
  const charge = await retrieveCharge(chargeId);
  const orderId = charge.metadata?.order_id ?? charge.reference?.transaction;
  if (!orderId) return { status: "failed", orderNumber: null, reason: "unknown-order" };

  const order = await repo.getOrder(orderId);
  if (!order) return { status: "failed", orderNumber: null, reason: "unknown-order" };

  if (order.status !== "pending_payment") {
    return order.status === "cancelled"
      ? { status: "failed", orderNumber: order.order_number, reason: "cancelled" }
      : { status: "paid", orderNumber: order.order_number };
  }

  if (charge.status === "INITIATED" || charge.status === "IN_PROGRESS") {
    return { status: "pending", orderNumber: order.order_number };
  }
  if (charge.status !== "CAPTURED") {
    return { status: "failed", orderNumber: order.order_number, reason: charge.status.toLowerCase() };
  }

  const paidFils = Math.round(charge.amount * 1000);
  if (charge.currency !== "BHD" || paidFils !== order.total_fils) {
    console.error(`Amount mismatch for ${order.order_number}: charged ${charge.amount} ${charge.currency}, expected ${order.total_fils} fils`);
    return { status: "failed", orderNumber: order.order_number, reason: "amount-mismatch" };
  }

  const method = charge.source?.payment_method?.toUpperCase() === "BENEFIT" ? "benefitpay" : "card";
  if (await repo.markOrderPaid(order.id, charge.id, method)) await sendOrderEmails(order.id);
  return { status: "paid", orderNumber: order.order_number };
}
