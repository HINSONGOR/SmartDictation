"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { ParagraphSelector } from "@/components/dictation/ParagraphSelector";
import { initialActionState } from "@/lib/content/action-state";
import { startLessonDictation } from "@/lib/dictation/actions";
import { modeLabel, readDictationPrefs, type DictationPrefs } from "@/lib/dictation/preferences";
import { defaultVoice, voiceLabel, type DictationLanguage } from "@/lib/dictation/options";

export function DictationSetup({
  lessonId,
  language,
  sortOrders,
}: {
  lessonId: string;
  language: DictationLanguage;
  sortOrders: number[];
}) {
  const [prefs, setPrefs] = useState<DictationPrefs>({
    voice: defaultVoice(language),
    speed: "1",
    mode: "listen",
  });
  const [state, formAction, pending] = useActionState(startLessonDictation, initialActionState);

  useEffect(() => {
    setPrefs(readDictationPrefs(language));
  }, [language]);

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="voice" value={prefs.voice} />
      <input type="hidden" name="speed" value={prefs.speed} />
      <input type="hidden" name="mode" value={prefs.mode} />
      <ParagraphSelector sortOrders={sortOrders} />
      <p className="text-base leading-7 text-muted">
        使用設定：{voiceLabel(prefs.voice)}、速度 {prefs.speed}、{modeLabel(prefs.mode)}。
        <Link className="ml-2 text-primary" href="/settings">
          更改設定
        </Link>
      </p>
      {state.error ? (
        <p role="alert" className="text-base text-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={primaryButtonClass} disabled={pending || sortOrders.length === 0}>
        {pending ? "開始中…" : "開始默書"}
      </button>
    </form>
  );
}
