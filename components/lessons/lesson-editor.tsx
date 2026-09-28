"use client";

import { useActionState, useState } from "react";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/auth/button-styles";
import type { ContentLanguage } from "@/lib/database.types";
import { initialActionState } from "@/lib/content/action-state";
import { saveLessonAction } from "@/lib/content/actions";
import { moveItem, paragraphLabel } from "@/lib/content/parse";

type EditorParagraph = {
  key: string;
  id: string | null;
  content: string;
};

type LessonEditorProps = {
  language: ContentLanguage;
  lessonId: string | null;
  initialTitle: string;
  initialParagraphs: { id: string | null; content: string }[];
};

function createKey(): string {
  return crypto.randomUUID();
}

export function LessonEditor({ language, lessonId, initialTitle, initialParagraphs }: LessonEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [paragraphs, setParagraphs] = useState<EditorParagraph[]>(
    initialParagraphs.map((paragraph) => ({ ...paragraph, key: paragraph.id ?? createKey() })),
  );
  const [state, formAction, pending] = useActionState(saveLessonAction, initialActionState);

  function updateContent(key: string, content: string) {
    setParagraphs((current) =>
      current.map((paragraph) => (paragraph.key === key ? { ...paragraph, content } : paragraph)),
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="lessonId" value={lessonId ?? ""} />
      <input
        type="hidden"
        name="paragraphs"
        value={JSON.stringify(paragraphs.map((paragraph) => ({ id: paragraph.id, content: paragraph.content })))}
      />
      <label className="grid gap-2 text-base font-medium text-foreground" htmlFor="lesson-title">
        課文標題
        <input
          id="lesson-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          required
          className={inputClass}
        />
      </label>

      {paragraphs.map((paragraph, index) => (
        <section key={paragraph.key} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">{paragraphLabel(index)}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButtonClass + " w-auto px-3"}
                onClick={() => setParagraphs((current) => moveItem(current, index, -1))}
                disabled={index === 0}
              >
                上移
              </button>
              <button
                type="button"
                className={secondaryButtonClass + " w-auto px-3"}
                onClick={() => setParagraphs((current) => moveItem(current, index, 1))}
                disabled={index === paragraphs.length - 1}
              >
                下移
              </button>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-error bg-card px-3 text-base font-medium text-error disabled:opacity-60"
                onClick={() =>
                  setParagraphs((current) => current.filter((item) => item.key !== paragraph.key))
                }
                disabled={paragraphs.length === 1}
              >
                刪除此段
              </button>
            </div>
          </div>
          <textarea
            value={paragraph.content}
            onChange={(event) => updateContent(paragraph.key, event.target.value)}
            rows={5}
            maxLength={4000}
            aria-label={paragraphLabel(index)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base leading-7 text-foreground outline-none focus:border-primary"
          />
        </section>
      ))}

      {state.error ? (
        <p role="alert" className="text-base text-error">
          {state.error}
        </p>
      ) : null}

      <button
        type="button"
        className={secondaryButtonClass}
        onClick={() =>
          setParagraphs((current) => [...current, { key: createKey(), id: null, content: "" }])
        }
        disabled={paragraphs.length >= 30}
      >
        新增一段
      </button>
      <button type="submit" className={primaryButtonClass} disabled={pending}>
        {pending ? "儲存中…" : "儲存課文"}
      </button>
    </form>
  );
}
