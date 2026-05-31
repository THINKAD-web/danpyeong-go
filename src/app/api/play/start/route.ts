import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const StartSchema = z.object({
  shareToken: z.string().min(1),
  studentName: z.string().min(1).max(20),
});

// POST /api/play/start
// 학생이 shareToken + 이름으로 응시 시작 → Attempt(IN_PROGRESS) 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
    }

    const { shareToken, studentName } = parsed.data;

    const test = await prisma.test.findUnique({
      where: { shareToken },
      select: {
        id: true,
        title: true,
        status: true,
        timeLimitMin: true,
        shuffle: true,
        _count: { select: { questions: true } },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "존재하지 않는 평가 코드입니다." }, { status: 404 });
    }
    if (test.status === "CLOSED") {
      return NextResponse.json({ error: "이미 마감된 평가입니다." }, { status: 403 });
    }
    if (test.status === "DRAFT") {
      return NextResponse.json({ error: "아직 배포되지 않은 평가입니다." }, { status: 403 });
    }

    const attempt = await prisma.attempt.create({
      data: { testId: test.id, studentName, status: "IN_PROGRESS" },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      test: {
        title: test.title,
        questionCount: test._count.questions,
        timeLimitMin: test.timeLimitMin,
        shuffle: test.shuffle,
      },
    });
  } catch (err) {
    console.error("[POST /api/play/start]", err);
    return NextResponse.json({ error: "응시 시작 중 오류가 발생했습니다." }, { status: 500 });
  }
}
