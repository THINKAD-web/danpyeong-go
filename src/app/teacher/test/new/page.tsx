"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { GeneratedQuestion } from "@/lib/ai";

type Unit = { id: string; term: number; order: number; name: string };

export default function NewTestPage() {
  const router = useRouter();

  const [term, setTerm] = useState(2);
  // MVP: 3학년 고정. 학년 선택 UI는 다음 PR에서 도입 예정.
  const grade = 3;
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  const [unitId, setUnitId] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [type, setType] = useState<"MULTIPLE_CHOICE" | "SHORT_ANSWER">("MULTIPLE_CHOICE");

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 테스트 저장 상태
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 학기 변경 시 단원 목록 재조회
  useEffect(() => {
    setUnitsLoading(true);
    setUnitsError(null);
    fetch(`/api/units?grade=${grade}&term=${term}`)
      .then((r) => {
        if (!r.ok) throw new Error("단원 목록 오류");
        return r.json();
      })
      .then((data: { units: Unit[] }) => {
        setUnits(data.units);
        if (data.units.length > 0) setUnitId(data.units[0].id);
      })
      .catch(() => setUnitsError("단원 목록을 불러오지 못했어요."))
      .finally(() => setUnitsLoading(false));
  }, [term, grade]);

  const currentUnit = units.find((u) => u.id === unitId);

  async function handleGenerate() {
    if (!currentUnit) return;
    setLoading(true);
    setError(null);
    setQuestions([]);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          unitName: currentUnit.name,
          term,
          count,
          difficulty,
          type,
        }),
      });
      if (!res.ok) throw new Error("생성 실패");
      const data = await res.json();
      setQuestions(data.questions);
      // 기본 제목 세팅
      setSaveTitle(`${term}학기 ${currentUnit.name} 단원평가`);
    } catch {
      setError("문항 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!saveTitle.trim() || questions.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: saveTitle.trim(), questions, unitId }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setShowSaveModal(false);
      router.push("/teacher");
    } catch {
      setSaveError("저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-8 flex items-center justify-between">
        <Link href="/teacher" className="text-sm font-bold text-brand">
          ← 대시보드
        </Link>
      </nav>

      <h1 className="font-display text-4xl font-bold">AI로 문항 만들기</h1>
      <p className="mt-2 text-ink/60">
        단원과 조건을 고르면 AI가 초안을 만들어요. 생성 후 자유롭게 수정·삭제하세요.
      </p>

      {/* 생성 조건 */}
      <div className="card mt-8 space-y-5 p-6">
        <div className="flex gap-3">
          <Field label="학기">
            <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className="select">
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </Field>
          <Field label="단원">
            {unitsLoading ? (
              <div className="select flex items-center text-ink/40">불러오는 중…</div>
            ) : unitsError ? (
              <div className="select flex items-center text-sm text-coral">{unitsError}</div>
            ) : (
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="select">
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.order}. {u.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="문항 수">
            <input
              type="number" min={1} max={20} value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="select"
            />
          </Field>
          <Field label="난이도">
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="select">
              <option value="EASY">하</option>
              <option value="MEDIUM">중</option>
              <option value="HARD">상</option>
            </select>
          </Field>
          <Field label="유형">
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="select">
              <option value="MULTIPLE_CHOICE">객관식</option>
              <option value="SHORT_ANSWER">단답형</option>
            </select>
          </Field>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || unitsLoading || !!unitsError || !unitId}
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
            <h2 className="font-display text-2xl font-bold">생성된 문항 {questions.length}개</h2>
            <button
              onClick={() => setShowSaveModal(true)}
              className="card bg-mint/30 px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
            >
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
                    <p className="font-bold">{i + 1}. {q.stem}</p>
                    {q.type === "MULTIPLE_CHOICE" ? (
                      <ul className="mt-3 space-y-1">
                        {q.choices.map((c) => (
                          <li
                            key={c.order}
                            className={`rounded-lg px-3 py-1.5 text-sm ${
                              c.isCorrect ? "bg-mint/20 font-bold text-green-800" : "bg-ink/5"
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

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display text-xl font-bold">테스트로 저장</h3>
            <p className="mt-1 text-sm text-ink/60">문항 {questions.length}개가 저장됩니다.</p>

            <label className="mt-4 block">
              <span className="text-sm font-bold">테스트 제목</span>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="예: 3-2 곱셈 단원평가"
                className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 font-semibold focus:outline-none focus:border-brand"
                autoFocus
              />
            </label>

            {saveError && <p className="mt-2 text-sm text-coral">{saveError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowSaveModal(false); setSaveError(null); }}
                className="flex-1 rounded-xl border-2 border-ink py-2 font-bold"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !saveTitle.trim()}
                className="flex-1 card bg-brand py-2 font-bold text-white disabled:opacity-50"
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
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
