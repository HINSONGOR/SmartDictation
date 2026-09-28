import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { requireUser } from "@/lib/auth/require-user";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  if (!getSupabasePublicEnv()) {
    redirect("/login");
  }

  await requireUser();

  return (
    <AuthShell title="設定新密碼" description="請輸入新密碼。完成後會回到主頁。">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
