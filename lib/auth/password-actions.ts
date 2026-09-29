"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes("email not confirmed")) {
      redirect("/login?error=confirm");
    }
    redirect("/login?error=credentials");
  }

  redirect("/dashboard");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm-password") ?? "");

  if (password.length < 8) {
    redirect("/auth/update-password?error=short");
  }

  if (password !== confirmPassword) {
    redirect("/auth/update-password?error=mismatch");
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/auth/update-password?error=failed");
  }

  redirect("/dashboard?password=saved");
}
