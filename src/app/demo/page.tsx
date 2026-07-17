"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GeneratedQuestion } from "@/lib/ai";
import GenerationLoader from "@/components/GenerationLoader";

type Unit = { id: string; term: number; order: number; name: string };

export default function DemoPage() {
  const [grade, setGrade] = useState<3 | 4>(3);
  const [term, setTerm] = useState<1 | 2>(1);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitId, setUnitId] = useState("");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [type, setType] = useState<"MULTIPLE_CHOICE" | "SHORT_ANSWER">("MULTIPLE_CHOICE");

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setUnitsLoading(true);
    setUnitId("");
    fetch(`/api/demo/units?grade=${grade}&term=${term}`)
      .then((r) => r.json())
      .then((d: { units: Unit[] }) => {
        setUnits(d.units ?? []);
        if (d.units?.length) setUnitId(d.units[0].id);
      })
      .catch(() => setUnits([]))
      .finally(() => setUnitsLoading(false));
  }, [grade, term]);

  const currentUnit = units.find((u) => u.id === unitId);

  async function handleGenerate() {
    if (!unitId) return;
    setLoading(true);
    setError(null);
    setHint(null);
    setQuestions([]);
    try {
      const res = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          grade,
          term,
          count: 3,
          difficulty,
          type,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "문항 생성에 실패했어요.");
        setHint(data.hint ?? null);
        return;
      }
      setQuestions(data.questions ?? []);
    } catch {
      setError("문항 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold text-brandink">
          단평<span className="text-coral">GO</span>
        </Link>
        <Link
          href="/teacher"
          className="text-sm font-bold text-brand hover:underline"
        >
          무료 가입하기 →
        </Link>
      </nav>

      <header className="mb-8">
        <p className="text-sm font-bold text-brand">가입 없이 체험</p>
        <h1 className="font-display mt-1 text-3xl font-bold sm:text-4xl">
          AI 문항 생성 데모
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          단원을 고르면 미리 준비된 AI 샘플 문항을 최대 3개 보여줘요.
          가입 없이 바로 확인할 수 있고, 결과는 저장되지 않아요.
        </p>
      </header>

      <section className="card space-y-4 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-bold text-ink/70">학년</span>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value) as 3 | 4)}
              className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2.5 font-bold"
            >
              <option value={3}>3학년</option>
              <option value={4}>4학년</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold text-ink/70">학기</span>
            <select
              value={term}
              onChange={(e) => setTerm(Number(e.target.value) as 1 | 2)}
              className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2.5 font-bold"
            >
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-bold text-ink/70">단원</span>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            disabled={unitsLoading || units.length === 0}
            className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2.5 font-bold disabled:opacity-50"
          >
            {unitsLoading && <option>불러오는 중…</option>}
            {!unitsLoading && units.length === 0 && <option>단원 없음</option>}
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.order}. {u.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-bold text-ink/70">난이도</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2.5 font-bold"
            >
              <option value="EASY">하</option>
              <option value="MEDIUM">중</option>
              <option value="HARD">상</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold text-ink/70">유형</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2.5 font-bold"
            >
              <option value="MULTIPLE_CHOICE">객관식</option>
              <option value="SHORT_ANSWER">단답형</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !unitId}
          className="card w-full bg-brand px-5 py-3.5 text-base font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {loading ? "생성 중…" : currentUnit ? `「${currentUnit.name}」 문항 3개 체험` : "문항 체험하기"}
        </button>
      </section>

      {loading && (
        <div className="mt-8">
          <GenerationLoader count={3} />
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border-2 border-coral/40 bg-coral/10 px-4 py-3 text-sm">
          <p className="font-bold text-coral">{error}</p>
          {hint && <p className="mt-1 text-ink/60">{hint}</p>}
          <Link href="/teacher" className="mt-3 inline-block font-bold text-brand underline">
            무료로 가입하고 바로 만들기 →
          </Link>
        </div>
      )}

      {questions.length > 0 && !loading && (
        <section className="mt-8 space-y-4">
          <h2 className="font-display text-xl font-bold">
            생성된 샘플 ({questions.length}문항)
          </h2>
          {questions.map((q, i) => (
            <article key={i} className="card p-5">
              <p className="text-xs font-bold text-ink/40">
                Q{i + 1} · {q.difficulty} · {q.type === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
              </p>
              <p className="mt-2 font-bold leading-relaxed">{q.stem}</p>
              {q.type === "MULTIPLE_CHOICE" && (
                <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
                  {q.choices.map((c) => (
                    <li key={c.order}>
                      {c.order}. {c.text}
                    </li>
                  ))}
                </ul>
              )}
              {q.type === "SHORT_ANSWER" && (
                <p className="mt-3 text-sm text-ink/50">단답형 샘플 — 정답은 가입 후 평가에서 확인해 주세요.</p>
              )}
              {q.explanation && (
                <p className="mt-3 border-t border-ink/10 pt-3 text-sm text-ink/60">
                  해설 미리보기: {q.explanation}
                </p>
              )}
            </article>
          ))}

          <div className="card border-2 border-brand/30 bg-brand/5 p-6 text-center">
            <p className="font-display text-xl font-bold">
              마음에 드셨다면 무료로 가입하고
              <br className="sm:hidden" /> 직접 평가를 만들어보세요
            </p>
            <p className="mt-2 text-sm text-ink/60">
              문항 수정·배포·자동 채점·결과 리포트까지 한곳에서.
            </p>
            <Link
              href="/teacher"
              className="mt-4 inline-block card bg-brand px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              무료로 시작하기 →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
