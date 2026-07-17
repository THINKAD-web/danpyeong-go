import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentTeacher } from "@/lib/auth";
import { allocateUniqueShortCode } from "@/lib/short-code";

const PatchSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
});

// PATCH /api/tests/[testId] — 상태 변경 (배포/마감)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
    }

    const teacher = await currentTeacher();
    const author = await prisma.user.findUnique({ where: { clerkId: teacher.id } });
    if (!author) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

    const test = await prisma.test.findFirst({
      where: { id: testId, ownerId: author.id },
    });
    if (!test) return NextResponse.json({ error: "테스트를 찾을 수 없습니다." }, { status: 404 });

    const nextStatus = parsed.data.status;
    let shortCode = test.shortCode;

    // PUBLISHED 전환 시 단축 코드 발급 (이미 있으면 유지)
    if (nextStatus === "PUBLISHED" && !shortCode) {
      shortCode = await allocateUniqueShortCode(prisma);
    }

    const updated = await prisma.test.update({
      where: { id: testId },
      data: {
        status: nextStatus,
        ...(shortCode && !test.shortCode ? { shortCode } : {}),
        ...(nextStatus === "PUBLISHED" && !test.publishedAt ? { publishedAt: new Date() } : {}),
        ...(nextStatus === "CLOSED" ? { closedAt: new Date() } : {}),
      },
      select: { id: true, status: true, shareToken: true, shortCode: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/tests/[testId]]", err);
    return NextResponse.json({ error: "상태 변경 중 오류가 발생했습니다." }, { status: 500 });
  }
}
