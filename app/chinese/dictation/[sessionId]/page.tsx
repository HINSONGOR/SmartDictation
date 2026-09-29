import { notFound } from "next/navigation";
import { DictationSession } from "@/components/dictation/DictationSession";
import { requireUserId } from "@/lib/auth/require-user";
import { isUuid } from "@/lib/content/parse";
import { loadListenSession } from "@/lib/dictation/load-session";

export const dynamic = "force-dynamic";

type DictationPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ChineseDictationPage({ params }: DictationPageProps) {
  await requireUserId();
  const { sessionId } = await params;

  if (!isUuid(sessionId)) {
    notFound();
  }

  const session = await loadListenSession(sessionId, "zh");
  if (!session) {
    notFound();
  }

  return <DictationSession session={session} title="中文默書" />;
}
