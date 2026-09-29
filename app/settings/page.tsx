import { PageShell } from "@/components/content/page-shell";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { requireUserId } from "@/lib/auth/require-user";
import { isChineseVoice } from "@/lib/dictation/options";
import { createClient } from "@/lib/supabase/server";
import { isTheme, type ThemeName } from "@/lib/theme/themes";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("theme, voice_zh").eq("id", userId).maybeSingle();
  const theme: ThemeName = isTheme(profile?.theme) ? profile.theme : "default";
  const savedVoice = isChineseVoice(profile?.voice_zh) ? profile.voice_zh : null;

  return (
    <PageShell
      title="設定"
      description="語音、速度、默書方式和主題會記住。開始默書時不用再選一次。"
      backHref="/dashboard"
      backLabel="返回主頁"
    >
      <SettingsForm initialTheme={theme} themeSaved={isTheme(profile?.theme)} savedVoice={savedVoice} />
    </PageShell>
  );
}
