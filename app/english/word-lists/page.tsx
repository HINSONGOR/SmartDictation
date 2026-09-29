import Link from "next/link";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { ConfirmDelete } from "@/components/content/confirm-delete";
import { MigrationNotice, PageShell } from "@/components/content/page-shell";
import { StartWordListButton } from "@/components/dictation/StartWordListButton";
import { requireUserId } from "@/lib/auth/require-user";
import { listWordLists } from "@/lib/content/queries";

export const dynamic = "force-dynamic";

export default async function EnglishWordListsPage() {
  await requireUserId();
  const result = await listWordLists("en");

  return (
    <PageShell title="English Vocabulary" description="每個生字分開儲存。" backHref="/english" backLabel="返回 English">
      <Link href="/english/word-lists/new" className={primaryButtonClass}>
        新增生字表
      </Link>
      {result.status === "missing" ? <MigrationNotice /> : null}
      {result.status === "error" ? <p className="text-base text-error">生字表暫時讀取不到，請再試一次。</p> : null}
      {result.status === "ready" && result.data.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-base leading-7 text-muted">還沒有英文生字表。</p>
      ) : null}
      {result.status === "ready"
        ? result.data.map((list) => (
            <article key={list.id} className="grid gap-4 rounded-2xl border border-border bg-card p-5">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{list.title}</h2>
                <p className="mt-2 text-base text-muted">{list.itemCount} words</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StartWordListButton listId={list.id} language="en" itemCount={list.itemCount} />
                <Link
                  href={`/english/word-lists/${list.id}/edit`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-secondary px-4 text-base font-medium text-foreground"
                >
                  編輯
                </Link>
                <ConfirmDelete kind="word-list" id={list.id} language="en" />
              </div>
            </article>
          ))
        : null}
    </PageShell>
  );
}
