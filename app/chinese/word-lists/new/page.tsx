import { PageShell } from "@/components/content/page-shell";
import { WordListEditor } from "@/components/word-lists/word-list-editor";
import { requireUserId } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function NewChineseWordListPage() {
  await requireUserId();

  return (
    <PageShell title="新增中文詞語表" description="先寫標題，再貼上或逐個加入詞語。" backHref="/chinese/word-lists" backLabel="返回詞語表">
      <WordListEditor language="zh" listId={null} initialTitle="" initialItems={[]} />
    </PageShell>
  );
}
