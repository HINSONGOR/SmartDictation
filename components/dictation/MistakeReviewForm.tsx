"use client";

import { useActionState } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/auth/button-styles";
import { initialActionState } from "@/lib/content/action-state";
import { startMistakeReview } from "@/lib/dictation/actions";
import type { DictationLanguage } from "@/lib/dictation/options";

export function MistakeReviewForm({ language, lessonId }: { language: DictationLanguage; lessonId: string }) {
  const [state, formAction, pending] = useActionState(startMistakeReview, initialActionState);

  return (
    <form action={formAction} className="grid gap-2">
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <div className="grid grid-cols-2 gap-2">
        <button type="submit" name="mode" value="listen" className={secondaryButtonClass} disabled={pending}>
          聆聽重溫
        </button>
        <button type="submit" name="mode" value="typing" className={primaryButtonClass} disabled={pending}>
          打字重溫
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-base text-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
