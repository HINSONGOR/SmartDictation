import { notFound } from "next/navigation";
import { PageShell } from "@/components/content/page-shell";
import { WordDictationSetup } from "@/components/dictation/WordDictationSetup";
import { requireUserId } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/content/parse";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SelectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SelectChineseWordListPage({ params }: SelectPageProps) {
  const userId = await requireUserId();
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: list }, { count }, { data: profile }] = await Promise.all([
    supabase.from("word_lists").select("id, title").eq("id", id).eq("language", "zh").maybeSingle(),
    supabase.from("dictation_items").select("id", { count: "exact", head: true }).eq("word_list_id", id),
    supabase.from("profiles").select("voice_zh").eq("id", userId).maybeSingle(),
  ]);

  if (!list) {
    notFound();
  }

  return (
    <PageShell title={list.title} description="選好方式和語音後才播放。每個詞語分開默。" backHref="/chinese/word-lists" backLabel="返回詞語表">
      <WordDictationSetup
        listId={list.id}
        language="zh"
        itemCount={count ?? 0}
        savedVoice={profile?.voice_zh === "zh-CN" ? "zh-CN" : "zh-HK"}
      />
    </PageShell>
  );
}
