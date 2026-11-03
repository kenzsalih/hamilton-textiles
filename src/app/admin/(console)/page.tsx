import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, PackageCheck, Plus, Truck } from "lucide-react";
import { getDashboard } from "@/lib/admin/dashboard";
import { bhd, metres, timeAgo } from "@/lib/admin/format";
import { Body, Card, CardTitle, PageTitle, StatusPill } from "@/components/admin/ui";
import { SalesChart } from "@/components/admin/sales-chart";

export const metadata = { title: "Home" };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Bahrain" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const d = await getDashboard(30);
  const change = d.period.revenueChange;
  const totalPayments = d.paymentSplit.benefitpay + d.paymentSplit.card;

  return (
    <>
      <PageTitle
        title={greeting()}
        subtitle={new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Bahrain" }).format(new Date())}
        action={
          <Link href="/admin/materials/new" className="btn btn-primary h-10 px-4 text-xs">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add fabric</span>
          </Link>
        }
      />
      <Body className="space-y-4 lg:space-y-6">
        {/* Today */}
        <div className="grain overflow-hidden rounded-[1.5rem] bg-pine-800 p-5 text-ivory sm:p-6">
          <p className="text-xs font-medium text-pine-300">Today&apos;s sales</p>
          <p className="mt-1 font-display text-5xl">{bhd(d.today.revenue)}</p>
          <p className="mt-1 text-sm text-pine-100/80">
            {d.today.orders} order{d.today.orders === 1 ? "" : "s"} today
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/admin/orders?status=paid" className="flex items-center gap-3 rounded-2xl bg-pine-700/60 p-3.5 transition-colors hover:bg-pine-700">
              <PackageCheck className="size-5 text-brass-light" strokeWidth={1.6} />
              <span>
                <span className="block text-xl font-semibold leading-none">{d.toPack.length}</span>
                <span className="text-[0.7rem] text-pine-100/75">to cut &amp; pack</span>
              </span>
            </Link>
            <Link href="/admin/orders?status=packed,shipped,ready_for_pickup" className="flex items-center gap-3 rounded-2xl bg-pine-700/60 p-3.5 transition-colors hover:bg-pine-700">
              <Truck className="size-5 text-brass-light" strokeWidth={1.6} />
              <span>
                <span className="block text-xl font-semibold leading-none">{d.inTransit}</span>
                <span className="text-[0.7rem] text-pine-100/75">on the way</span>
              </span>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:gap-6">
          {/* 30 days */}
          <Card>
            <CardTitle>Last 30 days</CardTitle>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 pb-2 sm:grid-cols-4 sm:px-5">
              <Stat label="Sales" value={bhd(d.period.revenue)}>
                {change !== null && (
                  <span className={`inline-flex items-center text-[0.7rem] font-semibold ${change >= 0 ? "text-pine-700" : "text-crimson"}`}>
                    {change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {Math.abs(change * 100).toFixed(0)}% vs previous
                  </span>
                )}
              </Stat>
              <Stat label="Orders" value={String(d.period.orders)} />
              <Stat label="Average order" value={bhd(d.period.avgOrder)} />
              <Stat label="Fabric sold" value={metres(d.period.metres)} />
            </div>
            <SalesChart series={d.series} />
          </Card>

          {/* To pack */}
          <Card>
            <CardTitle action={<Link href="/admin/orders?status=paid" className="text-xs font-semibold text-pine-700">All</Link>}>
              Waiting to be packed
            </CardTitle>
            {d.toPack.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted">All caught up — nothing to pack.</p>
            ) : (
              <ul className="divide-y divide-sand/70 pb-2">
                {d.toPack.slice(0, 5).map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-linen/60 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{o.customer.full_name}</p>
                        <p className="text-xs text-muted">
                          {o.order_number} · {o.fulfilment === "pickup" ? "Pickup" : "Delivery"} · {timeAgo(o.created_at)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{bhd(o.total_fils)}</span>
                      <ChevronRight className="size-4 text-stone" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <Card>
            <CardTitle>Best sellers · 30 days</CardTitle>
            <ol className="space-y-3 px-4 pt-1 pb-5 sm:px-5">
              {d.bestSellers.map((s, i) => {
                const pct = (s.revenue / (d.bestSellers[0]?.revenue || 1)) * 100;
                return (
                  <li key={s.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate">
                        <span className="me-2 text-xs text-muted">{i + 1}</span>
                        {s.materialId ? <Link href={`/admin/materials/${s.materialId}`} className="hover:underline">{s.name}</Link> : s.name}
                      </span>
                      <span className="shrink-0 font-semibold">{bhd(s.revenue)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-linen">
                        <div className="h-full rounded-full bg-pine-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-14 text-end text-[0.7rem] text-muted">{metres(s.metres)}</span>
                    </div>
                  </li>
                );
              })}
              {d.bestSellers.length === 0 && <p className="text-sm text-muted">No sales yet.</p>}
            </ol>
          </Card>

          <Card>
            <CardTitle action={<Link href="/admin/materials?filter=low" className="text-xs font-semibold text-pine-700">All</Link>}>
              Running low
            </CardTitle>
            {d.lowStock.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted">Stock levels look healthy.</p>
            ) : (
              <ul className="divide-y divide-sand/70 pb-2">
                {d.lowStock.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/materials/${m.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-linen/60 sm:px-5">
                      <AlertTriangle className={`size-4 shrink-0 ${m.stock_m === 0 ? "text-crimson" : "text-brass"}`} />
                      <span className="min-w-0 flex-1 truncate text-sm">{m.name_en}</span>
                      <span className={`text-sm font-semibold ${m.stock_m === 0 ? "text-crimson" : ""}`}>{m.stock_m === 0 ? "Sold out" : metres(m.stock_m)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle action={<Link href="/admin/orders" className="text-xs font-semibold text-pine-700">All</Link>}>Recent orders</CardTitle>
            <ul className="divide-y divide-sand/70 pb-2">
              {d.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-linen/60 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{o.customer.full_name}</p>
                      <p className="text-[0.7rem] text-muted">{timeAgo(o.created_at)}</p>
                    </div>
                    <StatusPill status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
            {totalPayments > 0 && (
              <div className="border-t border-sand/70 px-4 py-3 sm:px-5">
                <div className="flex h-2 overflow-hidden rounded-full">
                  <div className="bg-[#c8102e]" style={{ width: `${(d.paymentSplit.benefitpay / totalPayments) * 100}%` }} />
                  <div className="flex-1 bg-pine-500" />
                </div>
                <p className="mt-2 flex justify-between text-[0.7rem] text-muted">
                  <span>BenefitPay {Math.round((d.paymentSplit.benefitpay / totalPayments) * 100)}%</span>
                  <span>Card {Math.round((d.paymentSplit.card / totalPayments) * 100)}%</span>
                </p>
              </div>
            )}
          </Card>
        </div>
      </Body>
    </>
  );
}

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.7rem] text-muted">{label}</p>
      <p className="text-lg font-semibold text-ink">{value}</p>
      {children}
    </div>
  );
}
