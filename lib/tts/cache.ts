import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cacheDirectory = path.join(process.cwd(), ".data", "tts");

export function audioCacheKey(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\n")).digest("hex");
}

async function readBlob(key: string): Promise<Buffer | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const stored = await getStore("tts").get(key, { type: "arrayBuffer" });
    return stored ? Buffer.from(stored) : null;
  } catch {
    return null;
  }
}

async function writeBlob(key: string, audio: Buffer): Promise<boolean> {
  try {
    const { getStore } = await import("@netlify/blobs");
    const bytes = new ArrayBuffer(audio.byteLength);
    new Uint8Array(bytes).set(audio);
    await getStore("tts").set(key, bytes);
    return true;
  } catch {
    return false;
  }
}

export async function readCachedAudio(key: string): Promise<Buffer | null> {
  const blob = await readBlob(key);
  if (blob) {
    return blob;
  }

  try {
    return await readFile(path.join(cacheDirectory, `${key}.mp3`));
  } catch {
    return null;
  }
}

export async function writeCachedAudio(key: string, audio: Buffer): Promise<void> {
  if (await writeBlob(key, audio)) {
    return;
  }

  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(path.join(cacheDirectory, `${key}.mp3`), audio);
}
