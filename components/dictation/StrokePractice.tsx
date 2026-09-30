"use client";

import { useEffect, useRef, useState } from "react";
import type HanziWriter from "hanzi-writer";
import { secondaryButtonClass } from "@/components/auth/button-styles";

function themeColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

export function StrokePractice({ characters }: { characters: string[] }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [index, setIndex] = useState(0);
  const [missing, setMissing] = useState(false);
  const character = characters[index] ?? "";

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !character) {
      return;
    }

    let cancelled = false;
    target.replaceChildren();
    setMissing(false);

    void import("hanzi-writer")
      .then((module) => {
        if (cancelled || !targetRef.current) {
          return;
        }

        const writer = module.default.create(target, character, {
          width: 240,
          height: 240,
          padding: 8,
          showOutline: true,
          showCharacter: false,
          strokeColor: themeColor("--foreground", "#1c2430"),
          outlineColor: themeColor("--border", "#d5deea"),
          strokeAnimationSpeed: 0.8,
          delayBetweenStrokes: 300,
          onLoadCharDataError: () => {
            if (!cancelled) {
              setMissing(true);
            }
          },
        });
        writerRef.current = writer;
        void writer.animateCharacter()?.catch(() => {
          if (!cancelled) {
            setMissing(true);
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setMissing(true);
        }
      });

    return () => {
      cancelled = true;
      writerRef.current = null;
      target.replaceChildren();
    };
  }, [character]);

  if (!character) {
    return null;
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="text-center text-2xl font-semibold text-foreground">筆劃</h3>
      <p className="text-center text-base text-muted">跟着筆順寫一次，再對下一個字。</p>
      <p className="text-center text-2xl font-semibold text-foreground">漢字：{character}</p>
      <p className="text-center text-base text-muted">
        第 {index + 1} / {characters.length} 個
      </p>
      <div ref={targetRef} className="mx-auto min-h-60 w-60" />
      {missing ? <p className="text-center text-base text-error">暫時未能提供此字的筆劃資料。</p> : null}
      <button type="button" className={secondaryButtonClass} onClick={() => void writerRef.current?.animateCharacter()}>
        重播筆劃
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={index === 0}
          onClick={() => setIndex((current) => Math.max(current - 1, 0))}
        >
          上一個字
        </button>
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={index >= characters.length - 1}
          onClick={() => setIndex((current) => Math.min(current + 1, characters.length - 1))}
        >
          下一個字
        </button>
      </div>
    </div>
  );
}
