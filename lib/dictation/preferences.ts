import {
  defaultVoice,
  isDictationSpeed,
  isVoiceForLanguage,
  type DictationLanguage,
  type DictationSpeed,
  type DictationVoice,
} from "@/lib/dictation/options";

export const voiceStorageKey = (language: DictationLanguage) =>
  language === "zh" ? "smartdictation.voiceZh" : "smartdictation.voiceEn";
export const speedStorageKey = "smartdictation.speed";
export const modeStorageKey = "smartdictation.mode";

export type DictationMode = "listen" | "typing";

export type DictationPrefs = {
  voice: DictationVoice;
  speed: DictationSpeed;
  mode: DictationMode;
};

export function readDictationPrefs(language: DictationLanguage): DictationPrefs {
  const storedVoice = window.localStorage.getItem(voiceStorageKey(language));
  const storedSpeed = window.localStorage.getItem(speedStorageKey);
  const storedMode = window.localStorage.getItem(modeStorageKey);

  return {
    voice: isVoiceForLanguage(storedVoice, language) ? storedVoice : defaultVoice(language),
    speed: isDictationSpeed(storedSpeed) ? storedSpeed : "1",
    mode: storedMode === "typing" ? "typing" : "listen",
  };
}

export function writeDictationPrefs(language: DictationLanguage, prefs: DictationPrefs) {
  window.localStorage.setItem(voiceStorageKey(language), prefs.voice);
  window.localStorage.setItem(speedStorageKey, prefs.speed);
  window.localStorage.setItem(modeStorageKey, prefs.mode);
}

export function modeLabel(mode: DictationMode): string {
  return mode === "typing" ? "打字默書" : "聆聽默書";
}
