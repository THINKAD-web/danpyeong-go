import { prisma } from "@/lib/prisma";

export type StudentRow = {
  attemptId: string;
  studentName: string;
  score: number;
  maxScore: number;
  pct: number;
  submittedAt: Date;
};

export type QuestionStat = {
  order: number;
  stem: string;
  correctCount: number;
  totalCount: number;
  correctRate: number; // 0~100
};

export type TestStats = {
  title: string;
  totalAttempts: number;
  avgScore: number;       // 0~100
  maxScore: number;
  minScore: number;
  students: StudentRow[];
  questions: QuestionStat[];
  maxPoints: number;
};

export async function computeTestStats(testId: string): Promise<TestStats | null> {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      title: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          points: true,
          question: { select: { stem: true } },
          answers: {
            where: { attempt: { status: "SUBMITTED" } },
            select: { isCorrect: true },
          },
        },
      },
      attempts: {
        where: { status: "SUBMITTED" },
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          studentName: true,
          score: true,
          maxScore: true,
          submittedAt: true,
        },
      },
    },
  });

  if (!test) return null;

  const maxPoints = test.questions.reduce((s, tq) => s + tq.points, 0);

  const students: StudentRow[] = test.attempts
    .filter((a) => a.submittedAt !== null)
    .map((a) => {
      const score = a.score ?? 0;
      const max = a.maxScore ?? maxPoints;
      return {
        attemptId: a.id,
        studentName: a.studentName,
        score,
        maxScore: max,
        pct: max > 0 ? Math.round((score / max) * 100) : 0,
        submittedAt: a.submittedAt as Date,
      };
    });

  const totalAttempts = students.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(students.reduce((s, r) => s + r.pct, 0) / totalAttempts)
      : 0;
  const maxScore = totalAttempts > 0 ? Math.max(...students.map((s) => s.pct)) : 0;
  const minScore = totalAttempts > 0 ? Math.min(...students.map((s) => s.pct)) : 0;

  const questions: QuestionStat[] = test.questions.map((tq) => {
    const total = tq.answers.length;
    const correct = tq.answers.filter((a) => a.isCorrect).length;
    return {
      order: tq.order,
      stem: tq.question.stem,
      correctCount: correct,
      totalCount: total,
      correctRate: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  return { title: test.title, totalAttempts, avgScore, maxScore, minScore, students, questions, maxPoints };
}
