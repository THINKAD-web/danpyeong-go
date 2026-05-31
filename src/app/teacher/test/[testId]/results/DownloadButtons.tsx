"use client";

import { useState } from "react";
import type { TestStats, StudentRow, QuestionStat } from "@/lib/stats";

// xlsx는 동적 import로 번들에서 분리
async function downloadExcel(stats: TestStats) {
  const XLSX = await import("xlsx");

  // Sheet 1: 학생별 점수
  const studentRows = stats.students.map((s: StudentRow) => ({
    이름: s.studentName,
    "점수(100점 기준)": s.pct,
    원점수: s.score,
    만점: s.maxScore,
    제출시각: new Date(s.submittedAt).toLocaleString("ko-KR"),
    비고: s.pct < 60 ? "하위권" : "",
  }));

  // Sheet 2: 문항별 정답률
  const questionRows = stats.questions.map((q: QuestionStat) => ({
    "문항 번호": q.order,
    문항: q.stem,
    "정답률(%)": q.correctRate,
    정답수: q.correctCount,
    응시수: q.totalCount,
    비고: q.correctRate < 60 ? "취약 문항" : "",
  }));

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(studentRows);
  // 열 너비 설정
  ws1["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws1, "학생별 점수");

  const ws2 = XLSX.utils.json_to_sheet(questionRows);
  ws2["!cols"] = [{ wch: 10 }, { wch: 50 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "문항별 정답률");

  const filename = `${stats.title}_결과리포트.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function DownloadButtons({ stats, testId }: { stats: TestStats; testId: string }) {
  const [xlsxLoading, setXlsxLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExcel() {
    setXlsxLoading(true);
    setError(null);
    try {
      await downloadExcel(stats);
    } catch {
      setError("Excel 다운로드에 실패했습니다.");
    } finally {
      setXlsxLoading(false);
    }
  }

  async function handlePdf() {
    setPdfLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tests/${testId}/report`);
      if (!res.ok) throw new Error("PDF 생성 실패");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${stats.title}_결과리포트.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          onClick={handleExcel}
          disabled={xlsxLoading || stats.totalAttempts === 0}
          className="card flex items-center gap-1.5 bg-[#1D6F42] px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
        >
          <span>↓</span>
          {xlsxLoading ? "생성 중…" : "Excel"}
        </button>
        <button
          onClick={handlePdf}
          disabled={pdfLoading || stats.totalAttempts === 0}
          className="card flex items-center gap-1.5 bg-coral px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
        >
          <span>↓</span>
          {pdfLoading ? "생성 중…" : "PDF"}
        </button>
      </div>
      {stats.totalAttempts === 0 && (
        <p className="text-xs text-ink/40">응시 데이터가 있어야 다운로드할 수 있어요</p>
      )}
      {error && <p className="text-xs text-coral">{error}</p>}
    </div>
  );
}
