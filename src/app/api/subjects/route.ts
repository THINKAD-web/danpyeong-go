import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/subjects
// 등록된 과목의 distinct (name, grade) 조합을 반환.
// 정렬: grade 오름차순 → 같은 grade 는 name 오름차순.
// 인증: Clerk 미들웨어가 비공개 라우트로 보호(교사만 접근). — /api/units 와 동일 패턴.
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      distinct: ["name", "grade"],
      select: { name: true, grade: true },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ subjects });
  } catch (err) {
    console.error("[/api/subjects]", err);
    return NextResponse.json(
      { error: "과목 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
