"use client";

import { useState } from "react";
import { deleteLessonAction, deleteWordListAction } from "@/lib/content/actions";

const dangerButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-error bg-card px-4 text-base font-medium text-error";

const quietButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-secondary px-4 text-base font-medium text-foreground";

type ConfirmDeleteProps =
  | { kind: "lesson"; id: string; language: "zh" | "en" }
  | { kind: "word-list"; id: string; language: "zh" | "en" };

export function ConfirmDelete(props: ConfirmDeleteProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className={dangerButtonClass} onClick={() => setConfirming(true)}>
        刪除
      </button>
    );
  }

  return (
    <form action={props.kind === "lesson" ? deleteLessonAction : deleteWordListAction} className="flex flex-wrap gap-2">
      <input type="hidden" name="id" value={props.id} />
      <input type="hidden" name="language" value={props.language} />
      <button type="submit" className={dangerButtonClass}>
        確認刪除
      </button>
      <button type="button" className={quietButtonClass} onClick={() => setConfirming(false)}>
        取消
      </button>
    </form>
  );
}
