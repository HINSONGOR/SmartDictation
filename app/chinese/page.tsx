import { HubLink, PageShell } from "@/components/content/page-shell";
import { requireUserId } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function ChinesePage() {
  await requireUserId();

  return (
    <PageShell title="中文默書" description="課文可以選段聆聽或打字。答錯的句子可以在錯題重溫。" backHref="/dashboard" backLabel="返回主頁">
      <HubLink href="/chinese/lessons" title="課文默書" detail="課文標題和各段原文" />
      <HubLink href="/chinese/word-lists" title="詞語默書" detail="自訂標題和詞語" />
      <HubLink href="/mistakes?language=zh" title="錯題" detail="重溫打錯的中文句子" />
    </PageShell>
  );
}
