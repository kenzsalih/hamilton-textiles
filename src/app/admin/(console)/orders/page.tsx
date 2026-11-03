import { getRepo, ORDER_STATUSES, type OrderStatus } from "@/lib/data";
import { Body, PageTitle } from "@/components/admin/ui";
import { OrderList } from "@/components/admin/order-list";

export const metadata = { title: "Orders" };

const TABS: { key: string; label: string; statuses: OrderStatus[] | null }[] = [
  { key: "paid", label: "To pack", statuses: ["paid"] },
  { key: "packed", label: "Packed", statuses: ["packed"] },
  { key: "shipped,ready_for_pickup", label: "Out", statuses: ["shipped", "ready_for_pickup"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "all", label: "All", statuses: null },
  { key: "cancelled,refunded,pending_payment", label: "Other", statuses: ["cancelled", "refunded", "pending_payment"] },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const orders = await getRepo().listOrders({ limit: 500 });

  const requested = status?.split(",").filter((s): s is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(s));
  const active =
    TABS.find((t) => t.key === status) ??
    (requested?.length ? { key: status!, label: "", statuses: requested } : orders.some((o) => o.status === "paid") ? TABS[0] : TABS[4]);

  const counts = Object.fromEntries(TABS.map((t) => [t.key, t.statuses ? orders.filter((o) => t.statuses!.includes(o.status)).length : orders.length]));

  return (
    <>
      <PageTitle title="Orders" subtitle={`${counts.paid} waiting to be packed`} />
      <Body>
        <OrderList
          orders={orders.filter((o) => !active.statuses || active.statuses.includes(o.status))}
          tabs={TABS.map(({ key, label }) => ({ key, label, count: counts[key] }))}
          activeTab={active.key}
        />
      </Body>
    </>
  );
}
