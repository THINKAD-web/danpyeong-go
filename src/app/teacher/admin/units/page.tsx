"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ── 타입 ──────────────────────────────────────────────────

type Subject = {
  id: string;
  name: string;
  grade: number;
  _count: { units: number };
};

type Unit = {
  id: string;
  term: number;
  order: number;
  name: string;
  achievementStandard: string | null;
  constraints: string | null;
  isArchived: boolean;
  _count: { questions: number };
};

// ── 빈 폼 초기값 ──────────────────────────────────────────

const emptyUnitForm = () => ({
  term: 1,
  order: 1,
  name: "",
  achievementStandard: "",
  constraints: "",
});

// ── 컴포넌트 ──────────────────────────────────────────────

export default function AdminUnitsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 과목 추가 폼
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: "", grade: 3 });
  const [subjectSaving, setSubjectSaving] = useState(false);

  // 단원 추가/수정 폼
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitForm, setUnitForm] = useState(emptyUnitForm());
  const [unitSaving, setUnitSaving] = useState(false);

  // 메시지
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "warn" | "err" } | null>(null);

  function showToast(msg: string, type: "ok" | "warn" | "err" = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // 과목 목록 로드
  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subjects");
      const data = await res.json();
      setSubjects(data.subjects ?? []);
      if (!selectedSubjectId && data.subjects?.length > 0) {
        setSelectedSubjectId(data.subjects[0].id);
      }
    } catch {
      setError("과목 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId]);

  // 단원 목록 로드
  const loadUnits = useCallback(async (subjectId: string) => {
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}/units`);
      const data = await res.json();
      setUnits(data.units ?? []);
    } catch {
      showToast("단원 목록을 불러오지 못했습니다.", "err");
    }
  }, []);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);
  useEffect(() => {
    if (selectedSubjectId) loadUnits(selectedSubjectId);
  }, [selectedSubjectId, loadUnits]);

  // 과목 추가
  async function handleAddSubject() {
    setSubjectSaving(true);
    try {
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subjectForm.name, grade: Number(subjectForm.grade) }),
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? "과목 추가 실패", "err");
        return;
      }
      const d = await res.json();
      showToast("과목이 추가됐습니다.", "ok");
      setShowAddSubject(false);
      setSubjectForm({ name: "", grade: 3 });
      await loadSubjects();
      setSelectedSubjectId(d.subject.id);
    } finally {
      setSubjectSaving(false);
    }
  }

  // 단원 폼 열기
  function openAddUnit() {
    setEditingUnit(null);
    setUnitForm(emptyUnitForm());
    setShowUnitForm(true);
  }

  function openEditUnit(u: Unit) {
    setEditingUnit(u);
    setUnitForm({
      term: u.term,
      order: u.order,
      name: u.name,
      achievementStandard: u.achievementStandard ?? "",
      constraints: u.constraints ?? "",
    });
    setShowUnitForm(true);
  }

  // 단원 저장 (추가 or 수정)
  async function handleSaveUnit() {
    if (!selectedSubjectId) return;
    setUnitSaving(true);
    try {
      const payload = {
        term: Number(unitForm.term),
        order: Number(unitForm.order),
        name: unitForm.name.trim(),
        achievementStandard: unitForm.achievementStandard.trim() || null,
        constraints: unitForm.constraints.trim() || null,
      };

      let res: Response;
      if (editingUnit) {
        res = await fetch(`/api/admin/units/${editingUnit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/subjects/${selectedSubjectId}/units`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const d = await res.json();
        showToast(d.error ?? "저장 실패", "err");
        return;
      }
      showToast(editingUnit ? "단원이 수정됐습니다." : "단원이 추가됐습니다.", "ok");
      setShowUnitForm(false);
      loadUnits(selectedSubjectId);
    } finally {
      setUnitSaving(false);
    }
  }

  // 단원 삭제
  async function handleDeleteUnit(u: Unit) {
    const label = u._count.questions > 0
      ? `"${u.name}" 단원에 문항 ${u._count.questions}개가 있습니다. 보관 처리(soft-delete)합니다. 계속할까요?`
      : `"${u.name}" 단원을 삭제합니다. 계속할까요?`;
    if (!confirm(label)) return;

    const res = await fetch(`/api/admin/units/${u.id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.warning) {
      showToast(d.warning, "warn");
    } else {
      showToast("단원이 삭제됐습니다.", "ok");
    }
    if (selectedSubjectId) loadUnits(selectedSubjectId);
  }

  // ── 렌더 ────────────────────────────────────────────────

  const termGroups: Record<number, Unit[]> = {};
  for (const u of units) {
    if (!termGroups[u.term]) termGroups[u.term] = [];
    termGroups[u.term].push(u);
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* 헤더 */}
      <header className="bg-white border-b border-ink/10 px-6 py-4 flex items-center gap-4">
        <Link href="/teacher" className="text-sm text-ink/50 hover:text-ink">← 대시보드</Link>
        <h1 className="text-lg font-bold text-ink">단원 관리</h1>
      </header>

      {/* 토스트 */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "ok" ? "bg-mint text-white" :
          toast.type === "warn" ? "bg-sun text-ink" :
          "bg-red-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6 flex gap-6">

        {/* 왼쪽: 과목 목록 */}
        <aside className="w-56 shrink-0">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-ink text-sm">과목</span>
              <button
                onClick={() => setShowAddSubject(!showAddSubject)}
                className="text-xs text-mint hover:underline"
              >
                + 추가
              </button>
            </div>

            {showAddSubject && (
              <div className="mb-3 p-3 bg-paper rounded-lg border border-ink/10 text-sm space-y-2">
                <input
                  className="w-full border border-ink/20 rounded px-2 py-1 text-ink"
                  placeholder="과목명 (예: 수학)"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm(f => ({ ...f, name: e.target.value }))}
                />
                <input
                  type="number"
                  className="w-full border border-ink/20 rounded px-2 py-1 text-ink"
                  placeholder="학년"
                  min={1} max={6}
                  value={subjectForm.grade}
                  onChange={(e) => setSubjectForm(f => ({ ...f, grade: Number(e.target.value) }))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSubject}
                    disabled={subjectSaving || !subjectForm.name.trim()}
                    className="flex-1 btn-primary text-xs py-1"
                  >
                    {subjectSaving ? "저장 중…" : "추가"}
                  </button>
                  <button onClick={() => setShowAddSubject(false)} className="flex-1 btn-secondary text-xs py-1">
                    취소
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-xs text-ink/50">불러오는 중…</p>
            ) : error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : (
              <ul className="space-y-1">
                {subjects.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelectedSubjectId(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSubjectId === s.id
                          ? "bg-mint text-white font-medium"
                          : "hover:bg-ink/5 text-ink"
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="ml-1 text-xs opacity-70">{s.grade}학년</span>
                      <span className="ml-1 text-xs opacity-60">({s._count.units})</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* 오른쪽: 단원 목록 */}
        <div className="flex-1 min-w-0">
          {!selectedSubjectId ? (
            <div className="card p-8 text-center text-ink/50 text-sm">왼쪽에서 과목을 선택하세요.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-ink">단원 목록</h2>
                <button onClick={openAddUnit} className="btn-primary text-sm">+ 단원 추가</button>
              </div>

              {/* 단원 추가/수정 폼 */}
              {showUnitForm && (
                <div className="card p-5 mb-4 border-2 border-mint/30">
                  <h3 className="font-semibold text-ink mb-4 text-sm">
                    {editingUnit ? `단원 수정: ${editingUnit.name}` : "새 단원 추가"}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="block text-ink/60 mb-1">학기</label>
                      <select
                        className="w-full border border-ink/20 rounded px-2 py-1.5 text-ink"
                        value={unitForm.term}
                        onChange={(e) => setUnitForm(f => ({ ...f, term: Number(e.target.value) }))}
                      >
                        <option value={1}>1학기</option>
                        <option value={2}>2학기</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-ink/60 mb-1">순서</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full border border-ink/20 rounded px-2 py-1.5 text-ink"
                        value={unitForm.order}
                        onChange={(e) => setUnitForm(f => ({ ...f, order: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-ink/60 mb-1">단원명 *</label>
                      <input
                        className="w-full border border-ink/20 rounded px-2 py-1.5 text-ink"
                        placeholder="예: 나눗셈"
                        value={unitForm.name}
                        onChange={(e) => setUnitForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-ink/60 mb-1">성취기준 (선택)</label>
                      <input
                        className="w-full border border-ink/20 rounded px-2 py-1.5 text-ink"
                        placeholder="예: [3수02-01] 나눗셈의 의미를 알고…"
                        value={unitForm.achievementStandard}
                        onChange={(e) => setUnitForm(f => ({ ...f, achievementStandard: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-ink/60 mb-1">
                        AI 생성 제약 <span className="text-xs text-ink/40">(비워두면 단원명 기반 기본값 적용)</span>
                      </label>
                      <textarea
                        className="w-full border border-ink/20 rounded px-2 py-1.5 text-ink h-24 resize-y text-xs font-mono"
                        placeholder={`예) 나눗셈: stem에 사용하는 수는 반드시 나누어 떨어지는 수만 선택하거나, 나머지를 묻는 형태로 명시할 것.`}
                        value={unitForm.constraints}
                        onChange={(e) => setUnitForm(f => ({ ...f, constraints: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSaveUnit}
                      disabled={unitSaving || !unitForm.name.trim()}
                      className="btn-primary text-sm"
                    >
                      {unitSaving ? "저장 중…" : "저장"}
                    </button>
                    <button onClick={() => setShowUnitForm(false)} className="btn-secondary text-sm">취소</button>
                  </div>
                </div>
              )}

              {/* 단원 목록 (학기별) */}
              {[1, 2].map((term) => {
                const termUnits = termGroups[term] ?? [];
                if (termUnits.length === 0) return null;
                return (
                  <div key={term} className="mb-6">
                    <h3 className="text-sm font-semibold text-ink/60 mb-2">{term}학기</h3>
                    <div className="space-y-2">
                      {termUnits.map((u) => (
                        <div
                          key={u.id}
                          className={`card p-4 flex items-start gap-3 ${u.isArchived ? "opacity-50" : ""}`}
                        >
                          <span className="w-6 h-6 rounded-full bg-mint/20 text-mint text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {u.order}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink text-sm">{u.name}</span>
                              {u.isArchived && (
                                <span className="text-xs px-1.5 py-0.5 bg-ink/10 text-ink/50 rounded">보관됨</span>
                              )}
                              <span className="text-xs text-ink/40">문항 {u._count.questions}개</span>
                            </div>
                            {u.achievementStandard && (
                              <p className="text-xs text-ink/50 mt-0.5 truncate">{u.achievementStandard}</p>
                            )}
                            {u.constraints && (
                              <p className="text-xs text-blue-600/70 mt-0.5 truncate font-mono">
                                제약: {u.constraints.slice(0, 80)}{u.constraints.length > 80 ? "…" : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => openEditUnit(u)}
                              className="text-xs text-ink/50 hover:text-ink px-2 py-1 rounded border border-ink/15 hover:border-ink/30"
                            >
                              수정
                            </button>
                            {!u.isArchived && (
                              <button
                                onClick={() => handleDeleteUnit(u)}
                                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded border border-red-200 hover:border-red-400"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {units.length === 0 && (
                <div className="card p-8 text-center text-ink/40 text-sm">
                  단원이 없습니다. &ldquo;+ 단원 추가&rdquo; 버튼으로 추가하세요.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
