"use client";

import { useActionState } from "react";
import { inputClass, primaryButtonClass } from "@/components/auth/button-styles";
import { initialActionState } from "@/lib/content/action-state";
import { addPaperMistake } from "@/lib/dictation/actions";

export function PaperMistakeForm({ lessons }: { lessons: { id: string; title: string }[] }) {
  const [state, formAction, pending] = useActionState(addPaperMistake, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-2xl font-semibold text-foreground">紙上錯題</h2>
      <p className="text-base leading-7 text-muted">
        在紙上默完後，把打錯的原文貼上。逗號、句號後面會自動分成下一句。學生寫的字只會記在單獨一句。
      </p>
      {lessons.length === 0 ? <p className="text-base text-muted">請先建立課文，再把錯句貼到這裡。</p> : null}
      <label className="grid gap-2 text-base font-medium text-foreground">
        課文
        <select name="lessonId" className={inputClass} required defaultValue="">
          <option value="" disabled>
            請選擇課文
          </option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.title}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-base font-medium text-foreground">
        貼上原文
        <textarea name="standardAnswer" className={`${inputClass} min-h-28 py-3`} required maxLength={4000} />
      </label>
      <label className="grid gap-2 text-base font-medium text-foreground">
        學生寫了什麼（可留空）
        <textarea name="studentAnswer" className={`${inputClass} min-h-20 py-3`} maxLength={4000} />
      </label>
      {state.error ? (
        <p role="alert" className="text-base text-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className={primaryButtonClass} disabled={pending || lessons.length === 0}>
        {pending ? "儲存中…" : "加入錯題"}
      </button>
    </form>
  );
}
