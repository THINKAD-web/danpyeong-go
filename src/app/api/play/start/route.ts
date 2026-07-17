import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isShortCodeShape } from "@/lib/short-code";
import {
  checkPlayShortCodeRateLimit,
  clientIpFromHeaders,
} from "@/lib/play-rate-limit";

const StartSchema = z.object({
  // 필드명은 하위 호환 유지 — 값은 shareToken(cuid) 또는 shortCode(6~7자리 숫자)
  shareToken: z.string().min(1),
  studentName: z.string().min(1).max(20),
});

const INVALID_CODE_ERROR =
  "유효하지 않은 평가 코드입니다. 코드를 다시 확인하거나 선생님께 문의해 주세요.";

function invalidCodeResponse(logMsg: string) {
  console.warn(`[POST /api/play/start] ${logMsg}`);
  return NextResponse.json({ error: INVALID_CODE_ERROR }, { status: 404 });
}

// POST /api/play/start
// 학생이 shareToken 또는 shortCode + 이름으로 응시 시작 → Attempt(IN_PROGRESS) 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = StartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
    }

    const code = parsed.data.shareToken.trim();
    const { studentName } = parsed.data;

    // 6자리 단축 코드는 키스페이스가 작아 IP당 rate limit 적용
    if (isShortCodeShape(code)) {
      const ip = clientIpFromHeaders(req.headers);
      const limited = await checkPlayShortCodeRateLimit(ip);
      if (!limited.ok) {
        return NextResponse.json(
          { error: limited.error },
          { status: limited.status }
        );
      }
    }

    const testSelect = {
      id: true,
      title: true,
      status: true,
      timeLimitMin: true,
      shuffle: true,
      _count: { select: { questions: true } },
    } as const;

    const test = isShortCodeShape(code)
      ? await prisma.test.findUnique({
          where: { shortCode: code },
          select: testSelect,
        })
      : await prisma.test.findUnique({
          where: { shareToken: code },
          select: testSelect,
        });

    // 코드 존재 여부/상태를 응답으로 구분하면 브루트포스 시 정보 누출이 되므로
    // 클라이언트에는 항상 동일한 404 응답을 반환한다. 실패 사유는 서버 로그에만 남긴다.
    if (!test) {
      return invalidCodeResponse(`코드 없음: ${code}`);
    }
    if (test.status === "CLOSED") {
      return invalidCodeResponse(`마감된 평가: ${test.id}`);
    }
    if (test.status === "DRAFT") {
      return invalidCodeResponse(`미배포 평가: ${test.id}`);
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
