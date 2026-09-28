export function ModeSelector({ value, onChange }: { value: "" | "listen" | "typing"; onChange: (mode: "listen" | "typing") => void }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-xl font-semibold text-foreground">默書方式</legend>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-base text-foreground">
        <input
          className="size-5"
          type="radio"
          name="mode"
          value="listen"
          checked={value === "listen"}
          onChange={() => onChange("listen")}
          required
        />
        聆聽默書
      </label>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-base text-foreground">
        <input
          className="size-5"
          type="radio"
          name="mode"
          value="typing"
          checked={value === "typing"}
          onChange={() => onChange("typing")}
          required
        />
        打字默書
      </label>
    </fieldset>
  );
}
