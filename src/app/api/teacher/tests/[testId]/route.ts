import { NextRequest, NextResponse } from "next/server";
import { currentTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ testId: string }> };

// DELETE /api/teacher/tests/[testId]
// 교사 본인 소유의 평가를 삭제한다. 응시 기록(Attempt)·답안(Answer)·
// 문항 연결(TestQuestion)이 함께 삭제된다(schema.prisma의 Cascade 설정).
// 문항 원본(Question, 문제은행)은 이 삭제와 무관하게 그대로 보존된다.
// 상태(DRAFT/PUBLISHED/CLOSED)와 무관하게 삭제를 허용한다.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { testId } = await params;

    const teacher = await currentTeacher();
    const author = await prisma.user.findUnique({ where: { clerkId: teacher.id } });
    if (!author) {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const test = await prisma.test.findFirst({
      where: { id: testId, ownerId: author.id },
      select: { id: true, title: true, _count: { select: { attempts: true } } },
    });
    if (!test) {
      return NextResponse.json({ error: "테스트를 찾을 수 없습니다." }, { status: 404 });
    }

    const deletedAttemptCount = test._count.attempts;

    await prisma.test.delete({ where: { id: testId } });

    console.warn(
      `[DELETE /api/teacher/tests/${testId}] 평가 삭제: ownerId=${author.id}, title="${test.title}", 삭제된 응시 기록=${deletedAttemptCount}건`
    );

    return NextResponse.json({ deleted: true, testId, deletedAttemptCount });
  } catch (err) {
    console.error("[DELETE /api/teacher/tests/[testId]]", err);
    return NextResponse.json(
      { error: "삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
