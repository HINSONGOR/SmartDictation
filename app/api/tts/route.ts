import { NextResponse } from "next/server";
import { punctuationToSpeech } from "@/lib/dictation/punctuation";
import { loadListenSentence } from "@/lib/dictation/load-session";
import { googleVoice, isDictationSpeed, isDictationVoice, isVoiceForLanguage } from "@/lib/dictation/options";
import { isUuid } from "@/lib/content/parse";
import { audioCacheKey, readCachedAudio, writeCachedAudio } from "@/lib/tts/cache";
import { createTtsProvider } from "@/lib/tts/google";
import { allowTtsRequest } from "@/lib/tts/rate-limit";
import { createClient } from "@/lib/supabase/server";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function readRequest(value: unknown): {
  sessionId: string;
  sentenceIndex: number;
  voice: "zh-HK" | "zh-CN" | "en-GB";
  speed: "0.5" | "0.75" | "1" | "1.25" | "1.5";
} | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const sessionId = record.sessionId;
  const sentenceIndex = record.sentenceIndex;
  const voice = record.voice;
  const speed = record.speed;

  if (typeof sessionId !== "string" || !isUuid(sessionId)) {
    return null;
  }

  if (typeof sentenceIndex !== "number" || !Number.isInteger(sentenceIndex) || sentenceIndex < 0) {
    return null;
  }

  if (!isDictationVoice(voice) || !isDictationSpeed(speed)) {
    return null;
  }

  return { sessionId, sentenceIndex, voice, speed };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return errorResponse("請先登入。", 401);
  }

  if (!allowTtsRequest(data.user.id)) {
    return errorResponse("請求太多，請稍後再試。", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("請求不正確。", 400);
  }

  const parsed = readRequest(body);
  if (!parsed) {
    return errorResponse("請求不正確。", 400);
  }

  const sentence = await loadListenSentence(parsed.sessionId, parsed.sentenceIndex);
  if (!sentence) {
    return errorResponse("找不到這一句。", 404);
  }

  if (!isVoiceForLanguage(parsed.voice, sentence.language)) {
    return errorResponse("請求不正確。", 400);
  }

  const spoken = punctuationToSpeech(sentence.text, sentence.language);
  const voice = googleVoice(parsed.voice);
  const cacheKey = audioCacheKey([spoken, parsed.voice, parsed.speed, voice.name]);
  const cached = await readCachedAudio(cacheKey);
  const audio = cached ?? (await synthesize(spoken, voice.languageCode, voice.name, Number(parsed.speed), cacheKey));

  if (audio instanceof NextResponse) {
    return audio;
  }

  return new Response(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
    },
  });
}

async function synthesize(
  text: string,
  languageCode: string,
  voiceName: string,
  speakingRate: number,
  cacheKey: string,
): Promise<Buffer | NextResponse> {
  try {
    const audio = await createTtsProvider().synthesize({
      text,
      languageCode,
      voiceName,
      speakingRate,
    });
    await writeCachedAudio(cacheKey, audio);
    return audio;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "missing-tts-key") {
      return errorResponse("尚未設定語音服務。請在伺服器的 .env.local 加入 GOOGLE_CLOUD_TTS_API_KEY。", 503);
    }

    if (message === "tts-provider-403" || message === "tts-provider-401") {
      return errorResponse("語音服務拒絕請求。請確認 API key 已啟用 Cloud Text-to-Speech。", 502);
    }

    console.error("TTS synthesis failed", message);
    return errorResponse("語音暫時未能產生，請再試一次。", 502);
  }
}
