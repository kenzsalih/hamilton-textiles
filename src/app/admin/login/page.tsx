import { redirect } from "next/navigation";
import { devSignInAllowed, getAdminSession } from "@/lib/admin/session";
import { AuthCard } from "./auth-card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { reset } = await searchParams;

  return (
    <AuthCard title="Hamilton Admin" subtitle="Fabrics, orders and customers — in your pocket.">
      {reset === "expired" && (
        <p role="alert" className="mb-4 rounded-xl bg-crimson/10 px-4 py-3 text-sm text-crimson">
          That reset link has expired or was already used. Request a new one below.
        </p>
      )}
      <LoginForm dev={devSignInAllowed()} />
    </AuthCard>
  );
}
