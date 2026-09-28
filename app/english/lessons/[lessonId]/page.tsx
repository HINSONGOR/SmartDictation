import Link from "next/link";
import { notFound } from "next/navigation";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { MigrationNotice, PageShell } from "@/components/content/page-shell";
import { LessonEditor } from "@/components/lessons/lesson-editor";
import { requireUser } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/content/parse";
import { getLesson } from "@/lib/content/queries";

export const dynamic = "force-dynamic";

type EnglishLessonPageProps = {
  params: Promise<{ lessonId: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function EnglishLessonPage({ params, searchParams }: EnglishLessonPageProps) {
  await requireUser();
  const { lessonId } = await params;
  const query = await searchParams;

  if (!isUuid(lessonId)) {
    notFound();
  }

  const result = await getLesson(lessonId, "en");
  if (result.status === "missing") {
    return (
      <PageShell title="英文課文" backHref="/english/lessons" backLabel="返回課文">
        <MigrationNotice />
      </PageShell>
    );
  }

  if (result.status === "error") {
    return (
      <PageShell title="英文課文" backHref="/english/lessons" backLabel="返回課文">
        <p className="text-base text-error">課文暫時讀取不到，請再試一次。</p>
      </PageShell>
    );
  }

  if (!result.data) {
    notFound();
  }

  return (
    <PageShell
      title="編輯英文課文"
      description="調整段落順序後儲存。默書時可以選擇由哪一段開始。"
      backHref="/english/lessons"
      backLabel="返回課文"
    >
      {query.error === "delete" ? <p className="text-base text-error">課文未能刪除，請再試一次。</p> : null}
      <Link href={`/english/lessons/${result.data.id}/select`} className={primaryButtonClass}>
        開始默書
      </Link>
      <LessonEditor
        language="en"
        lessonId={result.data.id}
        initialTitle={result.data.title}
        initialParagraphs={result.data.paragraphs}
      />
    </PageShell>
  );
}
