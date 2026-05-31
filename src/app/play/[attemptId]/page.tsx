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

  // answers[testQuestionId] = selectedChoiceId | textAnswer
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  // timer
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // countdown — start once when secondsLeft is initialized
  const hasStartedTimer = useRef(false);
  useEffect(() => {
    if (secondsLeft === null || hasStartedTimer.current) return;
    hasStartedTimer.current = true;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null || s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

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
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-coral font-bold">{loadError}</p>
        <Link href="/play" className="mt-4 inline-block text-sm text-brand font-bold">
          ← 돌아가기
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center text-ink/40">
        불러오는 중…
      </main>
    );
  }

  // 결과 화면
  if (submitted) {
    const pct = Math.round((submitted.score / submitted.maxScore) * 100);
    const questions = data.test.questions;
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <div className="card p-8 text-center">
          <div className="font-display text-6xl font-bold text-brand">{pct}점</div>
          <p className="mt-2 text-ink/60">
            {data.studentName} 학생 · {submitted.score} / {submitted.maxScore}점
          </p>
          <p className="mt-1 text-sm text-ink/40">{data.test.title}</p>
        </div>

        <div className="mt-6 space-y-3">
          {questions.map((tq, i) => {
            const r = submitted.results.find((x) => x.testQuestionId === tq.id);
            return (
              <div
                key={tq.id}
                className={`card p-4 ${r?.isCorrect ? "border-l-4 border-green-500" : "border-l-4 border-coral"}`}
              >
                <p className="font-bold text-sm">
                  {i + 1}. {tq.question.stem}
                </p>
                <p className={`mt-1 text-xs font-bold ${r?.isCorrect ? "text-green-700" : "text-coral"}`}>
                  {r?.isCorrect ? "✓ 정답" : "✗ 오답"}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/play" className="card inline-block bg-brand px-6 py-3 font-bold text-white">
            다시 응시하기
          </Link>
        </div>
      </main>
    );
  }

  const questions = data.test.questions;
  const tq = questions[current];
  const answeredCount = Object.keys(answers).length;
  const progress = (current / questions.length) * 100;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm text-ink/60">{data.test.title}</p>
          <p className="text-xs text-ink/40">{data.studentName} 학생</p>
        </div>
        <div className="flex items-center gap-3">
          {secondsLeft !== null && (
            <span className={`font-bold tabular-nums ${secondsLeft < 60 ? "text-coral" : "text-ink/60"}`}>
              ⏱ {formatTime(secondsLeft)}
            </span>
          )}
          <span className="text-sm text-ink/60">
            {current + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="mb-6 h-2 w-full rounded-full bg-ink/10">
        <div
          className="h-2 rounded-full bg-brand transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 문항 */}
      <div className="card p-6">
        <p className="font-bold text-lg leading-relaxed">
          {current + 1}. {tq.question.stem}
        </p>

        {tq.question.type === "MULTIPLE_CHOICE" ? (
          <ul className="mt-5 space-y-2">
            {tq.question.choices.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setAnswers((a) => ({ ...a, [tq.id]: c.id }))}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left font-bold transition hover:-translate-y-0.5 ${
                    answers[tq.id] === c.id
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-ink/20 bg-white"
                  }`}
                >
                  {["①", "②", "③", "④"][c.order - 1]} {c.text}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <input
            type="text"
            value={answers[tq.id] ?? ""}
            onChange={(e) => setAnswers((a) => ({ ...a, [tq.id]: e.target.value }))}
            placeholder="답을 입력하세요"
            className="mt-5 w-full rounded-xl border-2 border-ink px-4 py-3 text-lg font-bold focus:outline-none focus:border-brand"
          />
        )}
      </div>

      {/* 네비게이션 */}
      <div className="mt-6 flex justify-between gap-3">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="card px-5 py-3 font-bold disabled:opacity-30"
        >
          ← 이전
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="card bg-brand px-5 py-3 font-bold text-white"
          >
            다음 →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="card bg-coral px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {submitting ? "제출 중…" : `제출하기 (${answeredCount}/${questions.length})`}
          </button>
        )}
      </div>

      {submitError && <p className="mt-3 text-sm text-coral">{submitError}</p>}

      {/* 문항 점프 */}
      <div className="mt-6 flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrent(i)}
            className={`h-8 w-8 rounded-lg text-sm font-bold transition ${
              i === current
                ? "bg-brand text-white"
                : answers[q.id]
                ? "bg-mint/30 text-green-800"
                : "bg-ink/10 text-ink/60"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </main>
  );
}
