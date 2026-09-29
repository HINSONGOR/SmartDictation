import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { MissingConfig } from "@/components/auth/missing-config";
import { callbackErrorMessage } from "@/lib/auth/messages";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialError = callbackErrorMessage(firstParam(params.error));

  return (
    <AuthShell
      title="登入"
      description="用電郵和密碼登入，或使用 Google 登入。"
    >
      {getSupabasePublicEnv() ? <LoginForm initialError={initialError} /> : <MissingConfig />}
    </AuthShell>
  );
}
