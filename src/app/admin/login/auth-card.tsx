import { LogoMark } from "@/components/brand/logo-mark";

/** Shared frame for the sign-in, forgot-password and new-password screens. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grain flex min-h-dvh items-center justify-center bg-pine-900 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <LogoMark className="mx-auto size-16 drop-shadow-lg" />
          <h1 className="mt-6 font-display text-4xl text-ivory">{title}</h1>
          <p className="mt-2 text-sm text-pine-300">{subtitle}</p>
        </div>
        <div className="mt-10 rounded-[1.75rem] bg-ivory p-6 shadow-2xl sm:p-8">{children}</div>
      </div>
    </main>
  );
}

export const authInputClass =
  "mt-1.5 h-12 w-full rounded-xl border border-sand bg-white px-4 text-base outline-none focus:border-pine-500";
