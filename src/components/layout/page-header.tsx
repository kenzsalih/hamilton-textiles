import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs = [],
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  crumbs?: { href: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <header className="grain bg-linen">
      <div className="container-x py-12 lg:py-16">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="size-3 rtl:-scale-x-100" />}
                  <Link href={c.href} className="hover:text-pine-900">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-5xl text-pine-900 sm:text-6xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{description}</p>}
        {children}
      </div>
    </header>
  );
}
