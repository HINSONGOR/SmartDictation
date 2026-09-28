import { PageShell } from "@/components/content/page-shell";
import { DictationPlayer } from "@/components/dictation/DictationPlayer";
import { TypingPlayer } from "@/components/dictation/TypingPlayer";
import type { ListenSession } from "@/lib/dictation/load-session";
import { voicesForLanguage } from "@/lib/dictation/options";

export function DictationSession({ session, title }: { session: ListenSession; title: string }) {
  if (session.mode === "typing") {
    return (
      <PageShell
        title={title}
        description="聽完後輸入這一句，標點也要打。對答案後才顯示原文。"
        backHref={session.selectHref}
        backLabel="返回段落選擇"
      >
        <TypingPlayer
          sessionId={session.id}
          title={session.title}
          rangeLabel={session.rangeLabel}
          initialVoice={session.voice}
          initialSpeed={session.speed}
          voices={voicesForLanguage(session.language)}
          cues={session.cues}
          selectHref={session.selectHref}
          answersReady={session.answersReady}
          savedAnswers={session.savedAnswers}
        />
      </PageShell>
    );
  }

  return (
    <PageShell title={title} description="每句播完會停下，不會自動播下一句。" backHref={session.selectHref} backLabel="返回段落選擇">
      <DictationPlayer
        sessionId={session.id}
        title={session.title}
        rangeLabel={session.rangeLabel}
        initialVoice={session.voice}
        initialSpeed={session.speed}
        voices={voicesForLanguage(session.language)}
        cues={session.cues}
        selectHref={session.selectHref}
      />
    </PageShell>
  );
}
