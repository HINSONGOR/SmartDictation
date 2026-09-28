import { paragraphLabel } from "@/lib/content/parse";

export function SentenceProgress({
  index,
  total,
  paragraphSortOrder,
}: {
  index: number;
  total: number;
  paragraphSortOrder: number | null;
}) {
  return (
    <div className="grid gap-1 text-center">
      {paragraphSortOrder === null ? null : (
        <p className="text-base text-muted">{paragraphLabel(paragraphSortOrder - 1)}</p>
      )}
      <p className="text-3xl font-semibold text-foreground">
        第 {index + 1} / {total} 句
      </p>
    </div>
  );
}
