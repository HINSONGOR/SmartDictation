import { HubLink, PageShell } from "@/components/content/page-shell";
import { requireUserId } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function EnglishPage() {
  await requireUserId();

  return (
    <PageShell
      title="English Dictation"
      description="和中文一樣，分成課文段落和生字。課文可以選擇段落後播放。"
      backHref="/dashboard"
      backLabel="返回主頁"
    >
      <HubLink href="/english/lessons" title="課文默書" detail="英文課文和各段原文" />
      <HubLink href="/english/word-lists" title="Vocabulary" detail="自訂標題和生字" />
      <HubLink href="/mistakes?language=en" title="錯題" detail="重溫打錯的英文句子" />
    </PageShell>
  );
}
