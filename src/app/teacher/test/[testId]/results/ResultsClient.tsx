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
import type { TestStats, StudentRow, StudentDetail } from "@/lib/stats";

const WEAK_THRESHOLD = 60;
const LOW_SCORE_THRESHOLD = 60;
const CIRCLE = ["①", "②", "③", "④"];

type SortKey = "name" | "pct" | "submittedAt";

export function ResultsClient({ stats }: { stats: TestStats }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) { setSortKey(key); setSortAsc(!sortAsc); }
    else { setSortKey(key); setSortAsc(true); }
  }

  const filtered = useMemo(() => {
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

  const detailMap = useMemo(() => {
    const m = new Map<string, StudentDetail>();
    for (const d of stats.studentDetails) m.set(d.attemptId, d);
    return m;
  }, [stats.studentDetails]);

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
          <p className="mt-1 text-sm font-bold text-coral">
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
                  <Cell key={i} fill={entry.weak ? "#FF6B6B" : "#4ECDC4"} />
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
              취약 문항
            </span>
          </div>
        </div>

        {/* 취약 문항 + 오답 분포 */}
        {weakQuestions.length > 0 && (
          <div className="mt-3 space-y-3">
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
                {q.type === "MULTIPLE_CHOICE" && q.choiceDist.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-bold text-ink/50">오답 분포</p>
                    {q.choiceDist.map((cd) => {
                      const pct = q.totalCount > 0 ? Math.round((cd.count / q.totalCount) * 100) : 0;
                      return (
                        <div key={cd.choiceOrder} className="flex items-center gap-2 text-xs">
                          <span className={`w-5 font-bold ${cd.isCorrect ? "text-mint" : "text-ink/50"}`}>
                            {CIRCLE[cd.choiceOrder - 1]}
                          </span>
                          <span className={`flex-1 truncate ${cd.isCorrect ? "font-bold text-green-700" : "text-ink/70"}`}>
                            {cd.choiceText}
                            {cd.isCorrect && " ✓정답"}
                          </span>
                          <span className="w-8 text-right font-bold text-ink/60">{cd.count}명</span>
                          <div className="w-20 overflow-hidden rounded-full bg-ink/10 h-1.5">
                            <div
                              className={`h-full rounded-full ${cd.isCorrect ? "bg-mint" : "bg-coral/60"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-ink/40">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 문항별 오답 분포 전체 ─── */}
      {stats.questions.some((q) => q.type === "MULTIPLE_CHOICE" && q.totalCount > 0) && (
        <section>
          <h2 className="font-display text-xl font-bold">문항별 오답 분포</h2>
          <p className="mt-1 text-sm text-ink/50">각 문항에서 학생들이 어떤 보기를 선택했는지 확인하세요.</p>
          <div className="mt-4 space-y-3">
            {stats.questions
              .filter((q) => q.type === "MULTIPLE_CHOICE" && q.totalCount > 0)
              .map((q) => (
                <div key={q.order} className="card p-4">
                  <p className="text-xs font-bold text-ink/50">Q{q.order}</p>
                  <p className="mt-0.5 text-sm font-bold">{q.stem}</p>
                  <div className="mt-2 space-y-1">
                    {q.choiceDist.map((cd) => {
                      const pct = q.totalCount > 0 ? Math.round((cd.count / q.totalCount) * 100) : 0;
                      return (
                        <div key={cd.choiceOrder} className="flex items-center gap-2 text-xs">
                          <span className={`w-5 font-bold ${cd.isCorrect ? "text-mint" : "text-ink/40"}`}>
                            {CIRCLE[cd.choiceOrder - 1]}
                          </span>
                          <span className={`min-w-0 flex-1 truncate ${cd.isCorrect ? "font-bold text-green-700" : "text-ink/70"}`}>
                            {cd.choiceText}{cd.isCorrect && " ✓"}
                          </span>
                          <span className="w-8 shrink-0 text-right font-bold">{cd.count}명</span>
                          <div className="w-16 shrink-0 overflow-hidden rounded-full bg-ink/10 h-1.5">
                            <div
                              className={`h-full rounded-full ${cd.isCorrect ? "bg-mint" : "bg-coral/50"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─── 학생별 점수 테이블 ─── */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold">
            학생별 점수
            {lowStudents.length > 0 && (
              <span className="ml-2 text-sm font-normal text-coral">
                하위권 {lowStudents.length}명
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

        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="card py-8 text-center text-ink/40">검색 결과가 없어요</div>
          ) : (
            filtered.map((s) => {
              const detail = detailMap.get(s.attemptId);
              const expanded = expandedStudent === s.attemptId;
              return (
                <div
                  key={s.attemptId}
                  className={`card overflow-hidden transition-all ${s.pct < LOW_SCORE_THRESHOLD ? "border-coral/30" : ""}`}
                >
                  {/* 학생 행 */}
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink/5 transition"
                    onClick={() => setExpandedStudent(expanded ? null : s.attemptId)}
                  >
                    <div className="flex-1">
                      <span className="font-bold">{s.studentName}</span>
                      {s.pct < LOW_SCORE_THRESHOLD && (
                        <span className="ml-1.5 text-xs text-coral">하위권</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-display text-lg font-bold ${
                        s.pct >= 80 ? "text-green-700" : s.pct >= LOW_SCORE_THRESHOLD ? "text-ink" : "text-coral"
                      }`}>
                        {s.pct}점
                      </span>
                      <span className="text-xs text-ink/40">{s.score}/{s.maxScore}</span>
                      <span className="text-xs text-ink/30">
                        {new Date(s.submittedAt).toLocaleString("ko-KR", {
                          month: "2-digit", day: "2-digit",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <span className="text-ink/30 text-sm">{expanded ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {/* 학생 답안 상세 */}
                  {expanded && detail && (
                    <div className="border-t border-ink/10 px-4 py-3">
                      <p className="mb-2 text-xs font-bold text-ink/50">문항별 답안</p>
                      <div className="space-y-2">
                        {detail.answers.map((ans) => {
                          const q = stats.questions.find((q) => q.order === ans.testQuestionOrder);
                          const correct = ans.isCorrect;
                          return (
                            <div
                              key={ans.testQuestionOrder}
                              className={`rounded-xl px-3 py-2 text-sm ${
                                correct ? "bg-mint/10" : correct === false ? "bg-coral/10" : "bg-ink/5"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className={`mt-0.5 shrink-0 font-bold ${
                                  correct ? "text-green-700" : correct === false ? "text-coral" : "text-ink/40"
                                }`}>
                                  {correct ? "✓" : correct === false ? "✗" : "—"} Q{ans.testQuestionOrder}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-xs text-ink/50">{q?.stem.slice(0, 60)}</p>
                                  <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs">
                                    {q?.type === "MULTIPLE_CHOICE" ? (
                                      <>
                                        {ans.selectedChoiceOrder !== null ? (
                                          <span>
                                            학생: <span className={`font-bold ${correct ? "text-green-700" : "text-coral"}`}>
                                              {CIRCLE[ans.selectedChoiceOrder - 1]} {ans.selectedChoiceText}
                                            </span>
                                          </span>
                                        ) : (
                                          <span className="text-ink/30">미응답</span>
                                        )}
                                        {!correct && (
                                          <span className="text-ink/40">
                                            정답: <span className="font-bold text-mint">
                                              {CIRCLE[(q.choiceDist.find((c) => c.isCorrect)?.choiceOrder ?? 1) - 1]}{" "}
                                              {q.choiceDist.find((c) => c.isCorrect)?.choiceText}
                                            </span>
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {ans.textAnswer ? (
                                          <span>
                                            학생: <span className={`font-bold ${correct ? "text-green-700" : "text-coral"}`}>
                                              {ans.textAnswer}
                                            </span>
                                          </span>
                                        ) : (
                                          <span className="text-ink/30">미응답</span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
