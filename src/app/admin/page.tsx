import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { currentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// claude-sonnet-4-6 기준 대략적 비용 추정 (입출력 토큰 합산)
// 실제 청구와 다를 수 있음 — 추세 파악용
const COST_PER_CALL_USD = 0.04; // 1회 생성 평균 ~2000 input + ~1500 output tokens ≈ $0.04

async function getDashboardData() {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0, 0, 0, 0);

  const [
    teachers,
    totalTests,
    totalQuestions,
    aiToday,
    aiWeek,
    aiAll,
    questionsByUnit,
    aiByUser,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, createdAt: true,
        _count: { select: { tests: true, questions: true } },
        tests: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } },
        aiUsageLogs: {
          where: { createdAt: { gte: todayStart } },
          select: { questionCount: true },
        },
      },
    }),
    prisma.test.count(),
    prisma.question.count({ where: { isArchived: false } }),
    prisma.aiUsageLog.aggregate({
      where: { createdAt: { gte: todayStart } },
      _count: { id: true }, _sum: { questionCount: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { questionCount: 0 } })),
    prisma.aiUsageLog.aggregate({
      where: { createdAt: { gte: weekStart } },
      _count: { id: true }, _sum: { questionCount: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { questionCount: 0 } })),
    prisma.aiUsageLog.aggregate({
      _count: { id: true }, _sum: { questionCount: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { questionCount: 0 } })),
    prisma.question.groupBy({
      by: ["unitId"],
      _count: { id: true },
      where: { isArchived: false },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.aiUsageLog.groupBy({
      by: ["userId"],
      _count: { id: true }, _sum: { questionCount: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }).catch(() => []),
  ]);

  const unitIds = questionsByUnit.map((q) => q.unitId);
  const units = await prisma.unit.findMany({
    where: { id: { in: unitIds } },
    select: { id: true, name: true, term: true },
  });
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
  const teacherMap = Object.fromEntries(teachers.map((t) => [t.id, t.name || t.email || "?"]));

  const dailyGlobalLimit = parseInt(process.env.AI_DAILY_LIMIT_GLOBAL ?? "500");
  const todayCalls = aiToday._count.id ?? 0;

  return {
    teachers: teachers.map((t) => ({
      id: t.id,
      name: t.name ?? "-",
      email: t.email ?? "-",
      createdAt: t.createdAt,
      testCount: t._count.tests,
      questionCount: t._count.questions,
      lastActiveAt: t.tests[0]?.updatedAt ?? t.createdAt,
      aiTodayCount: t.aiUsageLogs.reduce((s, l) => s + l.questionCount, 0),
    })),
    stats: { totalTeachers: teachers.length, totalTests, totalQuestions },
    ai: {
      today: { calls: todayCalls, questions: aiToday._sum.questionCount ?? 0 },
      week:  { calls: aiWeek._count.id ?? 0, questions: aiWeek._sum.questionCount ?? 0 },
      total: { calls: aiAll._count.id ?? 0, questions: aiAll._sum.questionCount ?? 0 },
      dailyGlobalLimit,
      usagePercent: Math.min(100, Math.round((todayCalls / dailyGlobalLimit) * 100)),
      estimatedCostKRW: Math.round((aiAll._count.id ?? 0) * COST_PER_CALL_USD * 1380),
      byUser: aiByUser.map((r) => ({
        userId: r.userId,
        name: teacherMap[r.userId] ?? r.userId,
        calls: r._count.id,
        questions: r._sum.questionCount ?? 0,
      })),
    },
    content: {
      byUnit: questionsByUnit.map((q) => ({
        unitId: q.unitId,
        name: unitMap[q.unitId]?.name ?? q.unitId,
        term: unitMap[q.unitId]?.term,
        count: q._count.id,
      })),
    },
  };
}

