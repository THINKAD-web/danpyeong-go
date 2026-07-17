import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/demo/units?grade=3&term=1
// 공개 데모 전용 — 수학 3·4학년 단원만 반환 (인증 불필요)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gradeParam = Number(searchParams.get("grade") ?? "3");
  const termParam = searchParams.get("term");
  const grade = gradeParam === 4 ? 4 : 3;
  const term = termParam ? Number(termParam) : undefined;

  try {
    const subject = await prisma.subject.findUnique({
      where: { name_grade: { name: "수학", grade } },
    });

    if (!subject) {
      return NextResponse.json({ units: [], grade });
    }

    const units = await prisma.unit.findMany({
      where: {
        subjectId: subject.id,
        isArchived: false,
        ...(term !== undefined && !isNaN(term) ? { term } : {}),
      },
      orderBy: [{ term: "asc" }, { order: "asc" }],
      select: { id: true, term: true, order: true, name: true },
    });

    return NextResponse.json({ units, grade });
  } catch (err) {
    console.error("[/api/demo/units]", err);
    return NextResponse.json(
      { error: "단원 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
