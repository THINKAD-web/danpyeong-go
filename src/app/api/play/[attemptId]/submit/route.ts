import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { gradeShortAnswer } from "@/lib/grading";

const SubmitSchema = z.object({
  answers: z.array(
    z.object({
      testQuestionId: z.string().min(1),
      selectedChoiceId: z.string().optional(),
      textAnswer: z.string().optional(),
    })
  ),
});

// POST /api/play/[attemptId]/submit
// 제출된 답안을 채점하고 Attempt를 SUBMITTED로 변경
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: { id: true, status: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "응시 정보를 찾을 수 없습니다." }, { status: 404 });
    }
    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({ error: "이미 제출된 응시입니다." }, { status: 403 });
    }

    // 테스트 문항 + 정답 데이터 로드
    const testQuestions = await prisma.testQuestion.findMany({
      where: { id: { in: parsed.data.answers.map((a) => a.testQuestionId) } },
      select: {
        id: true,
        points: true,
        question: {
          select: {
            type: true,
            answerKeywords: true,
            choices: { select: { id: true, isCorrect: true } },
          },
        },
      },
    });

    const tqMap = new Map(testQuestions.map((tq) => [tq.id, tq]));

    let score = 0;
    const maxScore = testQuestions.reduce((s, tq) => s + tq.points, 0);

    const results: Array<{
      testQuestionId: string;
      isCorrect: boolean;
      earnedPoints: number;
    }> = [];

    for (const ans of parsed.data.answers) {
      const tq = tqMap.get(ans.testQuestionId);
      if (!tq) continue;

      let isCorrect = false;

      if (tq.question.type === "MULTIPLE_CHOICE" && ans.selectedChoiceId) {
        const choice = tq.question.choices.find((c) => c.id === ans.selectedChoiceId);
        isCorrect = choice?.isCorrect ?? false;
      } else if (tq.question.type === "SHORT_ANSWER" && ans.textAnswer) {
        isCorrect = gradeShortAnswer(ans.textAnswer, tq.question.answerKeywords);
      }

      const earnedPoints = isCorrect ? tq.points : 0;
      score += earnedPoints;
      results.push({ testQuestionId: ans.testQuestionId, isCorrect, earnedPoints });
    }

    // 트랜잭션: Answer upsert + Attempt SUBMITTED 업데이트
    await prisma.$transaction([
      ...parsed.data.answers.map((ans) => {
        const result = results.find((r) => r.testQuestionId === ans.testQuestionId);
        return prisma.answer.upsert({
          where: { attemptId_testQuestionId: { attemptId, testQuestionId: ans.testQuestionId } },
          create: {
            attemptId,
            testQuestionId: ans.testQuestionId,
            selectedChoiceId: ans.selectedChoiceId,
            textAnswer: ans.textAnswer,
            isCorrect: result?.isCorrect ?? false,
            earnedPoints: result?.earnedPoints ?? 0,
          },
          update: {
            selectedChoiceId: ans.selectedChoiceId,
            textAnswer: ans.textAnswer,
            isCorrect: result?.isCorrect ?? false,
            earnedPoints: result?.earnedPoints ?? 0,
          },
        });
      }),
      prisma.attempt.update({
        where: { id: attemptId },
        data: { status: "SUBMITTED", score, maxScore, submittedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ score, maxScore, results });
  } catch (err) {
    console.error("[POST /api/play/[attemptId]/submit]", err);
    return NextResponse.json({ error: "제출 중 오류가 발생했습니다." }, { status: 500 });
  }
}
