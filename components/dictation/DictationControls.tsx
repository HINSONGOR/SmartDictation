import { primaryButtonClass, secondaryButtonClass } from "@/components/auth/button-styles";

type DictationControlsProps = {
  phase: "idle" | "loading" | "playing" | "paused" | "ended";
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function DictationControls({
  phase,
  canGoPrevious,
  canGoNext,
  onPlay,
  onPause,
  onReplay,
  onPrevious,
  onNext,
}: DictationControlsProps) {
  const busy = phase === "loading";

  return (
    <div className="grid gap-3">
      {phase === "playing" ? (
        <button type="button" className={primaryButtonClass} onClick={onPause}>
          暫停
        </button>
      ) : (
        <button type="button" className={primaryButtonClass} onClick={onPlay} disabled={busy}>
          {busy ? "正在準備語音…" : phase === "paused" ? "繼續" : phase === "ended" ? "重播" : "播放"}
        </button>
      )}
      <div className="grid grid-cols-3 gap-3">
        <button type="button" className={secondaryButtonClass} onClick={onPrevious} disabled={!canGoPrevious || busy}>
          上一句
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onReplay} disabled={busy}>
          重播
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onNext} disabled={!canGoNext || busy}>
          下一句
        </button>
      </div>
    </div>
  );
}
