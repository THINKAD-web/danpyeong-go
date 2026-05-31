import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/play/[attemptId]
// 응시 중인 Attempt + 테스트 문항 반환 (isCorrect는 노출하지 않음)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentName: true,
        status: true,
        test: {
          select: {
            title: true,
            timeLimitMin: true,
            shuffle: true,
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                order: true,
                points: true,
                question: {
                  select: {
                    id: true,
                    type: true,
                    stem: true,
                    choices: {
                      orderBy: { order: "asc" },
                      select: { id: true, order: true, text: true },
                      // isCorrect is intentionally excluded
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "응시 정보를 찾을 수 없습니다." }, { status: 404 });
    }
    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({ error: "이미 제출된 응시입니다." }, { status: 403 });
    }

    return NextResponse.json({ attempt });
  } catch (err) {
    console.error("[GET /api/play/[attemptId]]", err);
    return NextResponse.json({ error: "오류가 발생했습니다." }, { status: 500 });
  }
}
