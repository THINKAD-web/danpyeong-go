"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { GeneratedQuestion } from "@/lib/ai";
import { validateQuestion } from "@/lib/question-helpers";
import { QuestionEditor } from "@/components/QuestionEditor";
import GenerationLoader from "@/components/GenerationLoader";

type Unit = { id: string; term: number; order: number; name: string };

const EMPTY_QUESTION: GeneratedQuestion = {
  type: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  stem: "",
  choices: [
    { order: 1, text: "", isCorrect: true },
    { order: 2, text: "", isCorrect: false },
    { order: 3, text: "", isCorrect: false },
    { order: 4, text: "", isCorrect: false },
  ],
  answerKeywords: [],
  explanation: "",
  source: "MANUAL",
};

export default function NewTestPage() {
  const router = useRouter();

  // ── 학년·학기·단원 ──────────────────────────────────────
  const [grade, setGrade] = useState(3);
  const [grades, setGrades] = useState<number[]>([3]);
  const [gradesLoading, setGradesLoading] = useState(true);

  const [term, setTerm] = useState(1);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [unitId, setUnitId] = useState("");

  // ── 생성 옵션 ───────────────────────────────────────────
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [type, setType] = useState<"MULTIPLE_CHOICE" | "SHORT_ANSWER">("MULTIPLE_CHOICE");

  // ── 생성 상태 ───────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  // ── 편집·직접 추가 ──────────────────────────────────────
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [addingManual, setAddingManual] = useState(false);

  // ── 저장 ────────────────────────────────────────────────
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 학년 목록 조회
  useEffect(() => {
    fetch("/api/grades")
      .then((r) => r.json())
      .then((d: { grades: number[] }) => {
        if (d.grades?.length > 0) setGrades(d.grades);
      })
      .catch(() => {})
      .finally(() => setGradesLoading(false));
  }, []);

  // 학년·학기 변경 시 단원 재조회
  useEffect(() => {
    setUnitsLoading(true);
    setUnitsError(null);
    setUnitId("");
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
  }, [grade, term]);

  const currentUnit = units.find((u) => u.id === unitId);

  async function handleGenerate() {
    if (!currentUnit) return;
    setLoading(true);
    setError(null);
    setErrorHint(null);
    setRateLimited(false);
    setQuestions([]);
    setEditingIdx(null);
    setAddingManual(false);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, unitName: currentUnit.name, term, count, difficulty, type }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429 || res.status === 503) {
          setRateLimited(true);
          setError(body.error ?? "AI 생성 한도에 도달했어요.");
          setErrorHint(body.hint ?? null);
        } else {
          setRateLimited(false);
          setError(body.error ?? "문항 생성에 실패했어요. 다시 시도해 주세요.");
        }
        return;
      }
      const data = await res.json();
      setQuestions(data.questions.map((q: GeneratedQuestion) => ({ ...q, source: "AI" as const })));
      setSaveTitle(`${grade}학년 ${term}학기 ${currentUnit.name} 단원평가`);
    } catch {
      setError("문항 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  }

  function saveEdit(idx: number, updated: GeneratedQuestion) {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? updated : q)));
    setEditingIdx(null);
  }

  function addManualQuestion(q: GeneratedQuestion) {
    setQuestions((qs) => [...qs, q]);
    setAddingManual(false);
    if (!saveTitle) setSaveTitle(`${grade}학년 ${term}학기 ${currentUnit?.name ?? ""} 단원평가`);
  }

  async function handleSave() {
    if (!saveTitle.trim() || questions.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: saveTitle.trim(), questions, unitId: unitId || units[0]?.id }),
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
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <nav className="mb-8 flex items-center justify-between">
        <Link href="/teacher" className="text-sm font-bold text-brand">← 대시보드</Link>
      </nav>

      <h1 className="font-display text-3xl font-bold sm:text-4xl">AI로 문항 만들기</h1>
      <p className="mt-2 text-sm text-ink/60">
        단원과 조건을 고르면 AI가 초안을 만들어요. 생성 후 자유롭게 수정·삭제하세요.
      </p>

      {/* 생성 조건 */}
      <div className="card mt-6 space-y-4 p-5 sm:p-6">
        {/* 학년·학기·단원 */}
        <div className="flex flex-wrap gap-3">
          <Field label="학년">
            {gradesLoading ? (
              <div className="select flex items-center text-ink/40">불러오는 중…</div>
            ) : (
              <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="select">
                {grades.map((g) => (
                  <option key={g} value={g}>{g}학년</option>
                ))}
              </select>
            )}
          </Field>
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
                  <option key={u.id} value={u.id}>{u.order}. {u.name}</option>
                ))}
              </select>
            )}
          </Field>
        </div>

        {/* 생성 옵션 */}
        <div className="flex flex-wrap gap-3">
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
          {loading ? "AI가 만드는 중…" : "✨ AI로 문항 생성"}
        </button>

        {loading && <GenerationLoader count={count} />}

        {/* 에러 (rate limit 또는 일반) */}
        {error && !loading && (
          <div className="rounded-xl border-2 border-coral/30 bg-coral/5 px-4 py-3">
            <div className="flex items-start gap-3">
              <p className="flex-1 text-sm font-bold text-coral">{error}</p>
              {!rateLimited && (
                <button
                  onClick={handleGenerate}
                  disabled={!currentUnit}
                  className="shrink-0 rounded-lg border-2 border-coral px-3 py-1.5 text-xs font-bold text-coral hover:bg-coral hover:text-white transition"
                >
                  재시도
                </button>
              )}
            </div>
            {errorHint && (
              <p className="mt-1.5 text-xs text-ink/50">{errorHint}</p>
            )}
          </div>
        )}
      </div>

      {/* 생성 결과 */}
      {(questions.length > 0 || addingManual) && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">
              문항 {questions.length}개
            </h2>
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={questions.length === 0}
              className="card bg-mint/30 px-4 py-2 text-sm font-bold text-ink transition hover:-translate-y-0.5 disabled:opacity-40"
            >
              테스트로 저장
            </button>
          </div>
          {questions.some((q) => q.source === "AI") && (
            <p className="mt-1 text-sm text-ink/50">
              ⚠️ AI 생성 문항입니다. 교육과정 적합성과 정답을 반드시 확인하세요.
            </p>
          )}

          <div className="mt-4 space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="card p-4 sm:p-5">
                {editingIdx === i ? (
                  <QuestionEditor
                    initial={q}
                    onSave={(updated) => saveEdit(i, updated)}
                    onCancel={() => setEditingIdx(null)}
                  />
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap gap-1.5 text-xs font-bold">
                          <span className="rounded-full bg-ink/10 px-2 py-0.5">
                            {q.type === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                          </span>
                          <span className="rounded-full bg-sun/30 px-2 py-0.5">
                            난이도 {q.difficulty === "EASY" ? "하" : q.difficulty === "MEDIUM" ? "중" : "상"}
                          </span>
                          {q.source === "MANUAL" && (
                            <span className="rounded-full bg-coral/20 px-2 py-0.5 text-coral">직접 작성</span>
                          )}
                        </div>
                        <p className="font-bold text-sm sm:text-base">{i + 1}. {q.stem}</p>
                        {q.type === "MULTIPLE_CHOICE" ? (
                          <ul className="mt-2 space-y-1">
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
                          <p className="mt-2 text-sm">
                            <span className="font-bold">정답:</span>{" "}
                            {q.answerKeywords.join(" / ")}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="mt-2 rounded-lg bg-brand/5 px-3 py-2 text-sm text-ink/70">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <button
                          onClick={() => { setEditingIdx(i); setAddingManual(false); }}
                          className="rounded-lg border-2 border-brand px-2 py-1 text-xs font-bold text-brand transition hover:bg-brand hover:text-white"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => removeQuestion(i)}
                          className="rounded-lg border-2 border-coral px-2 py-1 text-xs font-bold text-coral transition hover:bg-coral hover:text-white"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 직접 추가 폼 */}
            {addingManual && (
              <div className="card border-2 border-dashed border-brand/40 p-4 sm:p-5">
                <p className="mb-3 text-sm font-bold text-brand">✏️ 직접 문항 작성</p>
                <QuestionEditor
                  initial={EMPTY_QUESTION}
                  isNew
                  onSave={addManualQuestion}
                  onCancel={() => setAddingManual(false)}
                />
              </div>
            )}
          </div>

          {/* 직접 추가 버튼 */}
          {!addingManual && editingIdx === null && (
            <button
              onClick={() => setAddingManual(true)}
              className="mt-4 w-full rounded-xl border-2 border-dashed border-brand/40 py-3 text-sm font-bold text-brand transition hover:border-brand hover:bg-brand/5"
            >
              + 직접 문항 추가
            </button>
          )}
        </div>
      )}

      {/* 문항이 없고 직접 추가만 원하는 경우 */}
      {questions.length === 0 && !addingManual && !loading && (
        <div className="mt-4">
          {addingManual ? null : (
            <button
              onClick={() => setAddingManual(true)}
              className="w-full rounded-xl border-2 border-dashed border-ink/20 py-3 text-sm font-bold text-ink/50 transition hover:border-brand/40 hover:text-brand"
            >
              또는 직접 문항 추가
            </button>
          )}
        </div>
      )}
      {addingManual && questions.length === 0 && (
        <div className="mt-4">
          <div className="card border-2 border-dashed border-brand/40 p-4 sm:p-5">
            <p className="mb-3 text-sm font-bold text-brand">✏️ 직접 문항 작성</p>
            <QuestionEditor
              initial={EMPTY_QUESTION}
              isNew
              onSave={addManualQuestion}
              onCancel={() => setAddingManual(false)}
            />
          </div>
        </div>
      )}

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-4 sm:items-center sm:pb-0">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display text-xl font-bold">테스트로 저장</h3>
            <p className="mt-1 text-sm text-ink/60">문항 {questions.length}개가 저장됩니다.</p>

            <label className="mt-4 block">
              <span className="text-sm font-bold">테스트 제목</span>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder={`예: ${grade}학년 ${term}학기 단원평가`}
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
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="min-w-[80px] flex-1">
      <span className="mb-1 block text-sm font-bold text-ink/70">{label}</span>
      {children}
    </label>
  );
}
