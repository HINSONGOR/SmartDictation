export type TtsRequest = {
  text: string;
  languageCode: string;
  voiceName: string;
  speakingRate: number;
};

export interface TtsProvider {
  synthesize(request: TtsRequest): Promise<Buffer>;
}
