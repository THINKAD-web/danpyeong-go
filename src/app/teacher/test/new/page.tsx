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

/** 베타 시안: AI 생성 버튼은 UI에서만 숨김 (핸들러·API 호출 코드는 유지) */
const SHOW_AI_GENERATE = false;

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
  const [countStr, setCountStr] = useState("5");
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
        body: JSON.stringify({ unitId, grade, term, count, difficulty, type }),
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <nav className="mb-6 flex items-center justify-between">
        <Link href="/teacher" className="text-sm font-bold text-brand">← 대시보드</Link>
        <Link href="/design/teacher" className="text-xs font-bold text-ink/40 hover:text-brand">
          시안 미리보기
        </Link>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">시험지 만들기</h1>
      <p className="mt-2 text-base text-ink/60">
        단원·난이도를 고른 뒤 문항을 담아 시험지를 완성하세요. 미리보기는 화면 중앙에서 확인합니다.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 시험지 미리보기 (중심) */}
        <section className="order-1">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink/8 bg-brand/[0.03] px-5 py-3">
              <div>
                <p className="text-xs font-bold text-brand">시험지 미리보기</p>
                <h2 className="text-lg font-bold">
                  {saveTitle || `${grade}학년 ${term}학기 ${currentUnit?.name ?? ""} 단원평가`}
                </h2>
              </div>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand tabular-nums">
                {questions.length}문항
              </span>
            </div>

            <div className="space-y-4 p-5">
              {questions.length === 0 && !addingManual && (
                <div className="rounded-xl border border-dashed border-ink/15 px-4 py-14 text-center">
                  <p className="text-base font-bold text-ink/50">아직 담긴 문항이 없습니다</p>
                  <p className="mt-1 text-sm text-ink/40">옆 패널에서 조건을 고르거나 직접 문항을 추가하세요</p>
                </div>
              )}

              {questions.map((q, i) => (
                <div key={i} className="border-b border-ink/6 pb-4 last:border-0 last:pb-0">
                  {editingIdx === i ? (
                    <QuestionEditor
                      initial={q}
                      onSave={(updated) => saveEdit(i, updated)}
                      onCancel={() => setEditingIdx(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap gap-1.5 text-xs font-bold">
                          <span className="rounded-md bg-ink/8 px-2 py-0.5">
                            {q.type === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                          </span>
                          <span className="rounded-md bg-brand/8 px-2 py-0.5 text-brand">
                            난이도 {q.difficulty === "EASY" ? "하" : q.difficulty === "MEDIUM" ? "중" : "상"}
                          </span>
                          {q.source === "MANUAL" && (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-700">직접 작성</span>
                          )}
                        </div>
                        <p className="text-base font-bold">{i + 1}. {q.stem}</p>
                        {q.type === "MULTIPLE_CHOICE" ? (
                          <ul className="mt-2 space-y-1">
                            {q.choices.map((c) => (
                              <li
                                key={c.order}
                                className={`rounded-lg px-3 py-1.5 text-sm ${
                                  c.isCorrect ? "bg-green-50 font-bold text-green-800" : "bg-ink/5"
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
                            {q.explanation}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <button
                          onClick={() => { setEditingIdx(i); setAddingManual(false); }}
                          className="rounded-lg border border-brand px-2 py-1 text-xs font-bold text-brand transition hover:bg-brand hover:text-white"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => removeQuestion(i)}
                          className="rounded-lg border border-rose-400 px-2 py-1 text-xs font-bold text-rose-500 transition hover:bg-rose-500 hover:text-white"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {addingManual && (
                <div className="rounded-xl border border-dashed border-brand/40 p-4">
                  <p className="mb-3 text-sm font-bold text-brand">직접 문항 작성</p>
                  <QuestionEditor
                    initial={EMPTY_QUESTION}
                    isNew
                    onSave={addManualQuestion}
                    onCancel={() => setAddingManual(false)}
                  />
                </div>
              )}
            </div>
          </div>

          {questions.length > 0 && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn-primary mt-4 w-full"
            >
              테스트로 저장
            </button>
          )}
        </section>

        {/* 문항 선택/조건 패널 (옆) */}
        <aside className="order-2">
          <div className="card sticky top-4 space-y-4 p-5">
            <h3 className="font-bold">단원 · 난이도 필터</h3>

            <div className="space-y-3">
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
                  <div className="select flex items-center text-sm text-rose-500">{unitsError}</div>
                ) : (
                  <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="select">
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.order}. {u.name}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="난이도">
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="select">
                  <option value="EASY">하</option>
                  <option value="MEDIUM">중</option>
                  <option value="HARD">상</option>
                </select>
              </Field>
              {SHOW_AI_GENERATE && (
                <>
                  <Field label="문항 수">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={countStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        const stripped = raw.replace(/^0+/, "") || "";
                        setCountStr(stripped);
                        const n = parseInt(stripped);
                        if (!isNaN(n) && n >= 1 && n <= 20) setCount(n);
                      }}
                      onBlur={() => {
                        const n = Math.min(20, Math.max(1, parseInt(countStr) || 1));
                        setCount(n);
                        setCountStr(String(n));
                      }}
                      className="select"
                    />
                  </Field>
                  <Field label="유형">
                    <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="select">
                      <option value="MULTIPLE_CHOICE">객관식</option>
                      <option value="SHORT_ANSWER">단답형</option>
                    </select>
                  </Field>
                </>
              )}
            </div>

            {/* AI 생성 버튼 — SHOW_AI_GENERATE가 true일 때만 표시 (핸들러는 유지) */}
            {SHOW_AI_GENERATE && (
              <>
                <button
                  onClick={handleGenerate}
                  disabled={loading || unitsLoading || !!unitsError || !unitId}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? "AI가 만드는 중…" : "AI로 문항 생성"}
                </button>
                {loading && <GenerationLoader count={count} />}
                {error && !loading && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <p className="flex-1 text-sm font-bold text-rose-600">{error}</p>
                      {!rateLimited && (
                        <button
                          onClick={handleGenerate}
                          disabled={!currentUnit}
                          className="shrink-0 rounded-lg border border-rose-400 px-3 py-1.5 text-xs font-bold text-rose-600"
                        >
                          재시도
                        </button>
                      )}
                    </div>
                    {errorHint && <p className="mt-1.5 text-xs text-ink/50">{errorHint}</p>}
                  </div>
                )}
              </>
            )}

            {!SHOW_AI_GENERATE && (
              <p className="rounded-xl bg-brand/5 px-3 py-3 text-sm leading-relaxed text-ink/65">
                검수된 문제은행에서 고르는 흐름으로 전환 중입니다. 지금은{" "}
                <strong>직접 문항 추가</strong>로 시험지를 구성할 수 있습니다.
                <span className="mt-2 block text-xs font-bold text-brand">AI 문항 생성 — 곧 오픈</span>
              </p>
            )}

            {!addingManual && editingIdx === null && (
              <button
                onClick={() => setAddingManual(true)}
                className="w-full rounded-xl border border-dashed border-brand/40 py-3 text-sm font-bold text-brand transition hover:border-brand hover:bg-brand/5"
              >
                + 직접 문항 추가
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-4 sm:items-center sm:pb-0">
          <div className="card w-full max-w-md p-6">
            <h3 className="text-xl font-bold">테스트로 저장</h3>
            <p className="mt-1 text-base text-ink/60">문항 {questions.length}개가 저장됩니다.</p>

            <label className="mt-4 block">
              <span className="text-sm font-bold">테스트 제목</span>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder={`예: ${grade}학년 ${term}학기 단원평가`}
                className="mt-1 w-full rounded-xl border border-ink/20 px-3 py-2.5 text-base font-semibold focus:border-brand focus:outline-none"
                autoFocus
              />
            </label>

            {saveError && <p className="mt-2 text-sm text-rose-500">{saveError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setShowSaveModal(false); setSaveError(null); }}
                className="btn-secondary flex-1"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !saveTitle.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
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
