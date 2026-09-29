import { PageShell } from "@/components/content/page-shell";
import { MistakeReviewForm } from "@/components/dictation/MistakeReviewForm";
import { PaperMistakeForm } from "@/components/dictation/PaperMistakeForm";
import { StrokeButton } from "@/components/dictation/StrokeModal";
import { hanCharacters } from "@/lib/dictation/strokes";
import { requireUserId } from "@/lib/auth/require-user";
import { isMissingSchema } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type MistakesPageProps = {
  searchParams: Promise<{ language?: string | string[]; added?: string | string[] }>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatWrongAt(value: string): string {
  return new Intl.DateTimeFormat("zh-HK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function MistakesPage({ searchParams }: MistakesPageProps) {
  await requireUserId();
  const params = await searchParams;
  const languageParam = firstParam(params.language);
  const language = languageParam === "en" ? "en" : languageParam === "zh" ? "zh" : null;
  const addedCount = Number(firstParam(params.added));
  const supabase = await createClient();
  let lessonQuery = supabase.from("lessons").select("id, title, language").order("updated_at", { ascending: false });
  if (language) {
    lessonQuery = lessonQuery.eq("language", language);
  }
  const { data: lessonOptions } = await lessonQuery;
  let query = supabase
    .from("mistakes")
    .select("id, source_id, language, standard_answer, student_answer, mistake_count, last_wrong_at")
    .eq("active", true)
    .order("last_wrong_at", { ascending: false });

  if (language) {
    query = query.eq("language", language);
  }

  const { data: mistakes, error } = await query;
  const missing = isMissingSchema(error?.code);
  const lessonIds = [...new Set((mistakes ?? []).map((mistake) => mistake.source_id))];
  const { data: lessons } = lessonIds.length
    ? await supabase.from("lessons").select("id, title").in("id", lessonIds)
    : { data: [] };
  const titles = new Map((lessons ?? []).map((lesson) => [lesson.id, lesson.title]));
  const groups = new Map<string, NonNullable<typeof mistakes>>();

  for (const mistake of mistakes ?? []) {
    const group = groups.get(mistake.source_id) ?? [];
    group.push(mistake);
    groups.set(mistake.source_id, group);
  }

  return (
    <PageShell
      title="錯題"
      description="打字答錯會自動記下。紙上默書可以自己貼上原文。答對之後會從清單移走。"
      backHref={language === "en" ? "/english" : language === "zh" ? "/chinese" : "/dashboard"}
      backLabel="返回"
    >
      {Number.isInteger(addedCount) && addedCount > 0 ? (
        <p className="text-base text-success">已加入 {addedCount} 句到錯題。</p>
      ) : null}
      {missing ? null : <PaperMistakeForm lessons={(lessonOptions ?? []).map((lesson) => ({ id: lesson.id, title: lesson.title }))} />}
      {missing ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-base leading-7 text-foreground">
          錯題資料表尚未建立。請在 Supabase SQL Editor 貼上並執行{" "}
          <code>supabase/migrations/20260928180000_mistakes.sql</code> 的內容，不要只貼檔案路徑。
        </p>
      ) : null}
      {error && !missing ? <p className="text-base text-error">錯題暫時讀取不到，請再試一次。</p> : null}
      {!missing && (mistakes ?? []).length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-5 text-base leading-7 text-muted">還沒有錯題。</p>
      ) : null}
      {!missing && (mistakes ?? []).length > 0 && language ? (
        <MistakeReviewForm language={language} lessonId="all" />
      ) : null}
      {[...groups.entries()].map(([sourceId, items]) => {
        const itemLanguage = items[0]?.language === "en" ? "en" : "zh";
        return (
          <article key={sourceId} className="grid gap-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-2xl font-semibold text-foreground">{titles.get(sourceId) ?? "課文"}</h2>
            <ul className="grid gap-3">
              {items.map((mistake) => (
                <li key={mistake.id} className="text-base leading-7 text-foreground">
                  <p>{mistake.standard_answer}</p>
                  <p className="text-muted">你上次寫：{mistake.student_answer}</p>
                  <p className="text-muted">
                    錯了 {mistake.mistake_count} 次，上次 {formatWrongAt(mistake.last_wrong_at)}
                  </p>
                  {itemLanguage === "zh" ? <StrokeButton characters={hanCharacters(mistake.standard_answer)} /> : null}
                </li>
              ))}
            </ul>
            <MistakeReviewForm language={itemLanguage} lessonId={sourceId} />
          </article>
        );
      })}
    </PageShell>
  );
}
