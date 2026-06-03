"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { label: "문항 초안 작성 중", sub: "교육과정 기준에 맞게 문제를 구성하고 있어요", icon: "✏️" },
  { label: "정답 검산 중", sub: "각 문항의 정답과 오답을 다시 확인하고 있어요", icon: "🔍" },
  { label: "해설 다듬는 중", sub: "풀이 과정과 해설을 정리하고 있어요", icon: "📝" },
  { label: "마무리 중", sub: "거의 다 됐어요! 잠시만 기다려 주세요", icon: "✨" },
];

// Step durations in seconds — total roughly 30s before looping at step 3
const STEP_DURATIONS = [12, 15, 13, 9999]; // last step holds until done

export default function GenerationLoader({ count }: { count: number }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  // Advance through steps on a timer
  useEffect(() => {
    let acc = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < STEPS.length - 1; i++) {
      acc += STEP_DURATIONS[i];
      const t = setTimeout(() => setStepIdx(i + 1), acc * 1000);
      timers.push(t);
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Animated dots
  useEffect(() => {
    const id = setInterval(() => setDotCount((d) => (d % 3) + 1), 500);
    return () => clearInterval(id);
  }, []);

  const step = STEPS[stepIdx];
  const progressPct = Math.min(
    stepIdx === STEPS.length - 1
      ? 95 // hold near end until real completion
      : Math.round(((stepIdx + 1) / STEPS.length) * 85),
    95
  );

  const elapsedStr =
    elapsed < 60
      ? `${elapsed}초`
      : `${Math.floor(elapsed / 60)}분 ${elapsed % 60}초`;

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border-2 border-brand/20 bg-brand/5">
      {/* Header */}
      <div className="bg-brand/10 px-5 pt-5 pb-4 text-center">
        {/* Pencil icon bouncing */}
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm"
          style={{ animation: "genPulse 2s ease-in-out infinite" }}
        >
          {step.icon}
        </div>
        <p className="font-display text-lg font-bold text-brand">
          {step.label}
          {".".repeat(dotCount)}
        </p>
        <p className="mt-1 text-xs text-ink/50">{step.sub}</p>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs font-bold text-ink/50">
          <span>진행률</span>
          <span>{progressPct}%</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-brand/15">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{
              width: `${progressPct}%`,
              transition: "width 1.5s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="mt-4 flex items-center justify-center px-5">
        {STEPS.slice(0, -1).map((s, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${
                i < stepIdx
                  ? "bg-brand text-white"
                  : i === stepIdx
                  ? "bg-brand/20 text-brand ring-2 ring-brand"
                  : "bg-ink/10 text-ink/30"
              }`}
            >
              {i < stepIdx ? "✓" : i + 1}
            </div>
            {i < STEPS.length - 2 && (
              <div
                className={`mx-1 h-0.5 w-8 rounded-full transition-all duration-700 ${
                  i < stepIdx ? "bg-brand" : "bg-ink/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="mt-4 flex items-center justify-between border-t border-brand/10 px-5 py-3 text-xs text-ink/40">
        <span>문항 {count}개 생성 중</span>
        <span>경과 {elapsedStr}</span>
      </div>

      <style>{`
        @keyframes genPulse {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