export default async function AdminPage() {
  try {
    await currentAdmin();
  } catch {
    redirect("/teacher");
  }

  const data = await getDashboardData();
  const { teachers, stats, ai, content } = data;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* 헤더 */}
      <nav className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-display text-2xl font-bold text-brandink">
            단평<span className="text-coral">GO</span>
          </Link>
          <span className="rounded-full border-2 border-brand/30 bg-brand/10 px-3 py-0.5 text-xs font-bold text-brand">
            관리자
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/teacher/admin/units" className="text-sm text-ink/50 hover:text-ink transition">
            단원 관리
          </Link>
          <Link href="/teacher" className="text-sm text-ink/50 hover:text-ink transition">
            교사 대시보드
          </Link>
          <UserButton />
        </div>
      </nav>

      <h1 className="font-display text-3xl font-bold">운영 현황</h1>
      <p className="mt-1 text-sm text-ink/50">
        {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} 기준
      </p>

      {/* 서비스 요약 카드 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="교사 수" value={`${stats.totalTeachers}명`} />
        <StatCard label="테스트 수" value={`${stats.totalTests}개`} />
        <StatCard label="문항 수" value={`${stats.totalQuestions}개`} />
        <StatCard label="AI 생성 (전체)" value={`${ai.total.calls}회`} sub={`문항 ${ai.total.questions}개`} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* ── AI 사용량 ── */}
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">AI 사용량</h2>

          {/* 전역 일일 사용률 */}
          <div className="card p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-ink/60">오늘 전역 사용률</p>
                <p className="font-display mt-1 text-3xl font-bold text-brand">
                  {ai.today.calls}
                  <span className="ml-1 text-base font-normal text-ink/40">/ {ai.dailyGlobalLimit}회</span>
                </p>
              </div>
              <p className={`text-2xl font-bold ${ai.usagePercent >= 80 ? "text-coral" : ai.usagePercent >= 50 ? "text-sun" : "text-mint"}`}>
                {ai.usagePercent}%
              </p>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className={`h-full rounded-full transition-all ${ai.usagePercent >= 80 ? "bg-coral" : ai.usagePercent >= 50 ? "bg-sun" : "bg-mint"}`}
                style={{ width: `${ai.usagePercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink/40">오늘 문항 {ai.today.questions}개 생성 · 이번 주 {ai.week.calls}회 · 전체 누적 {ai.total.calls}회</p>
          </div>

          {/* 비용 추정 */}
          <div className="mt-3 card bg-ink/[0.02] p-4">
            <p className="text-xs font-bold text-ink/50">누적 비용 추정 (claude-sonnet-4-6 기준, 추세 파악용)</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">
              ≈ ₩{ai.estimatedCostKRW.toLocaleString("ko-KR")}
            </p>
            <p className="mt-0.5 text-xs text-ink/40">1회 생성 ≈ $0.04 × {ai.total.calls}회 × 1,380원/$ (실제와 다를 수 있음)</p>
          </div>

          {/* 교사별 AI 사용량 순위 */}
          {ai.byUser.length > 0 && (
            <div className="mt-3 card p-5">
              <p className="mb-3 text-sm font-bold">교사별 AI 사용량 (전체 누적 top 10)</p>
              <div className="space-y-2">
                {ai.byUser.map((u, i) => (
                  <div key={u.userId} className="flex items-center gap-3">
                    <span className="w-5 text-center text-xs font-bold text-ink/40">{i + 1}</span>
                    <span className="flex-1 truncate text-sm font-semibold">{u.name}</span>
                    <span className="text-xs text-ink/50">{u.questions}문항</span>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                      {u.calls}회
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ai.byUser.length === 0 && (
            <div className="mt-3 card p-5 text-center text-sm text-ink/40">
              AI 사용 기록이 없어요.
            </div>
          )}
        </section>

        {/* ── 콘텐츠 현황 ── */}
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">콘텐츠 현황</h2>

          {/* 단원별 문항 분포 */}
          <div className="card p-5">
            <p className="mb-3 text-sm font-bold">단원별 문항 수 (상위 8개)</p>
            {content.byUnit.length === 0 ? (
              <p className="text-sm text-ink/40">문항이 없어요.</p>
            ) : (
              <div className="space-y-2">
                {content.byUnit.map((u) => {
                  const max = content.byUnit[0]?.count ?? 1;
                  const pct = Math.round((u.count / max) * 100);
                  return (
                    <div key={u.unitId}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">{u.term}학기 {u.name}</span>
                        <span className="text-ink/50">{u.count}개</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                        <div className="h-full rounded-full bg-brand/60" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 최근 가입 교사 요약 */}
          <div className="mt-3 card p-5">
            <p className="mb-1 text-sm font-bold">최근 가입 교사 ({stats.totalTeachers}명)</p>
            <p className="mb-3 text-xs text-ink/40">아래 교사 목록에서 상세 확인</p>
            {teachers.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-ink/5 last:border-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                  {(t.name || "?")[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <p className="truncate text-xs text-ink/40">{t.email}</p>
                </div>
                <span className="text-xs text-ink/40">테스트 {t.testCount}개</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── 교사 목록 ── */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-xl font-bold">교사 목록</h2>
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-ink/[0.03]">
                <th className="px-4 py-3 text-left text-xs font-bold text-ink/50">이름</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-ink/50">이메일</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-ink/50">테스트</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-ink/50">문항</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-ink/50">오늘 AI 문항</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-ink/50">최근 활동</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-ink/50">가입일</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-ink/40">
                    가입한 교사가 없어요.
                  </td>
                </tr>
              )}
              {teachers.map((t) => (
                <tr key={t.id} className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]">
                  <td className="px-4 py-3 font-semibold">{t.name}</td>
                  <td className="px-4 py-3 text-ink/60">{t.email}</td>
                  <td className="px-4 py-3 text-right">{t.testCount}</td>
                  <td className="px-4 py-3 text-right">{t.questionCount}</td>
                  <td className={`px-4 py-3 text-right font-bold ${t.aiTodayCount > 20 ? "text-coral" : t.aiTodayCount > 0 ? "text-brand" : "text-ink/30"}`}>
                    {t.aiTodayCount > 0 ? `${t.aiTodayCount}개` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-ink/50">
                    {formatDate(t.lastActiveAt)}
                  </td>
                  <td className="px-4 py-3 text-right text-ink/40">
                    {formatDate(t.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="font-display mt-1 text-3xl font-bold text-brand">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink/40">{sub}</p>}
    </div>
  );
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
