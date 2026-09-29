"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AuthField } from "@/components/auth/auth-field";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { GoogleButton } from "@/components/auth/google-button";
import { loginWithPassword } from "@/lib/auth/password-actions";
import { useState } from "react";

type LoginFormProps = {
  initialError: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={primaryButtonClass} disabled={pending}>
      {pending ? "登入中…" : "登入"}
    </button>
  );
}

export function LoginForm({ initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="grid gap-6">
      <form className="grid gap-4" action={loginWithPassword}>
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
        {initialError ? (
          <p role="alert" className="text-base text-error">
            {initialError}
          </p>
        ) : null}
        <SubmitButton />
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
