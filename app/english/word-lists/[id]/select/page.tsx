import { notFound } from "next/navigation";
import { PageShell } from "@/components/content/page-shell";
import { WordDictationSetup } from "@/components/dictation/WordDictationSetup";
import { requireUser } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/content/parse";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SelectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SelectEnglishWordListPage({ params }: SelectPageProps) {
  await requireUser();
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: list }, { count }] = await Promise.all([
    supabase.from("word_lists").select("id, title").eq("id", id).eq("language", "en").maybeSingle(),
    supabase.from("dictation_items").select("id", { count: "exact", head: true }).eq("word_list_id", id),
  ]);

  if (!list) {
    notFound();
  }

  return (
    <PageShell
      title={list.title}
      description="選好方式和語音後才播放。每個生字分開默。"
      backHref="/english/word-lists"
      backLabel="返回生字表"
    >
      <WordDictationSetup listId={list.id} language="en" itemCount={count ?? 0} savedVoice="en-GB" />
    </PageShell>
  );
}
