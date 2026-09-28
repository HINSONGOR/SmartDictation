"use client";

import { useState } from "react";
import { secondaryButtonClass } from "@/components/auth/button-styles";
import { authErrorMessage } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/client";

export function GoogleButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (signInError) {
      setPending(false);
      setError(authErrorMessage(signInError.message));
    }
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        className={secondaryButtonClass}
        onClick={signInWithGoogle}
        disabled={pending}
      >
        {pending ? "前往 Google…" : "使用 Google 登入"}
      </button>
      {error ? (
        <p role="alert" className="text-base text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
