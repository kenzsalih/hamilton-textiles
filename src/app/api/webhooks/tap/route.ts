import { NextResponse } from "next/server";
import { confirmCharge } from "@/lib/payments/confirm";

// Tap posts the charge here when its status changes. The body is only used to
// learn the charge id — confirmCharge re-fetches the charge from Tap's API, so
// a forged request cannot mark an order paid.
export async function POST(request: Request) {
  let chargeId: unknown;
  try {
    chargeId = ((await request.json()) as { id?: unknown }).id;
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (typeof chargeId !== "string" || !chargeId.startsWith("chg_")) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  try {
    const result = await confirmCharge(chargeId);
    return NextResponse.json({ received: true, status: result.status });
  } catch (err) {
    console.error("Tap webhook failed", err);
    // Non-2xx makes Tap retry later.
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
