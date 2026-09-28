import { AuthShell } from "@/components/auth/auth-shell";
import { MissingConfig } from "@/components/auth/missing-config";
import { RegisterForm } from "@/components/auth/register-form";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AuthShell title="註冊" description="建立家庭帳號，用來保存課文和默書紀錄。">
      {getSupabasePublicEnv() ? <RegisterForm /> : <MissingConfig />}
    </AuthShell>
  );
}
