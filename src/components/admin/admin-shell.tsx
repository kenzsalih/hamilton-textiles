"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BadgePercent, Bell, ExternalLink, Layers, LayoutDashboard, LogOut, Menu, Package, Users } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { signOut } from "@/app/admin/login/actions";

const NAV = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/materials", label: "Fabrics", icon: Layers },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

const REFRESH_MS = 45_000;

export function AdminShell({
  children,
  toPack,
  devMode,
}: {
  children: React.ReactNode;
  toPack: number;
  devMode: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const [toast, setToast] = useState<string | null>(null);
  const previous = useRef(toPack);

  // Poll for new orders while the app is open; announce when the count grows.
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const id = setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  useEffect(() => {
    if (toPack > previous.current) {
      const n = toPack - previous.current;
      const message = n === 1 ? "New order received" : `${n} new orders received`;
      setToast(message);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Hamilton Textiles", { body: message, icon: "/admin/icon-192.png", tag: "new-order" });
      }
      navigator.vibrate?.(200);
      const id = setTimeout(() => setToast(null), 5000);
      previous.current = toPack;
      return () => clearTimeout(id);
    }
    previous.current = toPack;
  }, [toPack]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-pine-900 px-4 py-6 text-pine-100 lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <LogoMark className="size-10" />
          <span className="font-display text-xl text-ivory">Hamilton Admin</span>
        </Link>
        <nav className="mt-10 flex flex-col gap-1">
          {[...NAV, { href: "/admin/promos", label: "Promo codes", icon: BadgePercent }].map(({ href, label, icon: Icon, ...rest }) => {
            const active = isActive(href, "exact" in rest ? rest.exact : false);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-pine-700 text-ivory" : "text-pine-100/75 hover:bg-pine-800 hover:text-ivory"
                }`}
              >
                <Icon className="size-4.5" strokeWidth={1.7} />
                {label}
                {href === "/admin/orders" && toPack > 0 && (
                  <span className="ms-auto rounded-full bg-brass px-2 py-0.5 text-[0.65rem] font-bold text-pine-900">{toPack}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-1">
          <a href="/en" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-pine-100/75 hover:bg-pine-800 hover:text-ivory">
            <ExternalLink className="size-4.5" strokeWidth={1.7} />
            View website
          </a>
          <form action={signOut}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-pine-100/75 hover:bg-pine-800 hover:text-ivory">
              <LogOut className="size-4.5" strokeWidth={1.7} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {devMode && (
          <p className="bg-brass/15 px-4 py-1.5 text-center text-[0.7rem] font-medium text-[#7a5a26]">
            Development mode — using local test data, not the live shop
          </p>
        )}
        {children}
      </div>

      {/* Mobile tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-sand bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Main"
      >
        {[...NAV, { href: "/admin/more", label: "More", icon: Menu }].map(({ href, label, icon: Icon, ...rest }) => {
          const active = isActive(href, "exact" in rest ? rest.exact : false) || (href === "/admin/more" && pathname.startsWith("/admin/promos"));
          return (
            <Link key={href} href={href} className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[0.65rem] font-semibold ${active ? "text-pine-800" : "text-muted"}`}>
              <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? "bg-pine-100" : ""}`}>
                <Icon className="size-5" strokeWidth={active ? 2 : 1.6} />
              </span>
              {label}
              {href === "/admin/orders" && toPack > 0 && (
                <span className="absolute top-1.5 left-1/2 ms-3 grid min-w-4.5 place-items-center rounded-full bg-crimson px-1 text-[0.6rem] font-bold text-white">
                  {toPack}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {toast && (
        <div role="status" className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-sm animate-rise items-center gap-3 rounded-2xl bg-pine-900 px-4 py-3 text-sm text-ivory shadow-2xl">
          <Bell className="size-4 text-brass-light" />
          {toast}
          <Link href="/admin/orders?status=paid" onClick={() => setToast(null)} className="ms-auto font-semibold text-brass-light">
            View
          </Link>
        </div>
      )}
    </div>
  );
}
