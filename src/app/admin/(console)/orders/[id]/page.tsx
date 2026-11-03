import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageSquareText, Phone, Store } from "lucide-react";
import { getRepo } from "@/lib/data";
import { bhd, dateTime, STATUS_LABEL } from "@/lib/admin/format";
import { countryName } from "@/lib/countries";
import { Body, Card, CardTitle, PageTitle, StatusPill } from "@/components/admin/ui";
import { OrderActions } from "@/components/admin/order-actions";
import { CuttingList } from "@/components/admin/cutting-list";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getRepo().getOrder(id);
  if (!order) notFound();

  const a = order.shipping_address;
  const addressLines = a
    ? [
        a.line1,
        a.line2,
        [a.building && `Bldg ${a.building}`, a.flat && `Flat ${a.flat}`].filter(Boolean).join(", "),
        [a.road && `Road ${a.road}`, a.block && `Block ${a.block}`].filter(Boolean).join(", "),
        [a.area, a.city, a.postcode].filter(Boolean).join(" "),
        a.country && countryName(a.country, "en"),
      ].filter(Boolean)
    : [];
  const mapQuery = encodeURIComponent(addressLines.join(", "));
  const phoneDigits = order.customer.phone.replace(/[^\d]/g, "");

  return (
    <>
      <PageTitle title={order.order_number} subtitle={`Placed ${dateTime(order.created_at)}`} back="/admin/orders" action={<StatusPill status={order.status} />} />
      <Body className="grid gap-4 pb-28 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-6 lg:pb-6">
        <div className="space-y-4">
          <OrderActions
            orderId={order.id}
            status={order.status}
            fulfilment={order.fulfilment}
            paid={Boolean(order.paid_at)}
            whatsapp={{ phone: phoneDigits, name: order.customer.full_name.split(" ")[0], orderNumber: order.order_number, locale: order.locale }}
          />

          <Card>
            <CardTitle>Cutting list</CardTitle>
            <CuttingList orderId={order.id} items={order.items} canTick={order.status === "paid"} />
            <dl className="space-y-1.5 border-t border-sand/70 px-4 py-3.5 text-sm sm:px-5">
              <Row label="Subtotal" value={bhd(order.subtotal_fils)} />
              {order.discount_fils > 0 && <Row label="Discount" value={`− ${bhd(order.discount_fils)}`} />}
              <Row label={order.fulfilment === "pickup" ? "Pickup" : "Delivery"} value={order.shipping_fils ? bhd(order.shipping_fils) : "Free"} />
              {order.vat_fils > 0 && <Row label="VAT" value={bhd(order.vat_fils)} />}
              <div className="flex justify-between pt-1.5 text-base font-semibold">
                <dt>Total paid</dt>
                <dd>{bhd(order.total_fils)}</dd>
              </div>
              <p className="pt-1 text-xs text-muted">
                {order.paid_at
                  ? `Paid by ${order.payment_method === "benefitpay" ? "BenefitPay" : "card"} · ${dateTime(order.paid_at)}`
                  : "Not paid"}
                {order.display_currency !== "BHD" && ` · customer browsed in ${order.display_currency}`}
              </p>
            </dl>
          </Card>

          {order.customer_note && (
            <Card className="flex gap-3 p-4 sm:p-5">
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-brass" />
              <div>
                <p className="text-xs font-semibold text-ink-soft">Customer note</p>
                <p className="mt-1 text-sm">{order.customer_note}</p>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/admin/customers/${order.customer.id}`} className="font-semibold text-ink hover:underline">
                  {order.customer.full_name}
                </Link>
                <p className="text-sm text-muted" dir="ltr">{order.customer.phone}</p>
                {order.customer.email && <p className="truncate text-sm text-muted">{order.customer.email}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <a href={`tel:+${phoneDigits}`} className="grid size-10 place-items-center rounded-full border border-sand bg-white" aria-label="Call customer">
                  <Phone className="size-4" />
                </a>
                <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-full bg-[#25d366] text-white" aria-label="WhatsApp customer">
                  <svg viewBox="0 0 24 24" className="size-4.5" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.03c-.25.69-1.43 1.32-2 1.41-.51.07-1.16.1-1.87-.12-.43-.14-.98-.32-1.7-.63-2.98-1.29-4.93-4.29-5.08-4.49-.14-.2-1.21-1.61-1.21-3.07s.77-2.18 1.04-2.48c.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.5.25.6.85 2.06.92 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.13 1.01 2.08 1.32 2.38 1.47.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.08.12.08.72-.17 1.41z" /></svg>
                </a>
              </div>
            </div>

            <div className="mt-4 border-t border-sand/70 pt-4">
              {order.fulfilment === "pickup" ? (
                <p className="flex items-center gap-2 text-sm">
                  <Store className="size-4 text-brass" />
                  Customer will collect from the shop
                </p>
              ) : (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brass" />
                  <div className="text-sm">
                    {addressLines.map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-pine-700">
                      Open in Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Timeline</CardTitle>
            <ol className="space-y-3 px-4 pt-1 pb-5 sm:px-5">
              {[...order.events].reverse().map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${i === 0 ? "bg-pine-700" : "bg-stone"}`} />
                  <div>
                    <p className="text-sm font-medium">{STATUS_LABEL[e.status] ?? e.status}</p>
                    <p className="text-xs text-muted">{dateTime(e.created_at)}{e.note ? ` — ${e.note}` : ""}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </Body>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
