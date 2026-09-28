export const CHINESE_VOICES = ["zh-HK", "zh-CN"] as const;
export const ENGLISH_VOICES = ["en-GB"] as const;
export const DICTATION_SPEEDS = ["0.5", "0.75", "1", "1.25", "1.5"] as const;

export type ChineseVoice = (typeof CHINESE_VOICES)[number];
export type EnglishVoice = (typeof ENGLISH_VOICES)[number];
export type DictationVoice = ChineseVoice | EnglishVoice;
export type DictationLanguage = "zh" | "en";
export type DictationSpeed = (typeof DICTATION_SPEEDS)[number];

export function isChineseVoice(value: unknown): value is ChineseVoice {
  return value === "zh-HK" || value === "zh-CN";
}

export function isEnglishVoice(value: unknown): value is EnglishVoice {
  return value === "en-GB";
}

export function isDictationVoice(value: unknown): value is DictationVoice {
  return isChineseVoice(value) || isEnglishVoice(value);
}

export function isDictationSpeed(value: unknown): value is DictationSpeed {
  return value === "0.5" || value === "0.75" || value === "1" || value === "1.25" || value === "1.5";
}

export function voicesForLanguage(language: DictationLanguage): readonly DictationVoice[] {
  return language === "zh" ? CHINESE_VOICES : ENGLISH_VOICES;
}

export function isVoiceForLanguage(value: unknown, language: DictationLanguage): value is DictationVoice {
  return language === "zh" ? isChineseVoice(value) : isEnglishVoice(value);
}

export function defaultVoice(language: DictationLanguage): DictationVoice {
  return language === "zh" ? "zh-HK" : "en-GB";
}

export function voiceLabel(voice: DictationVoice): string {
  if (voice === "zh-HK") {
    return "廣東話";
  }
  if (voice === "zh-CN") {
    return "普通話";
  }
  return "英語";
}

const GOOGLE_VOICES: Record<DictationVoice, { languageCode: string; name: string }> = {
  "zh-HK": { languageCode: "yue-HK", name: "yue-HK-Standard-A" },
  "zh-CN": { languageCode: "cmn-CN", name: "cmn-CN-Standard-A" },
  "en-GB": { languageCode: "en-GB", name: "en-GB-Standard-A" },
};

export function googleVoice(voice: DictationVoice): { languageCode: string; name: string } {
  return GOOGLE_VOICES[voice];
}
