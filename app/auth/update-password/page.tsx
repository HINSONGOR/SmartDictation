import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { updatePasswordError } from "@/lib/auth/messages";
import { requireUserId } from "@/lib/auth/require-user";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type UpdatePasswordPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  if (!getSupabasePublicEnv()) {
    redirect("/login");
  }

  await requireUserId();
  const params = await searchParams;

  return (
    <AuthShell title="設定新密碼" description="請在下面兩個空格輸入新密碼，然後按「更新密碼」。">
      <UpdatePasswordForm initialError={updatePasswordError(firstParam(params.error))} />
    </AuthShell>
  );
}
