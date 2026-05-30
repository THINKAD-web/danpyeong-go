"use client";

import Link from "next/link";
import { useState } from "react";
import { MOCK_UNITS } from "@/lib/mock-data";
import type { GeneratedQuestion } from "@/lib/ai";

export default function NewTestPage() {
  const [term, setTerm] = useState(2);
  const [unitId, setUnitId] = useState("u3-2-1");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [type, setType] = useState<"MULTIPLE_CHOICE" | "SHORT_ANSWER">("MULTIPLE_CHOICE");

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const units = MOCK_UNITS.filter((u) => u.term === term);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const unit = MOCK_UNITS.find((u) => u.id === unitId);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          unitName: unit?.name ?? "",
          term,
          count,
          difficulty,
          type,
        }),
      });
      if (!res.ok) throw new Error("생성 실패");
      const data = await res.json();
      setQuestions(data.questions);
    } catch {
      setError("문항 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-8 flex items-center justify-between">
        <Link href="/teacher" className="text-sm font-bold text-brand">
          ← 대시보드
        </Link>
        <span className="rounded-full border-2 border-ink bg-sun/30 px-3 py-1 text-xs font-bold">
          mock 생성
        </span>
      </nav>

      <h1 className="font-display text-4xl font-bold">AI로 문항 만들기</h1>
      <p className="mt-2 text-ink/60">
        단원과 조건을 고르면 AI가 초안을 만들어요. 생성 후 자유롭게 수정·삭제하세요.
      </p>

      {/* 생성 조건 */}
      <div className="card mt-8 space-y-5 p-6">
        <div className="flex gap-3">
          <Field label="학기">
            <select
              value={term}
              onChange={(e) => {
                const t = Number(e.target.value);
                setTerm(t);
                const first = MOCK_UNITS.find((u) => u.term === t);
                if (first) setUnitId(first.id);
              }}
              className="select"
            >
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </Field>
          <Field label="단원">
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="select"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.order}. {u.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="문항 수">
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="select"
            />
          </Field>
          <Field label="난이도">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="select"
            >
              <option value="EASY">하</option>
              <option value="MEDIUM">중</option>
              <option value="HARD">상</option>
            </select>
          </Field>
          <Field label="유형">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="select"
            >
              <option value="MULTIPLE_CHOICE">객관식</option>
              <option value="SHORT_ANSWER">단답형</option>
            </select>
          </Field>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="card w-full bg-brand py-3 font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {loading ? "생성 중…" : "✨ AI로 문항 생성"}
        </button>
        {error && <p className="text-sm text-coral">{error}</p>}
      </div>

      {/* 생성 결과 */}
      {questions.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">
              생성된 문항 {questions.length}개
            </h2>
            <button className="card bg-mint/30 px-4 py-2 text-sm font-bold">
              테스트로 저장
            </button>
          </div>
          <p className="mt-1 text-sm text-ink/50">
            ⚠️ AI 생성 문항입니다. 교육과정 적합성과 정답을 반드시 확인하세요.
          </p>

          <div className="mt-5 space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-2 flex gap-2 text-xs font-bold">
                      <span className="rounded-full bg-ink/10 px-2 py-0.5">
                        {q.type === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                      </span>
                      <span className="rounded-full bg-sun/30 px-2 py-0.5">
                        난이도 {q.difficulty === "EASY" ? "하" : q.difficulty === "MEDIUM" ? "중" : "상"}
                      </span>
                    </div>
                    <p className="font-bold">
                      {i + 1}. {q.stem}
                    </p>

                    {q.type === "MULTIPLE_CHOICE" ? (
                      <ul className="mt-3 space-y-1">
                        {q.choices.map((c) => (
                          <li
                            key={c.order}
                            className={`rounded-lg px-3 py-1.5 text-sm ${
                              c.isCorrect
                                ? "bg-mint/20 font-bold text-green-800"
                                : "bg-ink/5"
                            }`}
                          >
                            {["①", "②", "③", "④"][c.order - 1]} {c.text}
                            {c.isCorrect && " ✓"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm">
                        <span className="font-bold">정답:</span>{" "}
                        {q.answerKeywords.join(" / ")}
                      </p>
                    )}

                    <p className="mt-3 rounded-lg bg-brand/5 px-3 py-2 text-sm text-ink/70">
                      💡 {q.explanation}
                    </p>
                  </div>
                  <button
                    onClick={() => removeQuestion(i)}
                    className="shrink-0 rounded-lg border-2 border-coral px-2 py-1 text-xs font-bold text-coral"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .select {
          width: 100%;
          border: 2px solid #1a1a2e;
          border-radius: 10px;
          padding: 0.5rem 0.75rem;
          background: #fff;
          font-weight: 600;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex-1">
      <span className="mb-1 block text-sm font-bold text-ink/70">{label}</span>
      {children}
    </label>
  );
}
