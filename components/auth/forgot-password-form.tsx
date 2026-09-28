"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthField } from "@/components/auth/auth-field";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { authErrorMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/auth/update-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setPending(false);

    if (resetError && !resetError.message.toLowerCase().includes("user not found")) {
      setError(authErrorMessage(resetError.message));
      return;
    }

    setSent(true);
  }

  return (
    <div className="grid gap-6">
      {sent ? (
        <p className="text-base leading-7 text-foreground">
          如果這個電郵已註冊，你會收到重設密碼信。請開啟信件裡的連結。
        </p>
      ) : (
        <form className="grid gap-4" onSubmit={onSubmit}>
          <AuthField
            id="email"
            label="電郵"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
          {error ? (
            <p role="alert" className="text-base text-error">
              {error}
            </p>
          ) : null}
          <button type="submit" className={primaryButtonClass} disabled={pending}>
            {pending ? "發送中…" : "發送重設信"}
          </button>
        </form>
      )}
      <Link className="text-base text-primary" href="/login">
        返回登入
      </Link>
    </div>
  );
}
