import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ teacherId: string }> };

const PlanSchema = z.object({
  plan: z.enum(["FREE", "PRO", "SCHOOL"]),
  // ISO 날짜. 생략/null = 만료 없음 (FREE 전환 시 무시)
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
});

// PATCH /api/admin/teachers/[teacherId]/plan
// 결제 연동 전 수동 부여 — 학교 계약 성사 시 SCHOOL, 앰버서더·테스트 계정 PRO
export async function PATCH(req: NextRequest, { params }: Params) {
  await currentAdmin();
  const { teacherId } = await params;
  const parsed = PlanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  const { plan, expiresAt } = parsed.data;
  try {
    const user = await prisma.user.update({
      where: { id: teacherId },
      data:
        plan === "FREE"
          ? { plan, planStartedAt: null, planExpiresAt: null }
          : {
              plan,
              planStartedAt: new Date(),
              planExpiresAt: expiresAt ? new Date(expiresAt) : null,
            },
      select: { id: true, email: true, plan: true, planStartedAt: true, planExpiresAt: true },
    });
    console.info(`[admin] plan change teacher=${user.id} plan=${user.plan} expires=${user.planExpiresAt?.toISOString() ?? "none"}`);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "교사를 찾을 수 없습니다." }, { status: 404 });
  }
}
