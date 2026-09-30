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
        description={session.itemUnit === "個" ? "聽完後輸入這個詞語。對答案後才顯示原文。" : "聽完後輸入這一句，標點也要打。對答案後才顯示原文。"}
        backHref={session.selectHref}
        backLabel={session.backLabel}
      >
        <TypingPlayer
          sessionId={session.id}
          title={session.title}
          rangeLabel={session.rangeLabel}
          language={session.language}
          initialVoice={session.voice}
          initialSpeed={session.speed}
          voices={voicesForLanguage(session.language)}
          cues={session.cues}
          itemUnit={session.itemUnit}
          selectHref={session.selectHref}
          answersReady={session.answersReady}
          savedAnswers={session.savedAnswers}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={title}
      description={
        session.itemUnit === "個"
          ? "每個詞語播完會停下。最後一個播完會顯示答案。"
          : session.language === "zh"
            ? "每句播完會停下。最後一句播完會顯示答案和筆劃。"
            : "每句播完會停下。最後一句播完會顯示答案。"
      }
      backHref={session.selectHref}
      backLabel={session.backLabel}
    >
      <DictationPlayer
        sessionId={session.id}
        title={session.title}
        rangeLabel={session.rangeLabel}
        language={session.language}
        initialVoice={session.voice}
        initialSpeed={session.speed}
        voices={voicesForLanguage(session.language)}
        cues={session.cues}
        itemUnit={session.itemUnit}
        selectHref={session.selectHref}
      />
    </PageShell>
  );
}
