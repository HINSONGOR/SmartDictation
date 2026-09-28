import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { isTheme, type ThemeName } from "@/lib/theme/themes";

export async function loadSavedTheme(): Promise<{ theme: ThemeName; saved: boolean }> {
  if (!getSupabasePublicEnv()) {
    return { theme: "default", saved: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { theme: "default", saved: false };
  }

  const { data: profile } = await supabase.from("profiles").select("theme").eq("id", data.user.id).maybeSingle();
  if (isTheme(profile?.theme)) {
    return { theme: profile.theme, saved: true };
  }

  return { theme: "default", saved: false };
}
