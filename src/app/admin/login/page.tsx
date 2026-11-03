import { redirect } from "next/navigation";
import { devSignInAllowed, getAdminSession } from "@/lib/admin/session";
import { LogoMark } from "@/components/brand/logo-mark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  const dev = devSignInAllowed();

  return (
    <main className="grain flex min-h-dvh items-center justify-center bg-pine-900 px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <LogoMark className="mx-auto size-16 drop-shadow-lg" />
          <h1 className="mt-6 font-display text-4xl text-ivory">Hamilton Admin</h1>
          <p className="mt-2 text-sm text-pine-300">Fabrics, orders and customers — in your pocket.</p>
        </div>
        <div className="mt-10 rounded-[1.75rem] bg-ivory p-6 shadow-2xl sm:p-8">
          <LoginForm dev={dev} />
        </div>
      </div>
    </main>
  );
}
