import { notFound } from "next/navigation";
import { PageShell } from "@/components/content/page-shell";
import { DictationSetup } from "@/components/dictation/DictationSetup";
import { requireUser } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/content/parse";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SelectPageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function SelectChineseLessonPage({ params }: SelectPageProps) {
  const user = await requireUser();
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

  const [{ data: paragraphs }, { data: profile }] = await Promise.all([
    supabase.from("paragraphs").select("sort_order").eq("lesson_id", lessonId).order("sort_order", { ascending: true }),
    supabase.from("profiles").select("voice_zh").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <PageShell
      title={lesson.title}
      description="學生不需要由第一段開始。選好範圍後才播放。"
      backHref={`/chinese/lessons/${lesson.id}`}
      backLabel="返回課文"
    >
      <DictationSetup
        lessonId={lesson.id}
        language="zh"
        sortOrders={(paragraphs ?? []).map((paragraph) => paragraph.sort_order)}
        savedVoice={profile?.voice_zh === "zh-CN" ? "zh-CN" : "zh-HK"}
      />
    </PageShell>
  );
}
