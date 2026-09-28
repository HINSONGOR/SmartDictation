import Link from "next/link";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { ConfirmDelete } from "@/components/content/confirm-delete";
import { MigrationNotice, PageShell } from "@/components/content/page-shell";
import { requireUser } from "@/lib/auth/require-user";
import { listLessons } from "@/lib/content/queries";

export const dynamic = "force-dynamic";

export default async function LessonListPage() {
  await requireUser();
  const result = await listLessons("zh");

  return (
    <PageShell title="我的課文" description="每課可以有多段，學校一課通常約 6 至 8 段。" backHref="/chinese" backLabel="返回中文">
      <Link href="/chinese/lessons/new" className={primaryButtonClass}>
        新增課文
      </Link>
      {result.status === "missing" ? <MigrationNotice /> : null}
      {result.status === "error" ? <p className="text-base text-error">課文暫時讀取不到，請再試一次。</p> : null}
      {result.status === "ready" && result.data.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-base leading-7 text-muted">還沒有課文。</p>
      ) : null}
      {result.status === "ready"
        ? result.data.map((lesson) => (
            <article key={lesson.id} className="grid gap-4 rounded-2xl border border-border bg-card p-5">
              <Link href={`/chinese/lessons/${lesson.id}`}>
                <h2 className="text-2xl font-semibold text-foreground">{lesson.title}</h2>
                <p className="mt-2 text-base text-muted">共 {lesson.paragraphCount} 段</p>
              </Link>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/chinese/lessons/${lesson.id}/select`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 text-base font-medium text-primary-foreground"
                >
                  開始默書
                </Link>
                <Link
                  href={`/chinese/lessons/${lesson.id}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-secondary px-4 text-base font-medium text-foreground"
                >
                  編輯
                </Link>
                <ConfirmDelete kind="lesson" id={lesson.id} language="zh" />
              </div>
            </article>
          ))
        : null}
    </PageShell>
  );
}
