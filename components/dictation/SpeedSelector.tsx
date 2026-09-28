import { DICTATION_SPEEDS, type DictationSpeed } from "@/lib/dictation/options";

export function SpeedSelector({
  value,
  onChange,
}: {
  value: DictationSpeed;
  onChange: (speed: DictationSpeed) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-xl font-semibold text-foreground">速度</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {DICTATION_SPEEDS.map((speed) => (
          <label
            key={speed}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-base text-foreground"
          >
            <input
              className="size-5"
              type="radio"
              name="speed"
              value={speed}
              checked={value === speed}
              onChange={() => onChange(speed)}
              required
            />
            {speed}x
          </label>
        ))}
      </div>
    </fieldset>
  );
}
