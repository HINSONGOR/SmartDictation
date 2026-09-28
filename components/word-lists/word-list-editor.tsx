"use client";

import { useActionState, useState } from "react";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/auth/button-styles";
import type { ContentLanguage } from "@/lib/database.types";
import { initialActionState } from "@/lib/content/action-state";
import { saveWordListAction } from "@/lib/content/actions";
import { moveItem } from "@/lib/content/parse";

type EditorWord = {
  key: string;
  id: string | null;
  text: string;
};

type WordListEditorProps = {
  language: ContentLanguage;
  listId: string | null;
  initialTitle: string;
  initialItems: { id: string | null; text: string }[];
};

function createKey(): string {
  return crypto.randomUUID();
}

export function WordListEditor({ language, listId, initialTitle, initialItems }: WordListEditorProps) {
  const itemName = language === "zh" ? "詞語" : "英文生字";
  const [title, setTitle] = useState(initialTitle);
  const [paste, setPaste] = useState("");
  const [items, setItems] = useState<EditorWord[]>(
    initialItems.map((item) => ({ ...item, key: item.id ?? createKey() })),
  );
  const [state, formAction, pending] = useActionState(saveWordListAction, initialActionState);

  function appendPasted() {
    const lines = paste
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return;
    }

    setItems((current) => [
      ...current,
      ...lines.map((text) => ({ key: createKey(), id: null, text })),
    ]);
    setPaste("");
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="listId" value={listId ?? ""} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map((item) => ({ id: item.id, text: item.text })))}
      />
      <label className="grid gap-2 text-base font-medium text-foreground" htmlFor="word-list-title">
        標題
        <input
          id="word-list-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          required
          className={inputClass}
        />
      </label>

      <section className="grid gap-3 rounded-2xl border border-border bg-card p-4">
        <label className="grid gap-2 text-base font-medium text-foreground" htmlFor="word-paste">
          {language === "zh" ? "貼上詞語，每行一個" : "貼上生字，每行一個"}
          <textarea
            id="word-paste"
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base leading-7 text-foreground outline-none focus:border-primary"
          />
        </label>
        <button type="button" className={secondaryButtonClass} onClick={appendPasted}>
          加入清單
        </button>
      </section>

      {items.map((item, index) => (
        <section key={item.key} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              第 {index + 1} 個
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButtonClass + " w-auto px-3"}
                onClick={() => setItems((current) => moveItem(current, index, -1))}
                disabled={index === 0}
              >
                上移
              </button>
              <button
                type="button"
                className={secondaryButtonClass + " w-auto px-3"}
                onClick={() => setItems((current) => moveItem(current, index, 1))}
                disabled={index === items.length - 1}
              >
                下移
              </button>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-error bg-card px-3 text-base font-medium text-error"
                onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))}
              >
                刪除
              </button>
            </div>
          </div>
          <input
            value={item.text}
            onChange={(event) =>
              setItems((current) =>
                current.map((entry) => (entry.key === item.key ? { ...entry, text: event.target.value } : entry)),
              )
            }
            maxLength={80}
            aria-label={`${itemName} ${index + 1}`}
            className={inputClass}
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
        onClick={() => setItems((current) => [...current, { key: createKey(), id: null, text: "" }])}
        disabled={items.length >= 200}
      >
        {language === "zh" ? "加一個詞語" : "加一個生字"}
      </button>
      <button type="submit" className={primaryButtonClass} disabled={pending}>
        {pending ? "儲存中…" : "儲存詞語表"}
      </button>
    </form>
  );
}
