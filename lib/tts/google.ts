import type { TtsProvider, TtsRequest } from "@/lib/tts/provider";

export class GoogleCloudTtsProvider implements TtsProvider {
  constructor(private readonly apiKey: string) {}

  async synthesize(request: TtsRequest): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error("missing-tts-key");
    }

    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        input: { text: request.text },
        voice: {
          languageCode: request.languageCode,
          name: request.voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: request.speakingRate,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`tts-provider-${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("audioContent" in payload)) {
      throw new Error("tts-empty-audio");
    }

    const audioContent = payload.audioContent;
    if (typeof audioContent !== "string" || audioContent.length === 0) {
      throw new Error("tts-empty-audio");
    }

    return Buffer.from(audioContent, "base64");
  }
}

export function createTtsProvider(): TtsProvider {
  return new GoogleCloudTtsProvider(process.env.GOOGLE_CLOUD_TTS_API_KEY ?? "");
}
