import { paragraphLabel } from "@/lib/content/parse";

export function SentenceProgress({
  index,
  total,
  paragraphSortOrder,
  unit = "句",
}: {
  index: number;
  total: number;
  paragraphSortOrder: number | null;
  unit?: "句" | "個";
}) {
  return (
    <div className="grid gap-1 text-center">
      {paragraphSortOrder === null ? null : (
        <p className="text-base text-muted">{paragraphLabel(paragraphSortOrder - 1)}</p>
      )}
      <p className="text-3xl font-semibold text-foreground">
        第 {index + 1} / {total} {unit}
      </p>
    </div>
  );
}
