"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { IconCheck, IconFilter, IconList } from "@/components/icons";
import {
  DIFFICULTY_LABEL,
  PREVIEW_BANK,
  PREVIEW_UNITS,
  type PreviewQuestion,
} from "@/lib/design-preview-data";

/**
 * 교사 시험지 만들기 — 디자인 시안 (목 데이터)
 * AI 생성 버튼은 UI에서만 숨김. API/DB 호출 없음.
 */
export default function DesignTeacherPage() {
  const [unit, setUnit] = useState<string>("나눗셈");
  const [difficulty, setDifficulty] = useState<"ALL" | PreviewQuestion["difficulty"]>("ALL");
  const [mode, setMode] = useState<"UNIT" | "PICK">("PICK");
  const [selected, setSelected] = useState<string[]>(["pq1", "pq2", "pq3"]);
  const [savedFlash, setSavedFlash] = useState(false);

  const filtered = useMemo(() => {
    return PREVIEW_BANK.filter((q) => {
      if (unit !== "전체" && q.unit !== unit) return false;
      if (difficulty !== "ALL" && q.difficulty !== difficulty) return false;
      return true;
    });
  }, [unit, difficulty]);

  const selectedQuestions = useMemo(() => {
    if (mode === "UNIT") return filtered;
    return PREVIEW_BANK.filter((q) => selected.includes(q.id));
  }, [mode, filtered, selected]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const set = new Set(prev);
      filtered.forEach((q) => set.add(q.id));
      return Array.from(set);
    });
  }

  function handleSave() {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  }

  return (
    <div className="min-h-screen">
      <div className="design-banner">디자인 시안 · 교사 시험지 만들기 · 로그인/API 없이 미리보기</div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/design" className="text-sm font-bold text-brand">
            ← 시안 목록
          </Link>
          <span className="hidden text-ink/20 sm:inline">|</span>
          <Link href="/" className="font-display hidden text-xl font-bold text-brandink sm:inline">
            단평<span className="text-brand">GO</span>
          </Link>
        </div>
        <p className="text-sm font-bold text-ink/50">초등 3학년 수학</p>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">시험지 만들기</h1>
          <p className="mt-1 text-base text-ink/60">
            검수된 문항을 골라 미리보기를 확인한 뒤 저장하세요.
          </p>
        </div>

        {/* AI 생성 버튼 — UI에서만 숨김 (기능 코드는 실서비스 화면에 유지) */}
        {/* SHOW_AI_GENERATE === false */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── 시험지 미리보기 (중심) ── */}
          <section className="order-1 lg:order-1">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink/8 bg-brand/[0.03] px-5 py-3">
                <div>
                  <p className="text-xs font-bold text-brand">시험지 미리보기</p>
                  <h2 className="text-lg font-bold">
                    3학년 1학기 {unit === "전체" ? "수학" : unit} 단원평가
                  </h2>
                </div>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand tabular-nums">
                  {selectedQuestions.length}문항
                </span>
              </div>

              <div className="space-y-5 p-5 sm:p-7">
                {selectedQuestions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-ink/15 px-4 py-16 text-center">
                    <IconList className="mx-auto text-ink/25" size={32} />
                    <p className="mt-3 text-base font-bold text-ink/50">선택된 문항이 없습니다</p>
                    <p className="mt-1 text-sm text-ink/40">오른쪽(또는 아래) 패널에서 문항을 골라 주세요</p>
                  </div>
                ) : (
                  selectedQuestions.map((q, i) => (
                    <article key={q.id} className="border-b border-ink/6 pb-5 last:border-0 last:pb-0">
                      <div className="mb-2 flex flex-wrap gap-1.5 text-xs font-bold">
                        <span className="rounded-md bg-ink/5 px-2 py-0.5">{q.unit}</span>
                        <span className="rounded-md bg-brand/8 px-2 py-0.5 text-brand">
                          난이도 {DIFFICULTY_LABEL[q.difficulty]}
                        </span>
                        <span className="rounded-md bg-ink/5 px-2 py-0.5">
                          {q.type === "MULTIPLE_CHOICE" ? "객관식" : "단답형"}
                        </span>
                      </div>
                      <p className="text-base font-bold leading-relaxed sm:text-lg">
                        <span className="mr-1.5 text-brand">{i + 1}.</span>
                        {q.stem}
                      </p>
                      {q.type === "MULTIPLE_CHOICE" ? (
                        <ul className="mt-3 space-y-1.5">
                          {q.choices.map((c) => (
                            <li
                              key={c.id}
                              className="rounded-lg bg-ink/[0.03] px-3 py-2 text-base text-ink/80"
                            >
                              {["①", "②", "③", "④"][c.order - 1]} {c.text}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 rounded-lg border border-dashed border-ink/15 px-3 py-3 text-sm text-ink/40">
                          단답형 답안 입력란
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* ── 문항 선택 패널 (옆/아래) ── */}
          <aside className="order-2 lg:order-2">
            <div className="card sticky top-4 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/8 text-brand">
                  <IconFilter size={16} />
                </span>
                <h3 className="font-bold">문항 선택</h3>
              </div>

              {/* 모드 */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("UNIT")}
                  className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition ${
                    mode === "UNIT"
                      ? "border-brand bg-brand/8 text-brand"
                      : "border-ink/12 text-ink/60 hover:border-ink/25"
                  }`}
                >
                  단원 전체
                </button>
                <button
                  type="button"
                  onClick={() => setMode("PICK")}
                  className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition ${
                    mode === "PICK"
                      ? "border-brand bg-brand/8 text-brand"
                      : "border-ink/12 text-ink/60 hover:border-ink/25"
                  }`}
                >
                  직접 선택
                </button>
              </div>

              <label className="block text-sm font-bold text-ink/70">
                단원
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="select mt-1"
                >
                  <option value="전체">전체</option>
                  {PREVIEW_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-3 block text-sm font-bold text-ink/70">
                난이도
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as "ALL" | PreviewQuestion["difficulty"])
                  }
                  className="select mt-1"
                >
                  <option value="ALL">전체</option>
                  <option value="EASY">하</option>
                  <option value="MEDIUM">중</option>
                  <option value="HARD">상</option>
                </select>
              </label>

              {mode === "PICK" && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm text-ink/50">{filtered.length}문항</p>
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-sm font-bold text-brand hover:underline"
                  >
                    필터 결과 모두 선택
                  </button>
                </div>
              )}

              {mode === "UNIT" ? (
                <p className="mt-4 rounded-xl bg-brand/5 px-3 py-3 text-sm leading-relaxed text-ink/70">
                  <strong className="text-brand">단원 전체</strong> 모드입니다. 필터에 맞는{" "}
                  <strong>{filtered.length}문항</strong>이 시험지에 담깁니다.
                </p>
              ) : (
                <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {filtered.map((q) => {
                    const on = selected.includes(q.id);
                    return (
                      <li key={q.id}>
                        <button
                          type="button"
                          onClick={() => toggle(q.id)}
                          className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition ${
                            on
                              ? "border-brand bg-brand/[0.06]"
                              : "border-ink/10 hover:border-ink/20"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              on ? "border-brand bg-brand text-white" : "border-ink/25"
                            }`}
                          >
                            {on && <IconCheck size={12} />}
                          </span>
                          <span className="min-w-0">
                            <span className="mb-1 flex flex-wrap gap-1 text-[11px] font-bold text-ink/45">
                              <span>{DIFFICULTY_LABEL[q.difficulty]}</span>
                              <span>·</span>
                              <span>{q.type === "MULTIPLE_CHOICE" ? "객관식" : "단답"}</span>
                            </span>
                            <span className="block text-sm font-bold leading-snug">{q.stem}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {filtered.length === 0 && (
                    <li className="py-8 text-center text-sm text-ink/40">조건에 맞는 문항이 없습니다</li>
                  )}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* 하단 단일 주요 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/8 bg-white/95 backdrop-blur-sm safe-bottom">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-sm font-bold text-ink/60 tabular-nums">
            선택 <span className="text-brand">{selectedQuestions.length}</span>문항
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={selectedQuestions.length === 0}
            className="btn-primary !min-w-[180px]"
          >
            {savedFlash ? "시안 저장됨" : "시험지 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
