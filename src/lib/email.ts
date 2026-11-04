import { getRepo, type OrderDetail } from "@/lib/data";
import { bhd, metres } from "@/lib/admin/format";

// Order emails go through Resend's HTTP API (free tier: 3,000 emails a month).
// Without RESEND_API_KEY nothing is sent, so local development stays quiet.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function send(to: string, subject: string, html: string, replyTo?: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, reply_to: replyTo }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/** Sends the customer receipt and the owner's new-order alert. Never throws: a failed email must not fail a paid order. */
export async function sendOrderEmails(orderId: string): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    const order = await getRepo().getOrder(orderId);
    if (!order) return;
    const jobs: Promise<void>[] = [];
    if (order.customer.email) jobs.push(send(order.customer.email, customerSubject(order), customerHtml(order)));
    if (process.env.OWNER_EMAIL) {
      jobs.push(
        send(
          process.env.OWNER_EMAIL,
          `New order ${order.order_number} · ${bhd(order.total_fils)}`,
          ownerHtml(order),
          order.customer.email ?? undefined,
        ),
      );
    }
    const results = await Promise.allSettled(jobs);
    for (const r of results) if (r.status === "rejected") console.error("Order email failed:", r.reason);
  } catch (err) {
    console.error("Order email failed:", err);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function customerSubject(o: OrderDetail) {
  return o.locale === "ar" ? `تم استلام طلبك ${o.order_number} · منسوجات هاميلتون` : `Your order ${o.order_number} · Hamilton Textiles`;
}

function itemsTable(o: OrderDetail, ar: boolean) {
  const rows = o.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e7dfd0">${esc(ar ? i.name_ar : i.name_en)}<br><span style="color:#7a7468;font-size:13px">${metres(i.metres)} × ${bhd(i.price_fils)}</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #e7dfd0;text-align:${ar ? "left" : "right"};white-space:nowrap" dir="ltr">${bhd(i.line_total_fils)}</td>
      </tr>`,
    )
    .join("");
  const line = (label: string, fils: number, strong = false) =>
    `<tr><td style="padding:4px 0;${strong ? "font-weight:700" : "color:#4a463f"}">${label}</td><td style="padding:4px 0;text-align:${ar ? "left" : "right"};${strong ? "font-weight:700" : ""}" dir="ltr">${bhd(fils)}</td></tr>`;
  return `<table width="100%" cellspacing="0" cellpadding="0" style="font-size:15px">${rows}</table>
    <table width="100%" cellspacing="0" cellpadding="0" style="font-size:15px;margin-top:12px">
      ${line(ar ? "المجموع الفرعي" : "Subtotal", o.subtotal_fils)}
      ${o.discount_fils ? line(ar ? "الخصم" : "Discount", -o.discount_fils) : ""}
      ${line(o.fulfilment === "pickup" ? (ar ? "استلام من المحل" : "Pickup") : ar ? "التوصيل" : "Delivery", o.shipping_fils)}
      ${line(ar ? "الإجمالي المدفوع" : "Total paid", o.total_fils, true)}
    </table>`;
}

function shell(body: string, ar: boolean) {
  return `<!doctype html><html lang="${ar ? "ar" : "en"}" dir="${ar ? "rtl" : "ltr"}"><body style="margin:0;background:#f6f1e7;font-family:Helvetica,Arial,sans-serif;color:#1d1b17">
  <table width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffdf8;border-radius:18px;overflow:hidden">
      <tr><td style="background:#132820;padding:24px 28px;color:#f6f1e7;font-family:Georgia,serif;font-size:22px">Hamilton Textiles <span style="color:#c6a15b">·</span> منسوجات هاميلتون</td></tr>
      <tr><td style="padding:28px">${body}</td></tr>
      <tr><td style="padding:20px 28px;background:#efe7d8;color:#6b665c;font-size:12px;line-height:1.6">
        Hamilton Textile W.L.L · Hunainiya, Riffa, Bahrain · WhatsApp <a href="https://wa.me/97338257064" style="color:#2f5a49">+973 3825 7064</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function customerHtml(o: OrderDetail) {
  const ar = o.locale === "ar";
  const track = `${SITE}/${ar ? "ar" : "en"}/track`;
  const name = esc(o.customer.full_name.split(" ")[0] ?? "");
  const intro = ar
    ? `<p style="font-size:17px;margin:0 0 6px">شكراً لك ${name}،</p><p style="margin:0 0 20px;color:#4a463f;line-height:1.6">استلمنا دفعتك لطلب <b dir="ltr">${o.order_number}</b>. سنقصّ أقمشتك ونجهّزها، ونرسل لك رسالة عند ${o.fulfilment === "pickup" ? "جاهزيتها للاستلام" : "شحنها"}.</p>`
    : `<p style="font-size:17px;margin:0 0 6px">Thank you, ${name}.</p><p style="margin:0 0 20px;color:#4a463f;line-height:1.6">We've received payment for order <b>${o.order_number}</b>. We'll cut and pack your fabric and message you when it's ${o.fulfilment === "pickup" ? "ready to collect" : "on its way"}.</p>`;
  const button = `<p style="margin:24px 0 0"><a href="${track}" style="display:inline-block;background:#2f5a49;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${ar ? "تتبّع طلبك" : "Track your order"}</a></p>`;
  return shell(intro + itemsTable(o, ar) + button, ar);
}

function ownerHtml(o: OrderDetail) {
  const a = o.shipping_address;
  const address = o.fulfilment === "pickup" ? "Pickup from shop" : a ? esc(Object.values(a).filter(Boolean).join(", ")) : "—";
  const body = `<p style="font-size:17px;margin:0 0 4px"><b>${o.order_number}</b> is paid and ready to cut.</p>
    <p style="margin:0 0 20px;color:#4a463f;line-height:1.6">${esc(o.customer.full_name)} · <span dir="ltr">${esc(o.customer.phone)}</span><br>${address}${o.customer_note ? `<br><i>“${esc(o.customer_note)}”</i>` : ""}</p>
    ${itemsTable(o, false)}
    <p style="margin:24px 0 0"><a href="${SITE}/admin/orders/${o.id}" style="display:inline-block;background:#2f5a49;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Open in admin</a></p>`;
  return shell(body, false);
}
