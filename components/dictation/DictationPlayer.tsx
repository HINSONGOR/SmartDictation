"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { secondaryButtonClass } from "@/components/auth/button-styles";
import { DictationControls } from "@/components/dictation/DictationControls";
import { SentenceProgress } from "@/components/dictation/SentenceProgress";
import { SpeedSelector } from "@/components/dictation/SpeedSelector";
import { VoiceSelector } from "@/components/dictation/VoiceSelector";
import type { DictationSpeed, DictationVoice } from "@/lib/dictation/options";

type Phase = "idle" | "loading" | "playing" | "paused" | "ended";

type DictationPlayerProps = {
  sessionId: string;
  title: string;
  rangeLabel: string;
  initialVoice: DictationVoice;
  initialSpeed: DictationSpeed;
  voices: readonly DictationVoice[];
  cues: { paragraphSortOrder: number | null }[];
  itemUnit?: "句" | "個";
  selectHref: string;
};

function readError(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return "語音暫時未能產生，請再試一次。";
  }

  const message = payload.error;
  return typeof message === "string" ? message : "語音暫時未能產生，請再試一次。";
}

export function DictationPlayer({
  sessionId,
  title,
  rangeLabel,
  initialVoice,
  initialSpeed,
  voices,
  cues,
  itemUnit = "句",
  selectHref,
}: DictationPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef(new Map<string, string>());
  const ignoreEndedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [voice, setVoice] = useState(initialVoice);
  const [speed, setSpeed] = useState(initialSpeed);
  const [error, setError] = useState<string | null>(null);
  const current = cues[index];
  const finished = phase === "ended" && index === cues.length - 1 && cues.length > 0;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    const onEnded = () => {
      if (ignoreEndedRef.current) {
        return;
      }
      setPhase("ended");
    };
    audio.addEventListener("ended", onEnded);
    audioRef.current = audio;

    const urls = urlsRef.current;
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      for (const url of urls.values()) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
      audioRef.current = null;
    };
  }, []);

  async function loadUrl(sentenceIndex: number, nextVoice: DictationVoice, nextSpeed: DictationSpeed) {
    const cacheId = `${sentenceIndex}:${nextVoice}:${nextSpeed}`;
    const existing = urlsRef.current.get(cacheId);
    if (existing) {
      return existing;
    }

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        sentenceIndex,
        voice: nextVoice,
        speed: nextSpeed,
      }),
    });

    if (!response.ok) {
      throw new Error(readError(await response.json().catch(() => null)));
    }

    const url = URL.createObjectURL(await response.blob());
    urlsRef.current.set(cacheId, url);
    return url;
  }

  function unlockAudio(audio: HTMLAudioElement) {
    if (audio.dataset.unlocked === "true") {
      return;
    }

    audio.dataset.unlocked = "true";
    ignoreEndedRef.current = true;
    audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    void audio.play().catch(() => undefined);
  }

  async function playSentence(sentenceIndex: number) {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    unlockAudio(audio);
    setError(null);
    setPhase("loading");
    try {
      const url = await loadUrl(sentenceIndex, voice, speed);
      if (audio.src !== url) {
        audio.src = url;
      } else {
        audio.currentTime = 0;
      }
      ignoreEndedRef.current = false;
      await audio.play();
      setPhase("playing");
    } catch (playError) {
      if (playError instanceof DOMException && playError.name === "NotAllowedError") {
        setPhase("idle");
        setError("請再按一次播放。");
        return;
      }

      setPhase("idle");
      setError(playError instanceof Error ? playError.message : "語音暫時未能產生，請再試一次。");
    }
  }

  function pause() {
    audioRef.current?.pause();
    setPhase("paused");
  }

  function goTo(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= cues.length) {
      return;
    }

    audioRef.current?.pause();
    setIndex(nextIndex);
    void playSentence(nextIndex);
  }

  if (!current) {
    return <p className="text-base leading-7 text-foreground">這段沒有可播放的句子。</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-base text-muted">{title}</p>
        <p className="mt-1 text-base text-muted">{rangeLabel}</p>
        <div className="mt-4">
          <SentenceProgress index={index} total={cues.length} paragraphSortOrder={current.paragraphSortOrder} unit={itemUnit} />
        </div>
        <p className="mt-4 text-base text-foreground">
          {phase === "loading" ? "正在準備語音" : phase === "playing" ? "正在播放" : phase === "ended" ? "播放完成" : "準備播放"}
        </p>
      </div>

      {finished ? (
        <div className="grid gap-3">
          <p className="text-center text-2xl font-semibold text-foreground">
            {rangeLabel === "全課" ? "全課完成" : "本段完成"}
          </p>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => {
              setIndex(0);
              setPhase("idle");
              setError(null);
            }}
          >
            再默一次
          </button>
          <Link href={selectHref} className={secondaryButtonClass}>
            返回段落選擇
          </Link>
        </div>
      ) : (
        <DictationControls
          phase={phase}
          canGoPrevious={index > 0}
          canGoNext={index < cues.length - 1}
          onPlay={() => {
            if (phase === "paused") {
              void audioRef.current
                ?.play()
                .then(() => setPhase("playing"))
                .catch(() => setError("請再按一次播放。"));
              return;
            }
            void playSentence(index);
          }}
          onPause={pause}
          onReplay={() => void playSentence(index)}
          onPrevious={() => goTo(index - 1)}
          onNext={() => goTo(index + 1)}
        />
      )}

      {error ? (
        <p role="alert" className="text-base text-error">
          {error}
        </p>
      ) : null}

      <VoiceSelector
        value={voice}
        voices={voices}
        onChange={(nextVoice) => {
          audioRef.current?.pause();
          setVoice(nextVoice);
          setPhase("idle");
        }}
      />
      <SpeedSelector
        value={speed}
        onChange={(nextSpeed) => {
          audioRef.current?.pause();
          setSpeed(nextSpeed);
          setPhase("idle");
        }}
      />
    </div>
  );
}
