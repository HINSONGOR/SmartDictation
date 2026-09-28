"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthField } from "@/components/auth/auth-field";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { authErrorMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("密碼請使用至少 8 個字元。");
      return;
    }

    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不相同。");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setPending(false);
      setError(authErrorMessage(updateError.message));
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <AuthField
        id="password"
        label="新密碼"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
      />
      <AuthField
        id="confirm-password"
        label="確認新密碼"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
      />
      {error ? (
        <p role="alert" className="text-base text-error">
          {error}
        </p>
      ) : null}
      <button type="submit" className={primaryButtonClass} disabled={pending}>
        {pending ? "更新中…" : "更新密碼"}
      </button>
    </form>
  );
}
