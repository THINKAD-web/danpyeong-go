"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconCheck } from "@/components/icons";
import { PREVIEW_BANK } from "@/lib/design-preview-data";

/**
 * 학생 응시 — 디자인 시안 (목 데이터)
 * 태블릿 손가락 풀이: 큰 카드, 한 화면 한 문항, 큰 보기 버튼
 */
export default function DesignPlayPage() {
  const questions = useMemo(
    () => PREVIEW_BANK.filter((q) => q.unit === "나눗셈").slice(0, 3),
    []
  );

  const [started, setStarted] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const q = questions[current];
  const remaining = questions.length - Object.keys(answers).length;
  const answeredCount = Object.keys(answers).length;
  const progress = ((current + 1) / questions.length) * 100;

  if (!started) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-8">
        <div className="design-banner absolute inset-x-0 top-0">디자인 시안 · 학생 응시</div>
        <Link href="/" className="font-display mb-8 text-3xl font-bold text-brandink">
          단평<span className="text-brand">GO</span>
        </Link>
        <div className="card w-full max-w-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold">테스트 응시하기</h1>
          <p className="mt-1 text-base text-ink/60">샘플 시험지 — 코드 없이 바로 풀어 보세요.</p>
          <button type="button" onClick={() => setStarted(true)} className="btn-primary mt-6 w-full">
            시작하기
          </button>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-4 py-6 safe-bottom">
        <div className="design-banner -mx-4 mb-6">디자인 시안 · 제출 완료 화면</div>

        <div className="card flex flex-1 flex-col items-center justify-center p-8 text-center sm:p-10">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
            <IconCheck size={32} />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">제출 완료</h1>
          <p className="mt-2 text-base text-ink/60">
            샘플 시험지 응답이 기록되었습니다.
            <br />
            (시안 미리보기 — 실제 채점/저장 없음)
          </p>
          <p className="mt-6 rounded-xl bg-brand/5 px-5 py-3 text-base font-bold text-brand">
            응답 {answeredCount}/{questions.length}문항
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:max-w-xs">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setCurrent(0);
                setAnswers({});
              }}
              className="btn-primary w-full"
            >
              다시 풀어보기
            </button>
            <Link href="/design" className="btn-secondary w-full">
              시안 목록으로
            </Link>
          </div>
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

      {/* 상단 */}
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

      {/* 문항 카드 */}
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

        {/* 하단: 주요 행동 버튼 하나 중심 */}
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
        </p>
      </div>
    </main>
  );
}
