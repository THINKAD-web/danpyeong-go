import type { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { prisma } from "./prisma";

const ANONYMOUS_PREFIX = "학생_";

type DbClient = Pick<PrismaClient, "test" | "attempt" | "$transaction">;

/** 익명 표시명 생성 — nanoid(6) 기반, 재실행 시 식별자가 바뀌지 않도록 접두사로 이미 처리된 행은 스킵 */
export function createAnonymousStudentName(
  generateId: () => string = () => nanoid(6)
): string {
  return `${ANONYMOUS_PREFIX}${generateId()}`;
}

export function isAlreadyAnonymized(studentName: string): boolean {
  return studentName.startsWith(ANONYMOUS_PREFIX);
}

/**
 * beforeDate(KST 기준 학기 마감일 00:00) 이전에 마감(CLOSED)된 평가의
 * 응시 기록 studentName을 익명값으로 대체한다.
 * @returns 변경된 Attempt 행 수
 */
export async function anonymizeAttempts(
  beforeDate: Date,
  db: DbClient = prisma,
  generateName: () => string = () => createAnonymousStudentName()
): Promise<number> {
  const startedAt = Date.now();
  console.info(
    `[anonymize] start beforeDate=${beforeDate.toISOString()}`
  );

  const closedTests = await db.test.findMany({
    where: {
      status: "CLOSED",
      closedAt: { not: null, lt: beforeDate },
    },
    select: { id: true },
  });

  const testIds = closedTests.map((t) => t.id);
  if (testIds.length === 0) {
    console.info(
      `[anonymize] complete beforeDate=${beforeDate.toISOString()} count=0 durationMs=${Date.now() - startedAt}`
    );
    return 0;
  }

  const attempts = await db.attempt.findMany({
    where: { testId: { in: testIds } },
    select: { id: true, studentName: true },
  });

  const toAnonymize = attempts.filter((a) => !isAlreadyAnonymized(a.studentName));
  if (toAnonymize.length === 0) {
    console.info(
      `[anonymize] complete beforeDate=${beforeDate.toISOString()} count=0 durationMs=${Date.now() - startedAt}`
    );
    return 0;
  }

  await db.$transaction(
    toAnonymize.map((attempt) =>
      db.attempt.update({
        where: { id: attempt.id },
        data: { studentName: generateName() },
      })
    )
  );

  const count = toAnonymize.length;
  console.info(
    `[anonymize] complete beforeDate=${beforeDate.toISOString()} count=${count} durationMs=${Date.now() - startedAt}`
  );
  return count;
}
