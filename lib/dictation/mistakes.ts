import { createHash } from "node:crypto";
import type { DictationLanguage } from "@/lib/dictation/options";
import { isMissingSchema } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

export function mistakeAnswerKey(standardAnswer: string): string {
  return createHash("sha256").update(standardAnswer).digest("hex");
}

type MistakeWrite = {
  ownerId: string;
  studentId: string;
  language: DictationLanguage;
  sourceId: string;
  sourceType?: "lesson" | "word_list";
  standardAnswer: string;
  studentAnswer: string;
  correct: boolean;
};

export async function recordMistake(input: MistakeWrite): Promise<"saved" | "missing" | "failed"> {
  const supabase = await createClient();
  const answerKey = mistakeAnswerKey(input.standardAnswer);
  const { data: existing, error: readError } = await supabase
    .from("mistakes")
    .select("id, mistake_count")
    .eq("student_id", input.studentId)
    .eq("source_id", input.sourceId)
    .eq("answer_key", answerKey)
    .maybeSingle();

  if (isMissingSchema(readError?.code)) {
    return "missing";
  }

  if (readError) {
    return "failed";
  }

  if (input.correct) {
    if (!existing) {
      return "saved";
    }
    const { error } = await supabase.from("mistakes").update({ active: false }).eq("id", existing.id);
    return error ? "failed" : "saved";
  }

  if (!existing) {
    const { error } = await supabase.from("mistakes").insert({
      owner_id: input.ownerId,
      student_id: input.studentId,
      language: input.language,
      source_type: input.sourceType ?? "lesson",
      source_id: input.sourceId,
      answer_key: answerKey,
      standard_answer: input.standardAnswer,
      student_answer: input.studentAnswer,
      mistake_count: 1,
      active: true,
      last_wrong_at: new Date().toISOString(),
    });
    if (isMissingSchema(error?.code)) {
      return "missing";
    }
    return error ? "failed" : "saved";
  }

  const { error } = await supabase
    .from("mistakes")
    .update({
      student_answer: input.studentAnswer,
      mistake_count: existing.mistake_count + 1,
      active: true,
      last_wrong_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  return error ? "failed" : "saved";
}
