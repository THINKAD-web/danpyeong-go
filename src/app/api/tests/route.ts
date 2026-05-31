import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentTeacher } from "@/lib/auth";

// ── POST /api/tests ────────────────────────────────────────
// 생성된 문항을 Test + Question + Choice + TestQuestion으로 저장
const SaveSchema = z.object({
  title: z.string().min(1).max(100),
  questions: z.array(
    z.object({
      type: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
      stem: z.string().min(1),
      explanation: z.string().default(""),
      answerKeywords: z.array(z.string()).default([]),
      choices: z.array(
        z.object({ order: z.number(), text: z.string(), isCorrect: z.boolean() })
      ).default([]),
    })
  ).min(1),
  unitId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const teacher = currentTeacher();

    // 교사 User upsert (Clerk 연동 전 임시)
    const author = await prisma.user.upsert({
      where: { clerkId: teacher.id },
      update: {},
      create: {
        clerkId: teacher.id,
        email: teacher.email,
        name: teacher.name,
        role: "TEACHER",
      },
    });

    const { title, questions, unitId } = parsed.data;

    // 트랜잭션: Test + Question + Choice + TestQuestion 한번에 저장
    const test = await prisma.$transaction(async (tx) => {
      const newTest = await tx.test.create({
        data: {
          ownerId: author.id,
          title,
          status: "DRAFT",
        },
      });

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const question = await tx.question.create({
          data: {
            unitId,
            authorId: author.id,
            type: q.type,
            difficulty: q.difficulty,
            source: "AI",
            stem: q.stem,
            explanation: q.explanation,
            answerKeywords: q.answerKeywords,
            isReviewed: false,
            choices: {
              create: q.choices.map((c) => ({
                order: c.order,
                text: c.text,
                isCorrect: c.isCorrect,
              })),
            },
          },
        });

        await tx.testQuestion.create({
          data: {
            testId: newTest.id,
            questionId: question.id,
            order: i + 1,
            points: 1,
          },
        });
      }

      return newTest;
    });

    return NextResponse.json({ testId: test.id, shareToken: test.shareToken });
  } catch (err) {
    console.error("[POST /api/tests]", err);
    return NextResponse.json(
      { error: "테스트 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ── GET /api/tests ─────────────────────────────────────────
// 현재 교사의 테스트 목록 (대시보드용)
export async function GET() {
  try {
    const teacher = currentTeacher();

    const author = await prisma.user.findUnique({
      where: { clerkId: teacher.id },
    });
    if (!author) return NextResponse.json({ tests: [] });

    const tests = await prisma.test.findMany({
      where: { ownerId: author.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        shareToken: true,
        createdAt: true,
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return NextResponse.json({
      tests: tests.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        shareToken: t.shareToken,
        questionCount: t._count.questions,
        attemptCount: t._count.attempts,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    console.error("[GET /api/tests]", err);
    return NextResponse.json(
      { error: "테스트 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
