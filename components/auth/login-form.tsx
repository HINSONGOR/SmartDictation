"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthField } from "@/components/auth/auth-field";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { GoogleButton } from "@/components/auth/google-button";
import { authErrorMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  initialError: string | null;
};

export function LoginForm({ initialError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setPending(false);
      setError(authErrorMessage(signInError.message));
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <form className="grid gap-4" onSubmit={onSubmit}>
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
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        {error ? (
          <p role="alert" className="text-base text-error">
            {error}
          </p>
        ) : null}
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          {pending ? "登入中…" : "登入"}
        </button>
      </form>
      <GoogleButton />
      <div className="grid gap-2 text-base">
        <Link className="text-primary" href="/forgot-password">
          忘記密碼
        </Link>
        <Link className="text-primary" href="/register">
          尚未有帳號？註冊
        </Link>
      </div>
    </div>
  );
}
