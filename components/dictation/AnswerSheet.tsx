import { StrokePractice } from "@/components/dictation/StrokePractice";
import { paragraphLabel } from "@/lib/content/parse";
import { hanCharacters } from "@/lib/dictation/strokes";
import type { DictationLanguage } from "@/lib/dictation/options";

export function AnswerSheet({
  texts,
  itemUnit,
  language,
  paragraphSortOrders,
}: {
  texts: string[];
  itemUnit: "句" | "個";
  language: DictationLanguage;
  paragraphSortOrders?: (number | null)[];
}) {
  const characters = language === "zh" ? hanCharacters(texts.join("")) : [];

  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold text-foreground">答案</h2>
      <ol className="grid gap-3">
        {texts.map((text, index) => {
          const paragraphSortOrder = paragraphSortOrders?.[index];
          const showParagraph = paragraphSortOrder != null && paragraphSortOrder !== paragraphSortOrders?.[index - 1];
          return (
            <li key={index} className="rounded-2xl border border-border bg-card p-4">
              {showParagraph ? <p className="text-base text-muted">{paragraphLabel(paragraphSortOrder - 1)}</p> : null}
              <p className="text-base text-muted">
                第 {index + 1} {itemUnit}
              </p>
              <p className="mt-1 text-2xl leading-9 break-all text-foreground">{text}</p>
            </li>
          );
        })}
      </ol>
      {characters.length > 0 ? <StrokePractice characters={characters} /> : null}
    </section>
  );
}
