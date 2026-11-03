import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Mail, Phone } from "lucide-react";
import { getRepo, SOLD_STATUSES } from "@/lib/data";
import { bhd, date, metres, timeAgo } from "@/lib/admin/format";
import { countryName } from "@/lib/countries";
import { Body, Card, CardTitle, PageTitle, StatusPill } from "@/components/admin/ui";
import { CustomerNotes } from "@/components/admin/customer-notes";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const [customer, orders] = await Promise.all([repo.getCustomer(id), repo.listOrders({ customerId: id })]);
  if (!customer) notFound();

  const sold = orders.filter((o) => SOLD_STATUSES.includes(o.status));
  const spent = sold.reduce((s, o) => s + o.total_fils, 0);
  const favourites = new Map<string, { name: string; materialId: string | null; metres: number }>();
  for (const o of sold) {
    for (const i of o.items) {
      const row = favourites.get(i.sku) ?? { name: i.name_en, materialId: i.material_id, metres: 0 };
      row.metres += i.metres;
      favourites.set(i.sku, row);
    }
  }
  const top = [...favourites.values()].sort((a, b) => b.metres - a.metres).slice(0, 4);
  const phoneDigits = customer.phone.replace(/[^\d]/g, "");

  return (
    <>
      <PageTitle title={customer.full_name} subtitle={`Customer since ${date(customer.created_at)} · ${countryName(customer.country, "en")}`} back="/admin/customers" />
      <Body className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-start lg:gap-6">
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-semibold">{sold.length}</p>
                <p className="text-[0.7rem] text-muted">Orders</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{bhd(spent)}</p>
                <p className="text-[0.7rem] text-muted">Spent</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{sold.length ? bhd(Math.round(spent / sold.length)) : "—"}</p>
                <p className="text-[0.7rem] text-muted">Average</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-sand/70 pt-4">
              <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer" className="btn h-11 bg-[#25d366] text-white">
                WhatsApp
              </a>
              <a href={`tel:+${phoneDigits}`} className="btn btn-ghost h-11">
                <Phone className="size-4" />
                Call
              </a>
            </div>
            <div className="mt-4 space-y-1.5 text-sm text-ink-soft">
              <p dir="ltr" className="text-start">{customer.phone}</p>
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 hover:underline">
                  <Mail className="size-3.5" />
                  {customer.email}
                </a>
              )}
            </div>
          </Card>

          {top.length > 0 && (
            <Card>
              <CardTitle>Favourite fabrics</CardTitle>
              <ul className="space-y-2 px-4 pb-4 text-sm sm:px-5">
                {top.map((f) => (
                  <li key={f.name} className="flex justify-between gap-3">
                    {f.materialId ? <Link href={`/admin/materials/${f.materialId}`} className="truncate hover:underline">{f.name}</Link> : <span className="truncate">{f.name}</span>}
                    <span className="shrink-0 text-muted">{metres(f.metres)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <CustomerNotes customerId={customer.id} initial={customer.notes ?? ""} />
        </div>

        <Card>
          <CardTitle>Orders</CardTitle>
          <ul className="divide-y divide-sand/70 pb-2">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-linen/60 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {o.order_number}
                      <StatusPill status={o.status} />
                    </p>
                    <p className="truncate text-xs text-muted">
                      {o.items.map((i) => `${i.name_en} ${metres(i.metres)}`).join(", ")} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{bhd(o.total_fils)}</span>
                  <ChevronRight className="size-4 shrink-0 text-stone" />
                </Link>
              </li>
            ))}
            {orders.length === 0 && <li className="px-5 py-4 text-sm text-muted">No orders yet.</li>}
          </ul>
        </Card>
      </Body>
    </>
  );
}
