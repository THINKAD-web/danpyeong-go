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

    // 코드 존재 여부/상태를 응답으로 구분하면 브루트포스 시 정보 누출이 되므로
    // 클라이언트에는 항상 동일한 404 응답을 반환한다. 실패 사유는 서버 로그에만 남긴다.
    if (!test) {
      console.warn("[POST /api/play/start] 코드 없음:", shareToken);
      return NextResponse.json(
        { error: "유효하지 않은 평가 코드입니다. 코드를 다시 확인하거나 선생님께 문의해 주세요." },
        { status: 404 }
      );
    }
    if (test.status === "CLOSED") {
      console.warn("[POST /api/play/start] 마감된 평가:", test.id);
      return NextResponse.json(
        { error: "유효하지 않은 평가 코드입니다. 코드를 다시 확인하거나 선생님께 문의해 주세요." },
        { status: 404 }
      );
    }
    if (test.status === "DRAFT") {
      console.warn("[POST /api/play/start] 미배포 평가:", test.id);
      return NextResponse.json(
        { error: "유효하지 않은 평가 코드입니다. 코드를 다시 확인하거나 선생님께 문의해 주세요." },
        { status: 404 }
      );
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
