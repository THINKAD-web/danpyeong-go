import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// GET /api/units?grade=3&subject=수학&term=1|2
// 주어진 학년/과목의 단원 목록을 term/order 정렬로 반환.
// grade 는 필수, subject 는 선택(기본값 "수학"), term 은 선택(생략 시 전체).
const QuerySchema = z.object({
  grade: z.coerce.number().int().min(1),
  subject: z.string().min(1).default("수학"),
  term: z.coerce.number().int().min(1).max(2).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    grade: searchParams.get("grade") ?? undefined,
    subject: searchParams.get("subject") ?? undefined,
    term: searchParams.get("term") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "grade 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const { grade, subject: subjectName, term } = parsed.data;

  try {
    const subject = await prisma.subject.findUnique({
      where: { name_grade: { name: subjectName, grade } },
    });

    if (!subject) {
      return NextResponse.json({ units: [] });
    }

    const units = await prisma.unit.findMany({
      where: {
        subjectId: subject.id,
        ...(term !== undefined ? { term } : {}),
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
