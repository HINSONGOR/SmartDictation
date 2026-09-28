import { paragraphLabel } from "@/lib/content/parse";

export function ParagraphSelector({ sortOrders }: { sortOrders: number[] }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-xl font-semibold text-foreground">請選擇默書範圍</legend>
      {sortOrders.map((order) => (
        <label
          key={order}
          className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-base text-foreground"
        >
          <input className="size-5" type="radio" name="range" value={String(order)} required />
          {paragraphLabel(order - 1)}
        </label>
      ))}
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 text-base text-foreground">
        <input className="size-5" type="radio" name="range" value="all" required />
        全課默書
      </label>
    </fieldset>
  );
}
