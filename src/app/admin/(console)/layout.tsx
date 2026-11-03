import { requireAdmin } from "@/lib/admin/session";
import { getRepo } from "@/lib/data";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const toPack = (await getRepo().listOrders({ status: ["paid"] })).length;
  return (
    <AdminShell toPack={toPack} devMode={session.kind === "dev"}>
      {children}
    </AdminShell>
  );
}
