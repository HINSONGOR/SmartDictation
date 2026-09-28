import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { MissingConfig } from "@/components/auth/missing-config";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="忘記密碼" description="我們會寄出重設密碼連結。">
      {getSupabasePublicEnv() ? <ForgotPasswordForm /> : <MissingConfig />}
    </AuthShell>
  );
}
