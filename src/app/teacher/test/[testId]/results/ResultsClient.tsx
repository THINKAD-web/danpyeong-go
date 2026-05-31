"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { TestStats, StudentRow } from "@/lib/stats";

const WEAK_THRESHOLD = 60; // 정답률 60% 미만 = 취약 문항
const LOW_SCORE_THRESHOLD = 60; // 점수 60점 미만 = 하위권

type SortKey = "name" | "pct" | "submittedAt";

export function ResultsClient({ stats }: { stats: TestStats }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSort(key, !sortAsc);
    else setSort(key, true);
  }
  function setSort(key: SortKey, asc: boolean) {
    setSortKey(key);
    setSortAsc(asc);
  }

  const filtered: StudentRow[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? stats.students.filter((s) => s.studentName.toLowerCase().includes(q))
      : [...stats.students];

    rows.sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.studentName.localeCompare(b.studentName, "ko");
      else if (sortKey === "pct") diff = a.pct - b.pct;
      else diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return sortAsc ? diff : -diff;
    });
    return rows;
  }, [stats.students, search, sortKey, sortAsc]);

  const chartData = stats.questions.map((q) => ({
    name: `Q${q.order}`,
    rate: q.correctRate,
    stem: q.stem,
    weak: q.correctRate < WEAK_THRESHOLD,
  }));

  const weakQuestions = stats.questions.filter((q) => q.correctRate < WEAK_THRESHOLD);
  const lowStudents = filtered.filter((s) => s.pct < LOW_SCORE_THRESHOLD);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortAsc ? " ▲" : " ▼") : " ↕";

  return (
    <div className="mt-8 space-y-10">
      {/* ─── 문항별 정답률 차트 ─── */}
      <section>
        <h2 className="font-display text-xl font-bold">문항별 정답률</h2>
        {weakQuestions.length > 0 && (
          <p className="mt-1 text-sm text-coral font-bold">
            ⚠️ 취약 문항 {weakQuestions.length}개 (정답률 {WEAK_THRESHOLD}% 미만):{" "}
            {weakQuestions.map((q) => `Q${q.order}`).join(", ")}
          </p>
        )}

        <div className="card mt-4 p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontWeight: 700, fontSize: 13 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value}%`, "정답률"]}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as { stem?: string; rate?: number };
                  return (
                    <div className="rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-xs shadow">
                      <p className="font-bold">{label}</p>
                      {item.stem && <p className="mt-0.5 max-w-[200px] text-ink/70">{item.stem.slice(0, 50)}</p>}
                      <p className="mt-1 font-bold text-brand">정답률: {item.rate}%</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.weak ? "#FF6B6B" : "#4ECDC4"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-4 text-xs text-ink/60">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm bg-[#4ECDC4]" />
              정답률 {WEAK_THRESHOLD}% 이상
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm bg-[#FF6B6B]" />
              취약 문항 ({WEAK_THRESHOLD}% 미만)
            </span>
          </div>
        </div>

        {/* 취약 문항 상세 */}
        {weakQuestions.length > 0 && (
          <div className="mt-3 space-y-2">
            {weakQuestions.map((q) => (
              <div key={q.order} className="card border-l-4 border-coral p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-coral">Q{q.order} — 정답률 {q.correctRate}%</span>
                    <p className="mt-0.5 text-sm font-bold leading-snug">{q.stem}</p>
                  </div>
                  <span className="shrink-0 text-sm text-ink/50">
                    {q.correctCount}/{q.totalCount}명 정답
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 학생별 점수 테이블 ─── */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold">
            학생별 점수
            {lowStudents.length > 0 && (
              <span className="ml-2 text-sm font-normal text-coral">
                하위권 {lowStudents.length}명 ({LOW_SCORE_THRESHOLD}점 미만)
              </span>
            )}
          </h2>
          <input
            type="text"
            placeholder="이름 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-ink/30 px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none sm:w-40"
          />
        </div>

        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink/10">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => toggleSort("name")}
                    className="font-bold hover:text-brand"
                  >
                    이름<SortIcon k="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleSort("pct")}
                    className="font-bold hover:text-brand"
                  >
                    점수<SortIcon k="pct" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-bold text-ink/60">
                  원점수
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleSort("submittedAt")}
                    className="font-bold hover:text-brand"
                  >
                    제출 시각<SortIcon k="submittedAt" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink/40">
                    검색 결과가 없어요
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.attemptId}
                    className={`border-b border-ink/5 transition hover:bg-ink/5 ${
                      s.pct < LOW_SCORE_THRESHOLD ? "bg-coral/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold">
                      {s.studentName}
                      {s.pct < LOW_SCORE_THRESHOLD && (
                        <span className="ml-1 text-xs text-coral">하위권</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-display text-lg font-bold ${
                          s.pct >= 80
                            ? "text-green-700"
                            : s.pct >= LOW_SCORE_THRESHOLD
                            ? "text-ink"
                            : "text-coral"
                        }`}
                      >
                        {s.pct}점
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-ink/60">
                      {s.score}/{s.maxScore}
                    </td>
                    <td className="px-4 py-3 text-right text-ink/50">
                      {new Date(s.submittedAt).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
