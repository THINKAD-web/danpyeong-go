import { NextResponse } from "next/server";
import { currentTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanStatus } from "@/lib/entitlements";

// GET /api/teacher/plan — 현재 요금제 + 이번 달 AI 생성 사용량
export async function GET() {
  try {
    const teacher = await currentTeacher();
    const user = await prisma.user.findUnique({
      where: { clerkId: teacher.id },
      select: { id: true },
    });
    return NextResponse.json(await getPlanStatus(user?.id ?? null));
  } catch (err) {
    console.error("[GET /api/teacher/plan]", err);
    return NextResponse.json({ error: "요금제 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
