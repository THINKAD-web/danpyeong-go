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
        {/* 점수 카드 */}
        <div className="card p-6 text-center">
          <div className="font-display text-7xl font-bold text-brand leading-none">{pct}점</div>
          <p className="mt-3 text-base font-bold text-ink">
            {data.studentName} 학생
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {correct}/{questions.length}문항 정답 · {submitted.score}/{submitted.maxScore}점
          </p>
          <p className="mt-1 text-xs text-ink/40">{data.test.title}</p>
        </div>

        {/* 문항별 정오 */}
        <div className="mt-5 space-y-2.5">
          {questions.map((tq, i) => {
            const r = submitted.results.find((x) => x.testQuestionId === tq.id);
            const ok = r?.isCorrect;
            return (
              <div
                key={tq.id}
                className={`card flex gap-3 p-4 ${ok ? "border-green-500" : "border-coral"}`}
                style={{ borderLeftWidth: 4 }}
              >
                <span
                  className={`mt-0.5 shrink-0 text-base font-bold ${ok ? "text-green-600" : "text-coral"}`}
                >
                  {ok ? "✓" : "✗"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-snug break-words">
                    {i + 1}. {tq.question.stem}
                  </p>
                  <p className={`mt-0.5 text-xs font-bold ${ok ? "text-green-700" : "text-coral"}`}>
                    {ok ? "정답" : "오답"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center pb-4">
          <Link href="/play" className="card inline-block bg-brand px-8 py-3.5 font-bold text-white">
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
  const progress = ((current + 1) / questions.length) * 100;
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    // play-scroll: iOS 모멘텀 스크롤 / overscroll 방지
    // pb-28: 하단 네비 버튼이 콘텐츠를 가리지 않도록 여백
    <main className="mx-auto max-w-xl play-scroll" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>

      {/* ── 상단 고정 헤더 ── */}
      <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b border-ink/10 px-4 pt-2 pb-2 safe-top">
        {/* 시험 제목 + 타이머 */}
        <div className="flex items-center justify-between gap-2 min-h-0">
          <div className="min-w-0">
            <p className="font-bold text-sm text-ink/70 truncate">{data.test.title}</p>
            <p className="text-xs text-ink/40">{data.studentName}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {secondsLeft !== null && (
              <span
                className={`font-bold tabular-nums text-sm px-2 py-1 rounded-lg ${
                  secondsLeft < 60 ? "bg-coral/10 text-coral" : "text-ink/60"
                }`}
              >
                ⏱ {formatTime(secondsLeft)}
              </span>
            )}
            <span className="text-sm font-bold text-ink/70 tabular-nums">
              {current + 1}<span className="text-ink/30">/{questions.length}</span>
            </span>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-ink/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── 문항 카드 ── */}
      <div className="px-4 pt-4">
        <div className="card p-5 sm:p-6">
          <p className="font-bold text-base sm:text-lg leading-relaxed">
            <span className="text-brand font-display text-xl mr-1">{current + 1}.</span>
            {tq.question.stem}
          </p>

          {tq.question.type === "MULTIPLE_CHOICE" ? (
            <ul className="mt-5 space-y-2.5">
              {tq.question.choices.map((c) => {
                const selected = answers[tq.id] === c.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setAnswers((a) => ({ ...a, [tq.id]: c.id }))}
                      // min-h-[52px]: iOS 권장 44px + 여유. active:scale로 터치 피드백
                      className={`w-full min-h-[52px] rounded-xl border-2 px-4 py-3 text-left font-bold text-sm sm:text-base transition-all active:scale-[0.98] ${
                        selected
                          ? "border-brand bg-brand/10 text-brand shadow-sm"
                          : "border-ink/20 bg-white hover:border-ink/40"
                      }`}
                    >
                      <span className={`mr-2 text-base ${selected ? "text-brand" : "text-ink/40"}`}>
                        {["①", "②", "③", "④"][c.order - 1]}
                      </span>
                      {c.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5">
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
                className="w-full min-h-[52px] rounded-xl border-2 border-ink px-4 py-3 text-lg font-bold focus:outline-none focus:border-brand"
              />
            </div>
          )}
        </div>

        {/* ── 이전/다음·제출 버튼 ── */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            // min-h-[52px] + flex-1로 터치 영역 확보
            className="card flex-1 min-h-[52px] font-bold disabled:opacity-30 active:translate-y-0.5"
          >
            ← 이전
          </button>

          {current < questions.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="card flex-[2] min-h-[52px] bg-brand font-bold text-white active:translate-y-0.5"
            >
              다음 →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="card flex-[2] min-h-[52px] bg-coral font-bold text-white disabled:opacity-50 active:translate-y-0.5"
            >
              {submitting ? "제출 중…" : `제출 (${answeredCount}/${questions.length})`}
            </button>
          )}
        </div>

        {submitError && <p className="mt-3 text-sm font-bold text-coral">{submitError}</p>}

        {/* ── 문항 점프 네비 ── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrent(i)}
              // h-11 w-11 = 44px: Apple HIG 최소 터치 권장 크기
              className={`h-11 w-11 rounded-xl text-sm font-bold transition active:scale-95 ${
                i === current
                  ? "bg-brand text-white shadow"
                  : answers[q.id]
                  ? "bg-mint/25 text-green-800 border-2 border-mint/50"
                  : "bg-ink/10 text-ink/60"
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
