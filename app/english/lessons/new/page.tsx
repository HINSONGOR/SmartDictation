import { PageShell } from "@/components/content/page-shell";
import { LessonEditor } from "@/components/lessons/lesson-editor";
import { requireUserId } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function NewEnglishLessonPage() {
  await requireUserId();

  return (
    <PageShell
      title="新增英文課文"
      description="標題自訂。每一段輸入完整英文原文，標點請保留。"
      backHref="/english/lessons"
      backLabel="返回課文"
    >
      <LessonEditor language="en" lessonId={null} initialTitle="" initialParagraphs={[{ id: null, content: "" }]} />
    </PageShell>
  );
}
