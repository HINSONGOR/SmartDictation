import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cacheDirectory = path.join(process.cwd(), ".data", "tts");

export function audioCacheKey(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\n")).digest("hex");
}

export async function readCachedAudio(key: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(cacheDirectory, `${key}.mp3`));
  } catch {
    return null;
  }
}

export async function writeCachedAudio(key: string, audio: Buffer): Promise<void> {
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(path.join(cacheDirectory, `${key}.mp3`), audio);
}
