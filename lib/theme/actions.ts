"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { isTheme, type ThemeName } from "@/lib/theme/themes";

export async function saveTheme(theme: ThemeName): Promise<{ error?: string }> {
  if (!isTheme(theme)) {
    return { error: "主題不正確。" };
  }

  if (!getSupabasePublicEnv()) {
    return {};
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return {};
  }

  const { error } = await supabase.from("profiles").update({ theme }).eq("id", data.user.id);
  if (error) {
    return { error: "主題未能儲存到帳號，這部裝置仍會記住。" };
  }

  return {};
}
