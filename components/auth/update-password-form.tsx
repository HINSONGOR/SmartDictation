"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AuthField } from "@/components/auth/auth-field";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { updatePassword } from "@/lib/auth/password-actions";

type UpdatePasswordFormProps = {
  initialError: string | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={primaryButtonClass} disabled={pending}>
      {pending ? "更新中…" : "更新密碼"}
    </button>
  );
}

export function UpdatePasswordForm({ initialError }: UpdatePasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <form className="grid gap-4" action={updatePassword}>
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
      {initialError ? (
        <p role="alert" className="text-base text-error">
          {initialError}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
