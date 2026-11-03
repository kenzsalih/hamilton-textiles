// Tap Payments (tap.company) — hosted payment page for BenefitPay and cards.
// Docs: https://developers.tap.company/reference/create-a-charge

const TAP_API = "https://api.tap.company/v2";

export type TapCharge = {
  id: string;
  status: string; // INITIATED | CAPTURED | DECLINED | CANCELLED | FAILED | ABANDONED | …
  amount: number;
  currency: string;
  reference?: { transaction?: string; order?: string };
  metadata?: Record<string, string>;
  source?: { payment_method?: string; payment_type?: string };
  transaction?: { url?: string };
};

export function isTapConfigured(): boolean {
  return Boolean(process.env.TAP_SECRET_KEY);
}

async function tap<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TAP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
      "Content-Type": "application/json",
      accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tap ${path} failed (${res.status}): ${body.slice(0, 500)}`);
  }
  return res.json() as Promise<T>;
}

export async function createCharge(args: {
  orderId: string;
  orderNumber: string;
  amountFils: number;
  customer: { name: string; email: string; dialCode: string; phone: string };
  redirectUrl: string;
  webhookUrl: string;
  description: string;
}): Promise<TapCharge> {
  const [first, ...rest] = args.customer.name.split(/\s+/);
  return tap<TapCharge>("/charges", {
    method: "POST",
    body: JSON.stringify({
      amount: Number((args.amountFils / 1000).toFixed(3)),
      currency: "BHD",
      threeDSecure: true,
      save_card: false,
      description: args.description,
      statement_descriptor: "Hamilton Textiles",
      reference: { transaction: args.orderId, order: args.orderNumber },
      metadata: { order_id: args.orderId },
      receipt: { email: true, sms: false },
      customer: {
        first_name: first,
        last_name: rest.join(" ") || "-",
        email: args.customer.email,
        phone: { country_code: args.customer.dialCode, number: args.customer.phone },
      },
      // src_all shows every method enabled on the Tap account (BenefitPay, cards, Apple Pay).
      source: { id: "src_all" },
      post: { url: args.webhookUrl },
      redirect: { url: args.redirectUrl },
    }),
  });
}

export async function retrieveCharge(chargeId: string): Promise<TapCharge> {
  if (!/^chg_[A-Za-z0-9]+$/.test(chargeId)) throw new Error("Invalid charge id");
  return tap<TapCharge>(`/charges/${chargeId}`);
}
