import { notFound } from "next/navigation";
import { MigrationNotice, PageShell } from "@/components/content/page-shell";
import { WordListEditor } from "@/components/word-lists/word-list-editor";
import { requireUser } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/content/parse";
import { getWordList } from "@/lib/content/queries";

export const dynamic = "force-dynamic";

type EditWordListPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function EditChineseWordListPage({ params, searchParams }: EditWordListPageProps) {
  await requireUser();
  const { id } = await params;
  const query = await searchParams;

  if (!isUuid(id)) {
    notFound();
  }

  const result = await getWordList(id, "zh");
  if (result.status === "missing") {
    return (
      <PageShell title="詞語表" backHref="/chinese/word-lists" backLabel="返回詞語表">
        <MigrationNotice />
      </PageShell>
    );
  }

  if (result.status === "error") {
    return (
      <PageShell title="詞語表" backHref="/chinese/word-lists" backLabel="返回詞語表">
        <p className="text-base text-error">詞語表暫時讀取不到，請再試一次。</p>
      </PageShell>
    );
  }

  if (!result.data) {
    notFound();
  }

  return (
    <PageShell title="編輯中文詞語表" backHref="/chinese/word-lists" backLabel="返回詞語表">
      {query.error === "delete" ? <p className="text-base text-error">詞語表未能刪除，請再試一次。</p> : null}
      <WordListEditor
        language="zh"
        listId={result.data.id}
        initialTitle={result.data.title}
        initialItems={result.data.items}
      />
    </PageShell>
  );
}
