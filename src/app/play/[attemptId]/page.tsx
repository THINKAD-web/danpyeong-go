"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Choice = { id: string; order: number; text: string };
type TQ = {
  id: string;
  order: number;
  points: number;
  question: {
    id: string;
    type: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
    stem: string;
    choices: Choice[];
  };
};
type AttemptData = {
  id: string;
  studentName: string;
  status: string;
  test: {
    title: string;
    timeLimitMin: number | null;
    shuffle: boolean;
    questions: TQ[];
  };
};
type GradeResult = {
  testQuestionId: string;
  isCorrect: boolean;
  earnedPoints: number;
};
type Submitted = { score: number; maxScore: number; results: GradeResult[] };

export default function TestPlayerPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [data, setData] = useState<AttemptData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 단답형 입력칸 ref — 포커스 시 스크롤 보정용
  const shortAnswerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch(`/api/play/${attemptId}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "오류");
        return d;
      })
      .then(({ attempt }: { attempt: AttemptData }) => {
        if (attempt.test.shuffle) {
          attempt.test.questions = [...attempt.test.questions].sort(() => Math.random() - 0.5);
        }
        setData(attempt);
        if (attempt.test.timeLimitMin) {
          setSecondsLeft(attempt.test.timeLimitMin * 60);
        }
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [attemptId]);

  const hasStartedTimer = useRef(false);
  useEffect(() => {
    if (secondsLeft === null || hasStartedTimer.current) return;
    hasStartedTimer.current = true;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null || s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  // 문항 변경 시 단답형 입력칸이 있으면 자동 스크롤
  useEffect(() => {
    shortAnswerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current]);

  async function handleSubmit() {
    if (!data) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = data.test.questions.map((tq) => ({
        testQuestionId: tq.id,
        ...(tq.question.type === "MULTIPLE_CHOICE"
          ? { selectedChoiceId: answers[tq.id] }
          : { textAnswer: answers[tq.id] }),
      }));
      const res = await fetch(`/api/play/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "제출 오류");
      setSubmitted(d);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── 로딩·에러 화면 ────────────────────────────────────────

  if (loadError) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-bold text-coral">{loadError}</p>
        <Link href="/play" className="mt-4 inline-block text-sm font-bold text-brand">
          ← 돌아가기
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center text-ink/40">
        불러오는 중…
      </main>
    );
  }

  // ── 결과 화면 ─────────────────────────────────────────────

  if (submitted) {
    const pct = Math.round((submitted.score / submitted.maxScore) * 100);
    const questions = data.test.questions;
    const correct = submitted.results.filter((r) => r.isCorrect).length;
    return (
      <main className="mx-auto max-w-xl px-4 py-8 pb-safe-or-8 safe-bottom">
        {/* 제출 완료 */}
        <div className="card p-8 text-center sm:p-10">
          <p className="text-sm font-bold text-brand">제출 완료</p>
          <div className="font-display mt-2 text-7xl font-bold leading-none text-brand">{pct}점</div>
          <p className="mt-4 text-lg font-bold text-ink">
            {data.studentName} 학생
          </p>
          <p className="mt-1 text-base text-ink/60">
            {correct}/{questions.length}문항 정답 · {submitted.score}/{submitted.maxScore}점
          </p>
          <p className="mt-1 text-sm text-ink/40">{data.test.title}</p>
        </div>

        {/* 문항별 정오 — 정답/오답에만 보조색 */}
        <div className="mt-5 space-y-2.5">
          {questions.map((tq, i) => {
            const r = submitted.results.find((x) => x.testQuestionId === tq.id);
            const ok = r?.isCorrect;
            return (
              <div
                key={tq.id}
                className={`card flex gap-3 p-4 ${ok ? "border-l-4 border-l-green-500" : "border-l-4 border-l-rose-500"}`}
              >
                <span
                  className={`mt-0.5 shrink-0 text-base font-bold ${ok ? "text-green-600" : "text-rose-500"}`}
                >
                  {ok ? "✓" : "✗"}
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold leading-snug break-words">
                    {i + 1}. {tq.question.stem}
                  </p>
                  <p className={`mt-0.5 text-sm font-bold ${ok ? "text-green-700" : "text-rose-600"}`}>
                    {ok ? "정답" : "오답"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pb-4 text-center">
          <Link href="/play" className="btn-primary inline-flex">
            다시 응시하기
          </Link>
        </div>
      </main>
    );
  }

  // ── 응시 화면 ─────────────────────────────────────────────

  const questions = data.test.questions;
  const tq = questions[current];
  const answeredCount = Object.keys(answers).length;
  const remaining = questions.length - answeredCount;
  const progress = ((current + 1) / questions.length) * 100;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    // play-scroll: iOS 모멘텀 스크롤 / overscroll 방지
    // pb-28: 하단 네비 버튼이 콘텐츠를 가리지 않도록 여백
    <main className="mx-auto max-w-xl play-scroll" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>

      {/* ── 상단 고정 헤더 ── */}
      <div className="sticky top-0 z-10 border-b border-ink/8 bg-white/95 px-4 pb-3 pt-2 backdrop-blur-sm safe-top">
        {/* 시험 제목 + 타이머 */}
        <div className="flex min-h-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink/70">{data.test.title}</p>
            <p className="text-xs text-ink/40">{data.studentName}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            {secondsLeft !== null && (
              <span
                className={`rounded-lg px-2 py-1 text-sm font-bold tabular-nums ${
                  secondsLeft < 60 ? "bg-amber-50 text-amber-700" : "text-ink/60"
                }`}
              >
                {formatTime(secondsLeft)}
              </span>
            )}
            <span className="text-sm font-bold tabular-nums text-ink/70">
              {current + 1}<span className="text-ink/30">/{questions.length}</span>
            </span>
            <span className="text-xs font-bold text-brand">남은 문항 {remaining}</span>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── 문항 카드 (태블릿 손가락 풀이) ── */}
      <div className="px-4 pt-5">
        <div className="card p-6 sm:p-8">
          <p className="text-lg font-bold leading-relaxed sm:text-xl">
            <span className="mr-2 font-display text-2xl text-brand">{current + 1}.</span>
            {tq.question.stem}
          </p>

          {tq.question.type === "MULTIPLE_CHOICE" ? (
            <ul className="mt-6 space-y-3">
              {tq.question.choices.map((c) => {
                const selected = answers[tq.id] === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setAnswers((a) => ({ ...a, [tq.id]: c.id }))}
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
                ref={shortAnswerRef}
                type="text"
                inputMode="text"
                value={answers[tq.id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [tq.id]: e.target.value }))}
                onFocus={() => {
                  // 키보드가 올라올 때 입력칸이 가려지지 않도록 스크롤
                  setTimeout(() => shortAnswerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
                }}
                placeholder="답을 입력하세요"
                className="w-full min-h-[56px] rounded-xl border-2 border-ink/20 px-4 py-3 text-lg font-bold focus:border-brand focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* ── 이전/다음·제출 버튼 — 주요 행동 하나 강조 ── */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="btn-secondary flex-1 !min-h-[56px] disabled:opacity-30"
          >
            이전
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="btn-primary flex-[2] !min-h-[56px]"
            >
              다음 문항
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex-[2] !min-h-[56px] disabled:opacity-50"
            >
              {submitting ? "제출 중…" : `제출하기 (${answeredCount}/${questions.length})`}
            </button>
          )}
        </div>

        {submitError && <p className="mt-3 text-base font-bold text-rose-500">{submitError}</p>}

        {/* ── 문항 점프 네비 ── */}
        <div className="mt-5 flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrent(i)}
              className={`h-12 w-12 rounded-xl text-sm font-bold transition active:scale-95 ${
                i === current
                  ? "bg-brand text-white"
                  : answers[q.id]
                  ? "border-2 border-brand/30 bg-brand/10 text-brand"
                  : "bg-ink/8 text-ink/55"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
