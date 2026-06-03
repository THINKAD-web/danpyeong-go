import { prisma } from "@/lib/prisma";

export type StudentRow = {
  attemptId: string;
  studentName: string;
  score: number;
  maxScore: number;
  pct: number;
  submittedAt: Date;
};

export type ChoiceDistItem = {
  choiceOrder: number;
  choiceText: string;
  count: number;
  isCorrect: boolean;
};

export type QuestionStat = {
  order: number;
  stem: string;
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  correctCount: number;
  totalCount: number;
  correctRate: number; // 0~100
  // 오답 분포 (객관식만)
  choiceDist: ChoiceDistItem[];
};

export type StudentAnswer = {
  testQuestionOrder: number;
  isCorrect: boolean | null;
  // 객관식: 선택한 보기 번호와 텍스트
  selectedChoiceOrder: number | null;
  selectedChoiceText: string | null;
  // 단답형: 입력 텍스트
  textAnswer: string | null;
};

export type StudentDetail = StudentRow & {
  answers: StudentAnswer[];
};

export type TestStats = {
  title: string;
  totalAttempts: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  students: StudentRow[];
  studentDetails: StudentDetail[];
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
          question: {
            select: {
              stem: true,
              type: true,
              choices: { orderBy: { order: "asc" }, select: { id: true, order: true, text: true, isCorrect: true } },
            },
          },
          answers: {
            where: { attempt: { status: "SUBMITTED" } },
            select: {
              attemptId: true,
              isCorrect: true,
              selectedChoiceId: true,
              textAnswer: true,
            },
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

  // 선택지 ID → (order, text) 맵 (전체 문항)
  const choiceMap = new Map<string, { order: number; text: string; isCorrect: boolean }>();
  for (const tq of test.questions) {
    for (const ch of tq.question.choices) {
      choiceMap.set(ch.id, { order: ch.order, text: ch.text, isCorrect: ch.isCorrect });
    }
  }

  // 학생별 상세 답안
  const studentDetails: StudentDetail[] = students.map((s) => {
    const answers: StudentAnswer[] = test.questions.map((tq) => {
      const ans = tq.answers.find((a) => a.attemptId === s.attemptId);
      const selectedChoice = ans?.selectedChoiceId ? choiceMap.get(ans.selectedChoiceId) : null;
      return {
        testQuestionOrder: tq.order,
        isCorrect: ans?.isCorrect ?? null,
        selectedChoiceOrder: selectedChoice?.order ?? null,
        selectedChoiceText: selectedChoice?.text ?? null,
        textAnswer: ans?.textAnswer ?? null,
      };
    });
    return { ...s, answers };
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

    // 객관식 오답 분포
    const choiceDist: ChoiceDistItem[] = tq.question.choices.map((ch) => ({
      choiceOrder: ch.order,
      choiceText: ch.text,
      count: tq.answers.filter((a) => a.selectedChoiceId === ch.id).length,
      isCorrect: ch.isCorrect,
    }));

    return {
      order: tq.order,
      stem: tq.question.stem,
      type: tq.question.type as "MULTIPLE_CHOICE" | "SHORT_ANSWER",
      correctCount: correct,
      totalCount: total,
      correctRate: total > 0 ? Math.round((correct / total) * 100) : 0,
      choiceDist,
    };
  });

  return {
    title: test.title,
    totalAttempts,
    avgScore,
    maxScore,
    minScore,
    students,
    studentDetails,
    questions,
    maxPoints,
  };
}
