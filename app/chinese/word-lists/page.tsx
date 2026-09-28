import Link from "next/link";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { ConfirmDelete } from "@/components/content/confirm-delete";
import { MigrationNotice, PageShell } from "@/components/content/page-shell";
import { requireUser } from "@/lib/auth/require-user";
import { listWordLists } from "@/lib/content/queries";

export const dynamic = "force-dynamic";

export default async function ChineseWordListsPage() {
  await requireUser();
  const result = await listWordLists("zh");

  return (
    <PageShell title="中文詞語表" description="每個詞語會分開儲存，方便之後排序和重默。" backHref="/chinese" backLabel="返回中文">
      <Link href="/chinese/word-lists/new" className={primaryButtonClass}>
        新增詞語表
      </Link>
      {result.status === "missing" ? <MigrationNotice /> : null}
      {result.status === "error" ? <p className="text-base text-error">詞語表暫時讀取不到，請再試一次。</p> : null}
      {result.status === "ready" && result.data.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-base leading-7 text-muted">還沒有中文詞語表。</p>
      ) : null}
      {result.status === "ready"
        ? result.data.map((list) => (
            <article key={list.id} className="grid gap-4 rounded-2xl border border-border bg-card p-5">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{list.title}</h2>
                <p className="mt-2 text-base text-muted">共 {list.itemCount} 個詞語</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/chinese/word-lists/${list.id}/edit`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 text-base font-medium text-primary-foreground"
                >
                  編輯
                </Link>
                <ConfirmDelete kind="word-list" id={list.id} language="zh" />
              </div>
            </article>
          ))
        : null}
    </PageShell>
  );
}
