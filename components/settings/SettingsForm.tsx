"use client";

import { useEffect, useState } from "react";
import { ModeSelector } from "@/components/dictation/ModeSelector";
import { SpeedSelector } from "@/components/dictation/SpeedSelector";
import { VoiceSelector } from "@/components/dictation/VoiceSelector";
import { ThemePicker } from "@/components/theme/ThemePicker";
import { readDictationPrefs, voiceStorageKey, writeDictationPrefs, type DictationMode } from "@/lib/dictation/preferences";
import { voicesForLanguage, type DictationSpeed, type DictationVoice } from "@/lib/dictation/options";
import { saveVoiceZh } from "@/lib/theme/actions";
import type { ThemeName } from "@/lib/theme/themes";

export function SettingsForm({
  initialTheme,
  themeSaved,
  savedVoice,
}: {
  initialTheme: ThemeName;
  themeSaved: boolean;
  savedVoice: DictationVoice | null;
}) {
  const [voice, setVoice] = useState<DictationVoice>("zh-HK");
  const [speed, setSpeed] = useState<DictationSpeed>("1");
  const [mode, setMode] = useState<DictationMode>("listen");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prefs = readDictationPrefs("zh");
    const hasVoice = window.localStorage.getItem(voiceStorageKey("zh"));
    const voice = !hasVoice && savedVoice ? savedVoice : prefs.voice;
    if (!hasVoice && savedVoice) {
      writeDictationPrefs("zh", { ...prefs, voice: savedVoice });
    }
    setVoice(voice);
    setSpeed(prefs.speed);
    setMode(prefs.mode);
    setReady(true);
  }, [savedVoice]);

  function rememberVoice(nextVoice: DictationVoice) {
    setVoice(nextVoice);
    const prefs = { voice: nextVoice, speed, mode };
    writeDictationPrefs("zh", prefs);
    writeDictationPrefs("en", { ...readDictationPrefs("en"), speed, mode });
    void saveVoiceZh(nextVoice);
  }

  function rememberSpeed(nextSpeed: DictationSpeed) {
    setSpeed(nextSpeed);
    writeDictationPrefs("zh", { voice, speed: nextSpeed, mode });
    writeDictationPrefs("en", { ...readDictationPrefs("en"), speed: nextSpeed, mode });
  }

  function rememberMode(nextMode: DictationMode) {
    setMode(nextMode);
    writeDictationPrefs("zh", { voice, speed, mode: nextMode });
    writeDictationPrefs("en", { ...readDictationPrefs("en"), speed, mode: nextMode });
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold text-foreground">主題</h2>
        <ThemePicker initialTheme={initialTheme} saved={themeSaved} />
      </section>
      {ready ? (
        <>
          <VoiceSelector value={voice} voices={voicesForLanguage("zh")} onChange={rememberVoice} />
          <p className="text-base text-muted">英文默書使用英語語音。</p>
          <SpeedSelector value={speed} onChange={rememberSpeed} />
          <ModeSelector value={mode} onChange={rememberMode} />
        </>
      ) : (
        <p className="text-base text-muted">正在讀取設定…</p>
      )}
    </div>
  );
}
