import Link from "next/link";
import { notFound } from "next/navigation";
import { currentTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTestStats } from "@/lib/stats";
import { ResultsClient } from "./ResultsClient";
import { DownloadButtons } from "./DownloadButtons";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;

  // 소유권 확인: 다른 교사의 결과에 접근하지 못하도록
  const teacher = await currentTeacher();
  const author = await prisma.user.findUnique({ where: { clerkId: teacher.id } });
  if (!author) notFound();
  const owned = await prisma.test.findFirst({ where: { id: testId, ownerId: author.id } });
  if (!owned) notFound();

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

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">결과 분석</h1>
          <p className="mt-1 text-sm text-ink/50">{stats.title}</p>
        </div>
        <DownloadButtons stats={stats} testId={testId} />
      </div>

      {/* 요약 카드 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <SummaryCard label="응시 인원" value={`${stats.totalAttempts}명`} />
        <SummaryCard label="반 평균" value={`${stats.avgScore}점`} highlight />
        <SummaryCard label="최고점" value={`${stats.maxScore}점`} />
        <SummaryCard label="최저점" value={`${stats.minScore}점`} />
      </div>

      {stats.totalAttempts === 0 ? (
        <div className="card mt-10 px-8 py-14 text-center">
          <div className="font-display text-5xl font-bold text-ink/10 select-none">0명</div>
          <p className="mt-4 text-lg font-bold text-ink">아직 응시한 학생이 없어요</p>
          <p className="mt-2 text-sm text-ink/50 max-w-xs mx-auto">
            테스트를 배포하고 학생들이 응시하면<br />문항별 정답률·점수 분포가 표시돼요.
          </p>
          <div className="mt-6 text-xs text-ink/30 flex items-center justify-center gap-2">
            <span className="inline-block h-px w-8 bg-ink/10" />
            학생에게 링크를 공유하거나 코드를 알려주세요
            <span className="inline-block h-px w-8 bg-ink/10" />
          </div>
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
