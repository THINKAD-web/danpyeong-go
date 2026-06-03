import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/grades — 사용 가능한 학년 목록 (수학 과목 기준)
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      where: { name: "수학" },
      orderBy: { grade: "asc" },
      select: { grade: true },
    });
    return NextResponse.json({ grades: subjects.map((s) => s.grade) });
  } catch (err) {
    console.error("[/api/grades]", err);
    return NextResponse.json({ grades: [3] });
  }
}
