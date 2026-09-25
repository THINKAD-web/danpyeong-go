import { prisma } from "./prisma";

// 랜딩 "사회적 증거" 숫자 — 개인 식별 불가능한 전체 합계만 노출
export type PublicStats = {
  teachers: number; // 평가를 한 번이라도 배포한 교사 수
  submissions: number; // 제출 완료된 학생 응시 수
  tests: number; // 생성된 평가 수
};

/** DB 장애 시 null — 랜딩은 숫자 없이도 렌더링되어야 한다 */
export async function getPublicStats(): Promise<PublicStats | null> {
  try {
    const [teachers, submissions, tests] = await Promise.all([
      prisma.user.count({ where: { tests: { some: { publishedAt: { not: null } } } } }),
      prisma.attempt.count({ where: { status: "SUBMITTED" } }),
      prisma.test.count(),
    ]);
    if (teachers + submissions + tests === 0) return null;
    return { teachers, submissions, tests };
  } catch (err) {
    console.error("[public-stats]", err);
    return null;
  }
}
