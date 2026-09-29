import Link from "next/link";
import { notFound } from "next/navigation";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { MigrationNotice, PageShell } from "@/components/content/page-shell";
import { LessonEditor } from "@/components/lessons/lesson-editor";
import { requireUserId } from "@/lib/auth/require-user";
import { getLesson } from "@/lib/content/queries";
import { isUuid } from "@/lib/content/parse";

export const dynamic = "force-dynamic";

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  await requireUserId();
  const { lessonId } = await params;
  const query = await searchParams;

  if (!isUuid(lessonId)) {
    notFound();
  }

  const result = await getLesson(lessonId, "zh");
  if (result.status === "missing") {
    return (
      <PageShell title="課文" backHref="/chinese/lessons" backLabel="返回課文">
        <MigrationNotice />
      </PageShell>
    );
  }

  if (result.status === "error") {
    return (
      <PageShell title="課文" backHref="/chinese/lessons" backLabel="返回課文">
        <p className="text-base text-error">課文暫時讀取不到，請再試一次。</p>
      </PageShell>
    );
  }

  if (!result.data) {
    notFound();
  }

  const deleteFailed = query.error === "delete";

  return (
    <PageShell title="編輯課文" description="調整段落順序後儲存。默書時可以選擇由哪一段開始。" backHref="/chinese/lessons" backLabel="返回課文">
      {deleteFailed ? <p className="text-base text-error">課文未能刪除，請再試一次。</p> : null}
      <Link href={`/chinese/lessons/${result.data.id}/select`} className={primaryButtonClass}>
        開始默書
      </Link>
      <LessonEditor
        language="zh"
        lessonId={result.data.id}
        initialTitle={result.data.title}
        initialParagraphs={result.data.paragraphs}
      />
    </PageShell>
  );
}
