import { AuthCard } from "../auth-card";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot password" subtitle="We'll email you a link to choose a new one.">
      <ForgotForm />
    </AuthCard>
  );
}
