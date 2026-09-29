"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { initialActionState } from "@/lib/content/action-state";
import { startWordListDictation } from "@/lib/dictation/actions";
import { readDictationPrefs, type DictationPrefs } from "@/lib/dictation/preferences";
import { defaultVoice, type DictationLanguage } from "@/lib/dictation/options";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 text-base font-medium text-primary-foreground disabled:opacity-60"
      disabled={pending || disabled}
    >
      {pending ? "開始中…" : "開始默書"}
    </button>
  );
}

export function StartWordListButton({
  listId,
  language,
  itemCount,
}: {
  listId: string;
  language: DictationLanguage;
  itemCount: number;
}) {
  const [prefs, setPrefs] = useState<DictationPrefs>({
    voice: defaultVoice(language),
    speed: "1",
    mode: "listen",
  });
  const [state, formAction] = useActionState(startWordListDictation, initialActionState);

  useEffect(() => {
    setPrefs(readDictationPrefs(language));
  }, [language]);

  return (
    <form action={formAction}>
      <input type="hidden" name="listId" value={listId} />
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="voice" value={prefs.voice} />
      <input type="hidden" name="speed" value={prefs.speed} />
      <input type="hidden" name="mode" value={prefs.mode} />
      <SubmitButton disabled={itemCount === 0} />
      {state.error ? (
        <p role="alert" className="mt-2 text-base text-error">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
