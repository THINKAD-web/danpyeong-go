import type { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export type TeacherDeletionSummary = {
  users: number;
  classrooms: number;
  tests: number;
  questions: number;
  attempts: number;
  answers: number;
  testQuestions: number;
  choices: number;
  aiUsageLogs: number;
};

export const EMPTY_DELETION_SUMMARY: TeacherDeletionSummary = {
  users: 0,
  classrooms: 0,
  tests: 0,
  questions: 0,
  attempts: 0,
  answers: 0,
  testQuestions: 0,
  choices: 0,
  aiUsageLogs: 0,
};

type DbClient = PrismaClient;

/**
 * Clerk user.deleted 웹훅에서 호출한다.
 * clerkId로 User를 조회한 뒤 교사 소유 데이터를 명시적 트랜잭션으로 파기한다.
 * (마이그레이션 적용 전/후 모두 동작하도록 FK CASCADE에만 의존하지 않음)
 */
export async function deleteTeacherDataByClerkId(
  clerkId: string,
  db: DbClient = prisma
): Promise<{ found: boolean; summary: TeacherDeletionSummary }> {
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    return { found: false, summary: EMPTY_DELETION_SUMMARY };
  }

  const summary = await db.$transaction(async (tx) => {
    const userId = user.id;

    const testIds = (
      await tx.test.findMany({
        where: { ownerId: userId },
        select: { id: true },
      })
    ).map((t) => t.id);

    const questionIds = (
      await tx.question.findMany({
        where: { authorId: userId },
        select: { id: true },
      })
    ).map((q) => q.id);

    const classroomIds = (
      await tx.classroom.findMany({
        where: { teacherId: userId },
        select: { id: true },
      })
    ).map((c) => c.id);

    const testQuestionIds = (
      await tx.testQuestion.findMany({
        where: {
          OR: [{ testId: { in: testIds } }, { questionId: { in: questionIds } }],
        },
        select: { id: true },
      })
    ).map((tq) => tq.id);

    const attemptIds = (
      await tx.attempt.findMany({
        where: {
          OR: [{ testId: { in: testIds } }, { classroomId: { in: classroomIds } }],
        },
        select: { id: true },
      })
    ).map((a) => a.id);

    const deletedAnswers = await tx.answer.deleteMany({
      where: {
        OR: [
          { attemptId: { in: attemptIds } },
          { testQuestionId: { in: testQuestionIds } },
        ],
      },
    });

    const deletedAttempts = await tx.attempt.deleteMany({
      where: { id: { in: attemptIds } },
    });

    const deletedTestQuestions = await tx.testQuestion.deleteMany({
      where: { id: { in: testQuestionIds } },
    });

    const deletedChoices = await tx.choice.deleteMany({
      where: { questionId: { in: questionIds } },
    });

    const deletedTests = await tx.test.deleteMany({
      where: { ownerId: userId },
    });

    const deletedQuestions = await tx.question.deleteMany({
      where: { authorId: userId },
    });

    const deletedClassrooms = await tx.classroom.deleteMany({
      where: { teacherId: userId },
    });

    const deletedAiUsageLogs = await tx.aiUsageLog.deleteMany({
      where: { userId },
    });

    const deletedUsers = await tx.user.deleteMany({
      where: { id: userId },
    });

    return {
      users: deletedUsers.count,
      classrooms: deletedClassrooms.count,
      tests: deletedTests.count,
      questions: deletedQuestions.count,
      attempts: deletedAttempts.count,
      answers: deletedAnswers.count,
      testQuestions: deletedTestQuestions.count,
      choices: deletedChoices.count,
      aiUsageLogs: deletedAiUsageLogs.count,
    };
  });

  return { found: true, summary };
}
