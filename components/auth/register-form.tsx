"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthField } from "@/components/auth/auth-field";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { GoogleButton } from "@/components/auth/google-button";
import { authErrorMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: displayName.trim() },
      },
    });

    if (signUpError) {
      setPending(false);
      setError(authErrorMessage(signUpError.message));
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setPending(false);
    const identities = data.user?.identities ?? [];
    if (data.user && identities.length === 0) {
      setError("這個電郵已經註冊。請用「忘記密碼」設定密碼，然後用電郵登入。");
      return;
    }

    setMessage("帳號已建立。請打開確認電郵，按裡面的連結。確認後，再用電郵和密碼登入。");
  }

  return (
    <div className="grid gap-6">
      <form className="grid gap-4" method="post" onSubmit={onSubmit}>
        <AuthField
          id="display-name"
          label="顯示名稱"
          autoComplete="name"
          value={displayName}
          onChange={setDisplayName}
        />
        <AuthField
          id="email"
          label="電郵"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <AuthField
          id="password"
          label="密碼"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
        <AuthField
          id="confirm-password"
          label="確認密碼"
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
        {message ? <p className="text-base text-success">{message}</p> : null}
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          {pending ? "註冊中…" : "註冊"}
        </button>
      </form>
      <GoogleButton />
      <Link className="text-base text-primary" href="/login">
        已有帳號？登入
      </Link>
    </div>
  );
}
