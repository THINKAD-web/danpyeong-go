"use client";

import Link from "next/link";
import { useState } from "react";
import type { PreviewQuestion } from "@/lib/design-preview-data";

export function DesignPlayInteractive({ questions }: { questions: PreviewQuestion[] }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const remaining = questions.length - answeredCount;
  const progress = ((current + 1) / questions.length) * 100;

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-4 py-6 safe-bottom">
        <div className="design-banner -mx-4 mb-6">디자인 시안 · 제출 완료 화면</div>
        <div className="card flex flex-1 flex-col items-center justify-center p-8 text-center sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">제출 완료</h1>
          <p className="mt-2 text-base text-ink/60">샘플 시험지 응답이 기록되었습니다.</p>
          <p className="mt-6 rounded-xl bg-brand/5 px-5 py-3 text-base font-bold text-brand">
            응답 {answeredCount}/{questions.length}문항
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setCurrent(0);
              setAnswers({});
            }}
            className="btn-primary mt-8 w-full max-w-xs"
          >
            다시 풀어보기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-xl play-scroll"
      style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
    >
      <div className="design-banner">디자인 시안 · 학생 응시 · 한 화면 한 문항</div>

      <div className="sticky top-0 z-10 border-b border-ink/8 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-sm safe-top">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink/70">3학년 나눗셈 샘플 시험지</p>
            <p className="text-xs text-ink/40">미리보기 학생</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-sm font-bold tabular-nums text-ink/70">
              {current + 1}
              <span className="text-ink/30">/{questions.length}</span>
            </span>
            <span className="text-xs font-bold text-brand">
              남은 문항 {Math.max(0, questions.length - answeredCount)}
            </span>
          </div>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="card p-6 sm:p-8">
          <p className="text-lg font-bold leading-relaxed sm:text-xl">
            <span className="mr-2 font-display text-2xl text-brand">{current + 1}.</span>
            {q.stem}
          </p>

          {q.type === "MULTIPLE_CHOICE" ? (
            <ul className="mt-6 space-y-3">
              {q.choices.map((c) => {
                const selected = answers[q.id] === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: c.id }))}
                      className="touch-choice"
                      data-selected={selected}
                    >
                      <span className={`mr-2 ${selected ? "text-brand" : "text-ink/35"}`}>
                        {["①", "②", "③", "④"][c.order - 1]}
                      </span>
                      {c.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-6">
              <input
                type="text"
                inputMode="numeric"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="답을 입력하세요"
                className="w-full min-h-[56px] rounded-xl border-2 border-ink/20 px-4 py-3 text-lg font-bold focus:border-brand focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="btn-secondary flex-1 !min-h-[56px] disabled:opacity-30"
          >
            이전
          </button>

          {current < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrent((c) => c + 1)}
              className="btn-primary flex-[2] !min-h-[56px]"
            >
              다음 문항
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="btn-primary flex-[2] !min-h-[56px]"
            >
              제출하기 ({answeredCount}/{questions.length})
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-ink/40">
          남은 문항 {remaining} · 손가락으로 보기를 눌러 답하세요
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {questions.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-12 w-12 rounded-xl text-sm font-bold transition active:scale-95 ${
                i === current
                  ? "bg-brand text-white"
                  : answers[item.id]
                    ? "border-2 border-brand/30 bg-brand/10 text-brand"
                    : "bg-ink/8 text-ink/55"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <p className="mt-8 text-center">
          <Link href="/design" className="text-sm font-bold text-brand">
            ← 시안 목록
          </Link>
          <span className="mx-2 text-ink/20">·</span>
          <Link href="/design/play?done=1" className="text-sm font-bold text-ink/45 hover:text-brand">
            제출 완료 시안
          </Link>
        </p>
      </div>
    </main>
  );
}
