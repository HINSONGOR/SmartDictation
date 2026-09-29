import { notFound } from "next/navigation";
import { PageShell } from "@/components/content/page-shell";
import { DictationSetup } from "@/components/dictation/DictationSetup";
import { requireUserId } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/content/parse";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SelectPageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function SelectChineseLessonPage({ params }: SelectPageProps) {
  await requireUserId();
  const { lessonId } = await params;

  if (!isUuid(lessonId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("id", lessonId)
    .eq("language", "zh")
    .maybeSingle();

  if (!lesson) {
    notFound();
  }

  const { data: paragraphs } = await supabase
    .from("paragraphs")
    .select("sort_order")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  return (
    <PageShell title={lesson.title} description="選這次要默的段落。語音和速度用設定頁記住的選擇。" backHref={`/chinese/lessons/${lesson.id}`} backLabel="返回課文">
      <DictationSetup lessonId={lesson.id} language="zh" sortOrders={(paragraphs ?? []).map((paragraph) => paragraph.sort_order)} />
    </PageShell>
  );
}
