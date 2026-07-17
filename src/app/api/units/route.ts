import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/units?grade=3&term=1
// grade 기본값 3 (하위 호환). term 생략 시 전체 반환.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gradeParam = searchParams.get("grade");
  const termParam = searchParams.get("term");
  const grade = gradeParam ? Number(gradeParam) : 3;
  const term = termParam ? Number(termParam) : undefined;

  try {
    const subject = await prisma.subject.findUnique({
      where: { name_grade: { name: "수학", grade } },
    });

    if (!subject) {
      return NextResponse.json({ units: [] });
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

    return NextResponse.json({ units });
  } catch (err) {
    console.error("[/api/units]", err);
    return NextResponse.json(
      { error: "단원 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
