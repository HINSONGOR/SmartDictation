"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/auth/button-styles";
import { AnswerSheet } from "@/components/dictation/AnswerSheet";
import { SentenceProgress } from "@/components/dictation/SentenceProgress";
import { SpeedSelector } from "@/components/dictation/SpeedSelector";
import { VoiceSelector } from "@/components/dictation/VoiceSelector";
import { StrokeButton } from "@/components/dictation/StrokeModal";
import { submitTypingAnswer, type TypingCheckResult } from "@/lib/dictation/actions";
import { wrongHanCharacters } from "@/lib/dictation/strokes";
import type { SavedTypingAnswer } from "@/lib/dictation/load-session";
import type { DictationLanguage, DictationSpeed, DictationVoice } from "@/lib/dictation/options";

type Phase = "idle" | "loading" | "playing" | "paused" | "ended";

type TypingPlayerProps = {
  sessionId: string;
  title: string;
  rangeLabel: string;
  language: DictationLanguage;
  initialVoice: DictationVoice;
  initialSpeed: DictationSpeed;
  voices: readonly DictationVoice[];
  cues: { paragraphSortOrder: number | null }[];
  itemUnit?: "句" | "個";
  selectHref: string;
  answersReady: boolean;
  savedAnswers: SavedTypingAnswer[];
};

function readError(payload: unknown): string {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return "語音暫時未能產生，請再試一次。";
  }
  const message = payload.error;
  return typeof message === "string" ? message : "語音暫時未能產生，請再試一次。";
}

function MarkedText({ text, mismatches }: { text: string; mismatches: number[] }) {
  const characters = Array.from(text);
  const wrong = new Set(mismatches);
  if (characters.length === 0) {
    return <p className="text-base text-muted">（空白）</p>;
  }

  return (
    <p className="text-lg leading-8 break-all text-foreground">
      {characters.map((character, index) => (
        <span key={index} className={wrong.has(index) ? "font-semibold text-error" : undefined}>
          {character}
        </span>
      ))}
    </p>
  );
}

