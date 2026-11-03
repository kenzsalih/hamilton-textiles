import { getRepo, SOLD_STATUSES, type Material, type OrderDetail } from "@/lib/data";
import { bahrainDay } from "./format";

const DAY = 864e5;

export type DashboardData = {
  today: { revenue: number; orders: number };
  period: { revenue: number; orders: number; avgOrder: number; metres: number; revenueChange: number | null };
  series: { day: string; revenue: number; orders: number }[];
  toPack: OrderDetail[];
  inTransit: number;
  recent: OrderDetail[];
  bestSellers: { name: string; materialId: string | null; metres: number; revenue: number }[];
  lowStock: Material[];
  paymentSplit: { benefitpay: number; card: number };
};

export async function getDashboard(days = 30): Promise<DashboardData> {
  const repo = getRepo();
  const since = new Date(Date.now() - days * 2 * DAY).toISOString();
  const [orders, materials] = await Promise.all([repo.listOrders({ since }), repo.listMaterials({ includeHidden: true })]);

  const sold = orders.filter((o) => SOLD_STATUSES.includes(o.status));
  const cutoff = Date.now() - days * DAY;
  const current = sold.filter((o) => Date.parse(o.created_at) >= cutoff);
  const previous = sold.filter((o) => Date.parse(o.created_at) < cutoff);

  const sum = (list: OrderDetail[]) => list.reduce((s, o) => s + o.total_fils, 0);
  const revenue = sum(current);
  const prevRevenue = sum(previous);

  const todayKey = bahrainDay(new Date());
  const todays = current.filter((o) => bahrainDay(o.created_at) === todayKey);

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) byDay.set(bahrainDay(new Date(Date.now() - i * DAY)), { revenue: 0, orders: 0 });
  for (const o of current) {
    const bucket = byDay.get(bahrainDay(o.created_at));
    if (bucket) {
      bucket.revenue += o.total_fils;
      bucket.orders += 1;
    }
  }

  const sellers = new Map<string, { name: string; materialId: string | null; metres: number; revenue: number }>();
  for (const o of current) {
    for (const item of o.items) {
      const key = item.material_id ?? item.sku;
      const row = sellers.get(key) ?? { name: item.name_en, materialId: item.material_id, metres: 0, revenue: 0 };
      row.metres += item.metres;
      row.revenue += item.line_total_fils;
      sellers.set(key, row);
    }
  }

  return {
    today: { revenue: sum(todays), orders: todays.length },
    period: {
      revenue,
      orders: current.length,
      avgOrder: current.length ? Math.round(revenue / current.length) : 0,
      metres: current.reduce((s, o) => s + o.items.reduce((m, i) => m + i.metres, 0), 0),
      revenueChange: prevRevenue > 0 ? (revenue - prevRevenue) / prevRevenue : null,
    },
    series: [...byDay].map(([day, v]) => ({ day, ...v })),
    toPack: orders.filter((o) => o.status === "paid").sort((a, b) => a.created_at.localeCompare(b.created_at)),
    inTransit: orders.filter((o) => o.status === "packed" || o.status === "shipped" || o.status === "ready_for_pickup").length,
    recent: orders.slice(0, 6),
    bestSellers: [...sellers.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    lowStock: materials.filter((m) => m.is_active && m.stock_m <= m.low_stock_m).sort((a, b) => a.stock_m - b.stock_m),
    paymentSplit: {
      benefitpay: current.filter((o) => o.payment_method === "benefitpay").length,
      card: current.filter((o) => o.payment_method !== "benefitpay").length,
    },
  };
}
