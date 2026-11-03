import Link from "next/link";
import { BadgePercent, ChevronRight, ExternalLink, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { signOut } from "@/app/admin/login/actions";
import { Body, Card, PageTitle } from "@/components/admin/ui";
import { AppSettings } from "@/components/admin/app-settings";

export const metadata = { title: "More" };

export default async function MorePage() {
  const session = await requireAdmin();
  return (
    <>
      <PageTitle title="More" subtitle={`Signed in as ${session.email}`} />
      <Body className="space-y-4">
        <Card className="divide-y divide-sand/70 overflow-hidden">
          <Link href="/admin/promos" className="flex items-center gap-3 px-4 py-4 hover:bg-linen/60">
            <BadgePercent className="size-5 text-brass" strokeWidth={1.6} />
            <span className="flex-1 text-sm font-medium">Promo codes</span>
            <ChevronRight className="size-4 text-stone" />
          </Link>
          <a href="/en" target="_blank" className="flex items-center gap-3 px-4 py-4 hover:bg-linen/60">
            <ExternalLink className="size-5 text-brass" strokeWidth={1.6} />
            <span className="flex-1 text-sm font-medium">View website</span>
            <ChevronRight className="size-4 text-stone" />
          </a>
        </Card>

        <AppSettings />

        <form action={signOut}>
          <button className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-sand bg-white/70 py-4 text-sm font-semibold text-crimson">
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
        <p className="text-center text-[0.7rem] text-muted">Hamilton Textiles admin · v1.0</p>
      </Body>
    </>
  );
}
