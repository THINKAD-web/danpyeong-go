import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await currentAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7); weekStart.setHours(0, 0, 0, 0);

  const [
    teachers,
    totalTests,
    totalQuestions,
    aiLogsToday,
    aiLogsWeek,
    aiLogsAll,
    questionsByUnit,
  ] = await Promise.all([
    // 교사 목록 + 통계
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, createdAt: true,
        _count: { select: { tests: true, questions: true } },
        tests: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { updatedAt: true },
        },
        aiUsageLogs: {
          where: { createdAt: { gte: todayStart } },
          select: { questionCount: true },
        },
      },
    }),
    prisma.test.count(),
    prisma.question.count({ where: { isArchived: false } }),
    // AI 사용량 — 오늘
    prisma.aiUsageLog.aggregate({
      where: { createdAt: { gte: todayStart } },
      _count: { id: true },
      _sum: { questionCount: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { questionCount: 0 } })),
    // AI 사용량 — 이번 주
    prisma.aiUsageLog.aggregate({
      where: { createdAt: { gte: weekStart } },
      _count: { id: true },
      _sum: { questionCount: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { questionCount: 0 } })),
    // AI 사용량 — 전체
    prisma.aiUsageLog.aggregate({
      _count: { id: true },
      _sum: { questionCount: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { questionCount: 0 } })),
    // 단원별 문항 분포
    prisma.question.groupBy({
      by: ["unitId"],
      _count: { id: true },
      where: { isArchived: false },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
  ]);

  // 교사별 AI 사용량 집계 (전체)
  const aiByUser = await prisma.aiUsageLog.groupBy({
    by: ["userId"],
    _count: { id: true },
    _sum: { questionCount: true },
    orderBy: { _sum: { questionCount: "desc" } },
    take: 10,
  }).catch(() => []);

  // 단원 이름 조회
  const unitIds = questionsByUnit.map((q) => q.unitId);
  const units = await prisma.unit.findMany({
    where: { id: { in: unitIds } },
    select: { id: true, name: true, term: true },
  });
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));

  // 교사 ID → 이름 맵
  const teacherMap = Object.fromEntries(
    teachers.map((t) => [t.id, t.name || t.email || t.id])
  );

  return NextResponse.json({
    teachers: teachers.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      createdAt: t.createdAt,
      testCount: t._count.tests,
      questionCount: t._count.questions,
      lastActiveAt: t.tests[0]?.updatedAt ?? t.createdAt,
      aiTodayCount: t.aiUsageLogs.reduce((s, l) => s + l.questionCount, 0),
    })),
    stats: {
      totalTeachers: teachers.length,
      totalTests,
      totalQuestions,
    },
    ai: {
      today: { calls: aiLogsToday._count.id, questions: aiLogsToday._sum.questionCount ?? 0 },
      week:  { calls: aiLogsWeek._count.id,  questions: aiLogsWeek._sum.questionCount ?? 0 },
      total: { calls: aiLogsAll._count.id,   questions: aiLogsAll._sum.questionCount ?? 0 },
      dailyGlobalLimit: parseInt(process.env.AI_DAILY_LIMIT_GLOBAL ?? "500"),
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
        unitName: unitMap[q.unitId]?.name ?? q.unitId,
        term: unitMap[q.unitId]?.term,
        count: q._count.id,
      })),
    },
  });
}
