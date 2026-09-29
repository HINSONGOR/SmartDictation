"use client";

import { useActionState, useEffect, useState } from "react";
import { primaryButtonClass } from "@/components/auth/button-styles";
import { ModeSelector } from "@/components/dictation/ModeSelector";
import { SpeedSelector } from "@/components/dictation/SpeedSelector";
import { VoiceSelector } from "@/components/dictation/VoiceSelector";
import { initialActionState } from "@/lib/content/action-state";
import { startWordListDictation } from "@/lib/dictation/actions";
import {
  isDictationSpeed,
  isVoiceForLanguage,
  voicesForLanguage,
  type DictationLanguage,
  type DictationSpeed,
  type DictationVoice,
} from "@/lib/dictation/options";

const speedStorageKey = "smartdictation.speed";
const modeStorageKey = "smartdictation.mode";

export function WordDictationSetup({
  listId,
  language,
  itemCount,
  savedVoice,
}: {
  listId: string;
  language: DictationLanguage;
  itemCount: number;
  savedVoice: DictationVoice;
}) {
  const voices = voicesForLanguage(language);
  const voiceStorageKey = language === "zh" ? "smartdictation.voiceZh" : "smartdictation.voiceEn";
  const [voice, setVoice] = useState<DictationVoice>(savedVoice);
  const [speed, setSpeed] = useState<DictationSpeed>("1");
  const [mode, setMode] = useState<"" | "listen" | "typing">("");
  const [state, formAction, pending] = useActionState(startWordListDictation, initialActionState);

  useEffect(() => {
    const storedVoice = window.localStorage.getItem(voiceStorageKey);
    const storedSpeed = window.localStorage.getItem(speedStorageKey);
    const storedMode = window.localStorage.getItem(modeStorageKey);
    if (isVoiceForLanguage(storedVoice, language)) {
      setVoice(storedVoice);
    }
    if (isDictationSpeed(storedSpeed)) {
      setSpeed(storedSpeed);
    }
    if (storedMode === "listen" || storedMode === "typing") {
      setMode(storedMode);
    }
  }, [language, voiceStorageKey]);

  function rememberVoice(nextVoice: DictationVoice) {
    setVoice(nextVoice);
    window.localStorage.setItem(voiceStorageKey, nextVoice);
  }

  function rememberSpeed(nextSpeed: DictationSpeed) {
    setSpeed(nextSpeed);
    window.localStorage.setItem(speedStorageKey, nextSpeed);
  }

  function rememberMode(nextMode: "listen" | "typing") {
    setMode(nextMode);
    window.localStorage.setItem(modeStorageKey, nextMode);
  }

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="language" value={language} />
      <ModeSelector value={mode} onChange={rememberMode} />
      <VoiceSelector value={voice} voices={voices} onChange={rememberVoice} />
      <SpeedSelector value={speed} onChange={rememberSpeed} />
      <p className="text-base leading-7 text-muted">
        {mode === "typing"
          ? "播放時不會顯示原文。每個詞語播完會停下。聽完後輸入，再按下一個。"
          : "播放時不會顯示原文。每個詞語播完會停下。請重播默完，再按下一個。"}
      </p>
      {state.error ? (
        <p role="alert" className="text-base text-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={primaryButtonClass} disabled={pending || itemCount === 0}>
        {pending ? "開始中…" : "開始默書"}
      </button>
    </form>
  );
}
