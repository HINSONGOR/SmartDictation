import { LessonEditor } from "@/components/lessons/lesson-editor";
import { PageShell } from "@/components/content/page-shell";
import { requireUserId } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function NewLessonPage() {
  await requireUserId();

  return (
    <PageShell title="新增課文" description="標題自訂。每一段輸入完整原文，標點請保留。" backHref="/chinese/lessons" backLabel="返回課文">
      <LessonEditor
        language="zh"
        lessonId={null}
        initialTitle=""
        initialParagraphs={[{ id: null, content: "" }]}
      />
    </PageShell>
  );
}
