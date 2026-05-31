import Link from "next/link";
import { notFound } from "next/navigation";
import { computeTestStats } from "@/lib/stats";
import { ResultsClient } from "./ResultsClient";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const stats = await computeTestStats(testId);
  if (!stats) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="mb-8 flex items-center gap-3 text-sm text-ink/60">
        <Link href="/teacher" className="font-bold text-brand">
          ← 대시보드
        </Link>
        <span>/</span>
        <span className="font-bold text-ink">{stats.title}</span>
      </nav>

      <h1 className="font-display text-3xl font-bold">결과 분석</h1>
      <p className="mt-1 text-sm text-ink/50">{stats.title}</p>

      {/* 요약 카드 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <SummaryCard label="응시 인원" value={`${stats.totalAttempts}명`} />
        <SummaryCard label="반 평균" value={`${stats.avgScore}점`} highlight />
        <SummaryCard label="최고점" value={`${stats.maxScore}점`} />
        <SummaryCard label="최저점" value={`${stats.minScore}점`} />
      </div>

      {stats.totalAttempts === 0 ? (
        <div className="card mt-10 p-10 text-center text-ink/40">
          <p className="text-lg font-bold">아직 응시한 학생이 없어요</p>
          <p className="mt-1 text-sm">테스트를 배포하고 학생들이 응시하면 분석이 표시됩니다.</p>
        </div>
      ) : (
        <ResultsClient stats={stats} />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="text-sm text-ink/60">{label}</div>
      <div
        className={`font-display mt-1 text-3xl font-bold ${highlight ? "text-brand" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}
