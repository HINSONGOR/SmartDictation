import { voiceLabel, type DictationVoice } from "@/lib/dictation/options";

export function VoiceSelector({
  value,
  voices,
  onChange,
}: {
  value: DictationVoice;
  voices: readonly DictationVoice[];
  onChange: (voice: DictationVoice) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-xl font-semibold text-foreground">語音</legend>
      {voices.map((voice) => (
        <label
          key={voice}
          className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-base text-foreground"
        >
          <input
            className="size-5"
            type="radio"
            name="voice"
            value={voice}
            checked={value === voice}
            onChange={() => onChange(voice)}
            required
          />
          {voiceLabel(voice)}
        </label>
      ))}
    </fieldset>
  );
}
