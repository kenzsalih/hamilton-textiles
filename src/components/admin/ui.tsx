// Small building blocks shared by the admin screens.

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/admin/format";

export function PageTitle({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-sand/70 bg-ivory/90 px-4 pt-[calc(0.9rem+env(safe-area-inset-top))] pb-3.5 backdrop-blur-xl sm:px-6 lg:static lg:border-0 lg:bg-transparent lg:px-10 lg:pt-10 lg:pb-2 lg:backdrop-blur-none">
      <div className="flex items-center gap-3">
        {back && (
          <Link href={back} className="-ms-2 grid size-9 shrink-0 place-items-center rounded-full hover:bg-linen" aria-label="Back">
            <ChevronLeft className="size-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[1.75rem] leading-tight text-pine-900 lg:text-4xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted lg:text-sm">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 py-5 sm:px-6 lg:px-10 lg:py-6 ${className ?? ""}`}>{children}</div>;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.25rem] border border-sand/80 bg-white/70 ${className ?? ""}`}>{children}</section>;
}

export function CardTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 sm:px-5">
      <h2 className="text-sm font-semibold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${STATUS_TONE[status] ?? ""}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-sand px-6 py-14 text-center">
      <p className="font-display text-2xl text-pine-900">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const inputClass =
  "mt-1.5 h-12 w-full rounded-xl border border-sand bg-white px-3.5 text-base outline-none transition-colors focus:border-pine-500 aria-invalid:border-crimson sm:text-sm";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.7rem] text-muted">{hint}</span>}
    </label>
  );
}
