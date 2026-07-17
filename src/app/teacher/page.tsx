import Link from "next/link";
import { currentTeacher } from "@/lib/auth";
import { TeacherUserMenu } from "@/components/TeacherUserMenu";
import { prisma } from "@/lib/prisma";
import { TestActions } from "./TestActions";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { NextStepBanner } from "@/components/NextStepBanner";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, { text: string; cls: string }> = {
  PUBLISHED: { text: "진행 중", cls: "bg-mint/20 text-green-700 border-green-700" },
  CLOSED:    { text: "마감",    cls: "bg-ink/10 text-ink border-ink" },
  DRAFT:     { text: "작성 중", cls: "bg-sun/30 text-yellow-800 border-yellow-700" },
};

async function getTeacherData() {
  const teacher = await currentTeacher();

  const author = await prisma.user.findUnique({
    where: { clerkId: teacher.id },
  });
  if (!author) return { tests: [], teacher };

  const tests = await prisma.test.findMany({
    where: { ownerId: author.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      shareToken: true,
      _count: { select: { questions: true, attempts: true } },
      attempts: {
        where: { status: "SUBMITTED" },
        select: { score: true, maxScore: true },
      },
    },
  });

  return {
    teacher,
    tests: tests.map((t) => {
      const submitted = t.attempts;
      const attemptCount = submitted.length;
      const avgScore =
        attemptCount > 0
          ? Math.round(
              submitted.reduce((s, a) => {
                const max = a.maxScore ?? 1;
                return s + (max > 0 ? ((a.score ?? 0) / max) * 100 : 0);
              }, 0) / attemptCount
            )
          : null;
      return {
        id: t.id,
        title: t.title,
        status: t.status as "DRAFT" | "PUBLISHED" | "CLOSED",
        shareToken: t.shareToken,
        questionCount: t._count.questions,
        attemptCount,
        totalAttemptCount: t._count.attempts,
        avgScore,
      };
    }),
  };
}

export default async function TeacherDashboard() {
  const { teacher, tests } = await getTeacherData();

  const published = tests.filter((t) => t.status === "PUBLISHED").length;
  const totalAttempts = tests.reduce((s, t) => s + t.attemptCount, 0);
  const scoresWithData = tests.filter((t) => t.avgScore !== null);
  const overallAvg =
    scoresWithData.length > 0
      ? Math.round(scoresWithData.reduce((s, t) => s + (t.avgScore ?? 0), 0) / scoresWithData.length)
      : null;

  // 상황별 다음 단계 배너 결정
  const hasDraft = tests.some((t) => t.status === "DRAFT");
  const hasPublishedWithNoAttempts =
    tests.some((t) => t.status === "PUBLISHED" && t.attemptCount === 0);
  const firstPublished = tests.find((t) => t.status === "PUBLISHED");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <nav className="mb-10 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold text-brandink">
          단평<span className="text-coral">GO</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/teacher/help" className="text-sm text-ink/50 hover:text-ink transition">
            도움말
          </Link>
          <span className="text-sm text-ink/60">{teacher.name} 선생님</span>
          <TeacherUserMenu />
        </div>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">내 단원평가</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/teacher/admin/units"
            className="card px-3 py-2 text-sm font-medium text-ink/70 hover:text-ink border border-ink/15 hover:border-ink/30 transition sm:px-4 sm:py-2.5"
          >
            단원 관리
          </Link>
          <Link
            href="/teacher/test/new"
            className="card bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-1 sm:px-5 sm:py-3"
          >
            + 새로 만들기
          </Link>
        </div>
      </div>

      {/* 통계 카드 — 테스트가 있을 때만 */}
      {tests.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <Stat label="전체 평가" value={`${tests.length}개`} />
          <Stat label="진행 중" value={`${published}개`} />
          <Stat label="총 응시" value={`${totalAttempts}회`} />
          <Stat label="전체 평균" value={overallAvg !== null ? `${overallAvg}점` : "—"} />
        </div>
      )}

      {/* 테스트 목록 */}
      <div className="mt-8 space-y-4">
        {tests.length === 0 ? (
          // 빈 상태 = 첫 사용 온보딩 가이드
          <OnboardingChecklist />
        ) : (
          <>
            {/* 상황별 다음 단계 힌트 배너 */}
            {hasDraft && !hasPublishedWithNoAttempts && (
              <NextStepBanner kind="deploy" />
            )}
            {hasPublishedWithNoAttempts && (
              <NextStepBanner kind="share" shareToken={firstPublished?.shareToken} />
            )}

            {tests.map((t) => {
              const s = statusLabel[t.status];
              return (
                <div
                  key={t.id}
                  className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{t.title}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-bold ${s.cls}`}
                      >
                        {s.text}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink/60">
                      문항 {t.questionCount}개 · 응시 {t.attemptCount}명
                      {t.avgScore !== null && ` · 평균 ${t.avgScore}점`}
                    </p>
                  </div>
                  <TestActions
                    testId={t.id}
                    status={t.status}
                    shareToken={t.shareToken}
                    title={t.title}
                    attemptCount={t.totalAttemptCount}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-ink/60">{label}</div>
      <div className="font-display mt-1 text-3xl font-bold text-brand">{value}</div>
    </div>
  );
}
