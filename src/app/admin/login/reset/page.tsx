import { redirect } from "next/navigation";
import { getAuthClient, isSupabaseAuthConfigured } from "@/lib/admin/session";
import { AuthCard } from "../auth-card";
import { ResetForm } from "./reset-form";

export const metadata = { title: "New password" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  if (!isSupabaseAuthConfigured()) redirect("/admin/login");
  const { data } = await (await getAuthClient()).auth.getUser();
  if (!data.user) redirect("/admin/login?reset=expired");

  return (
    <AuthCard title="New password" subtitle={`For ${data.user.email}`}>
      <ResetForm />
    </AuthCard>
  );
}