export function TypingPlayer({
  sessionId,
  title,
  rangeLabel,
  language,
  initialVoice,
  initialSpeed,
  voices,
  cues,
  itemUnit = "句",
  selectHref,
  answersReady,
  savedAnswers,
}: TypingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlsRef = useRef(new Map<string, string>());
  const ignoreEndedRef = useRef(false);
  const [answers, setAnswers] = useState(() => new Map(savedAnswers.map((answer) => [answer.itemIndex, answer])));
  const [index, setIndex] = useState(() => {
    const saved = new Set(savedAnswers.map((answer) => answer.itemIndex));
    const open = cues.findIndex((_, cueIndex) => !saved.has(cueIndex));
    return open === -1 ? 0 : open;
  });
  const [draft, setDraft] = useState(() => savedAnswers.find((answer) => answer.itemIndex === 0)?.studentAnswer ?? "");
  const [phase, setPhase] = useState<Phase>("idle");
  const [voice, setVoice] = useState(initialVoice);
  const [speed, setSpeed] = useState(initialSpeed);
  const [error, setError] = useState<string | null>(
    answersReady
      ? null
      : "答案資料表尚未建立。請在 Supabase SQL Editor 貼上並執行 supabase/migrations/20260928170000_typing_answers.sql 的內容。",
  );
  const [checking, setChecking] = useState(false);
  const [finished, setFinished] = useState(savedAnswers.length > 0 && savedAnswers.length === cues.length);
  const [summary, setSummary] = useState<Pick<TypingCheckResult, "correctCount" | "total" | "accuracy"> | null>(
    finishedFrom(savedAnswers, cues.length),
  );
  const current = cues[index];
  const result = answers.get(index);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.setAttribute("playsinline", "true");
    const onEnded = () => {
      if (!ignoreEndedRef.current) {
        setPhase("ended");
      }
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

  useEffect(() => {
    setDraft(answers.get(index)?.studentAnswer ?? "");
  }, [answers, index]);

  async function loadUrl(sentenceIndex: number, nextVoice: DictationVoice, nextSpeed: DictationSpeed) {
    const cacheId = `${sentenceIndex}:${nextVoice}:${nextSpeed}`;
    const existing = urlsRef.current.get(cacheId);
    if (existing) {
      return existing;
    }

    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, sentenceIndex, voice: nextVoice, speed: nextSpeed }),
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
    setError(answersReady ? null : error);
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
      setPhase("idle");
      if (playError instanceof DOMException && playError.name === "NotAllowedError") {
        setError("請再按一次播放。");
        return;
      }
      setError(playError instanceof Error ? playError.message : "語音暫時未能產生，請再試一次。");
    }
  }

  function showIndex(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= cues.length) {
      return;
    }
    audioRef.current?.pause();
    setPhase("idle");
    setIndex(nextIndex);
  }

  async function checkAnswer() {
    if (!answersReady || checking || finished) {
      return;
    }
    audioRef.current?.pause();
    setChecking(true);
    setError(null);
    const checked = await submitTypingAnswer(sessionId, index, draft);
    setChecking(false);
    if (checked.error) {
      setError(checked.error);
      return;
    }
    setAnswers((currentAnswers) => {
      const nextAnswers = new Map(currentAnswers);
      nextAnswers.set(index, {
        itemIndex: index,
        standardAnswer: checked.standardAnswer,
        studentAnswer: checked.studentAnswer,
        correct: checked.correct,
        mismatchIndexes: checked.mismatchIndexes,
      });
      return nextAnswers;
    });
    if (checked.finished) {
      setFinished(true);
      setSummary({ correctCount: checked.correctCount, total: checked.total, accuracy: checked.accuracy });
    }
  }

  if (!current) {
    return <p className="text-base leading-7 text-foreground">這段沒有可默的句子。</p>;
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-border bg-card p-5 text-center">
        <p className="text-base text-muted">{title}</p>
        <p className="mt-1 text-base text-muted">{rangeLabel}</p>
        <div className="mt-4">
          <SentenceProgress index={index} total={cues.length} paragraphSortOrder={current.paragraphSortOrder} unit={itemUnit} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={primaryButtonClass} onClick={() => void playSentence(index)}>
          {phase === "playing" ? "播放中" : "播放"}
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={() => {
            audioRef.current?.pause();
            setPhase("paused");
          }}
        >
          暫停
        </button>
      </div>

      <label className="grid gap-2 text-base font-medium text-foreground">
        輸入這一句
        <textarea
          className={`${inputClass} min-h-28 py-3`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          readOnly={finished}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>

      {finished ? null : (
        <button type="button" className={primaryButtonClass} disabled={!answersReady || checking} onClick={() => void checkAnswer()}>
          {checking ? "核對中…" : "對答案"}
        </button>
      )}

      {result ? (
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-5">
          <p className={`text-2xl font-semibold ${result.correct ? "text-success" : "text-error"}`}>{result.correct ? "正確" : "錯誤"}</p>
          <div>
            <p className="text-base text-muted">標準答案</p>
            <MarkedText text={result.standardAnswer} mismatches={result.mismatchIndexes} />
          </div>
          <div>
            <p className="text-base text-muted">你的答案</p>
            <MarkedText text={result.studentAnswer} mismatches={result.mismatchIndexes} />
          </div>
          {result.correct ? null : <p className="text-base text-muted">有 {result.mismatchIndexes.length} 個字不同。</p>}
          {result.correct ? null : <StrokeButton characters={wrongHanCharacters(result.standardAnswer, result.mismatchIndexes)} />}
        </div>
      ) : null}

      {summary ? (
        <p className="text-center text-xl font-semibold text-foreground">
          正確 {summary.correctCount} / {summary.total}，準確率 {summary.accuracy ?? 0}%
        </p>
      ) : null}
      {finished ? (
        <AnswerSheet
          texts={cues.map((_, itemIndex) => answers.get(itemIndex)?.standardAnswer ?? "")}
          itemUnit={itemUnit}
          language={language}
          paragraphSortOrders={cues.map((cue) => cue.paragraphSortOrder)}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={secondaryButtonClass} disabled={index === 0} onClick={() => showIndex(index - 1)}>
          上一句
        </button>
        <button type="button" className={secondaryButtonClass} disabled={index >= cues.length - 1} onClick={() => showIndex(index + 1)}>
          下一句
        </button>
      </div>

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
      <Link href={selectHref} className={secondaryButtonClass}>
        返回段落選擇
      </Link>
    </div>
  );
}

function finishedFrom(savedAnswers: SavedTypingAnswer[], total: number): Pick<TypingCheckResult, "correctCount" | "total" | "accuracy"> | null {
  if (savedAnswers.length === 0 || savedAnswers.length < total) {
    return null;
  }
  const correctCount = savedAnswers.filter((answer) => answer.correct).length;
  return {
    correctCount,
    total,
    accuracy: Math.round((correctCount / total) * 1000) / 10,
  };
}
