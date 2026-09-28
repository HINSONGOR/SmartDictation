import { PageShell } from "@/components/content/page-shell";
import { WordListEditor } from "@/components/word-lists/word-list-editor";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function NewEnglishWordListPage() {
  await requireUser();

  return (
    <PageShell title="新增英文生字表" description="標題可以自訂，例如 Unit 3 Vocabulary。" backHref="/english/word-lists" backLabel="返回生字表">
      <WordListEditor language="en" listId={null} initialTitle="" initialItems={[]} />
    </PageShell>
  );
}
