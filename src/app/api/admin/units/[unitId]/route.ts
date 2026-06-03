import { NextRequest, NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ unitId: string }> };

const UpdateUnitSchema = z.object({
  term: z.number().int().min(1).max(2).optional(),
  order: z.number().int().min(1).optional(),
  name: z.string().min(1).optional(),
  achievementStandard: z.string().nullable().optional(),
  constraints: z.string().nullable().optional(),
});

// PATCH /api/admin/units/[unitId]
export async function PATCH(req: NextRequest, { params }: Params) {
  await currentAdmin();
  const { unitId } = await params;
  const body = await req.json();
  const parsed = UpdateUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  try {
    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: parsed.data,
    });
    return NextResponse.json({ unit });
  } catch {
    return NextResponse.json({ error: "단원을 찾을 수 없습니다." }, { status: 404 });
  }
}

// DELETE /api/admin/units/[unitId]
// 문항이 있으면 soft-delete(isArchived=true), 없으면 hard-delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  await currentAdmin();
  const { unitId } = await params;

  const questionCount = await prisma.question.count({ where: { unitId } });

  if (questionCount > 0) {
    // 기존 문항 보호: soft-delete
    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: { isArchived: true },
    });
    return NextResponse.json({
      unit,
      warning: `이 단원에 문항 ${questionCount}개가 있어 보관 처리됐습니다. 기존 테스트는 유지됩니다.`,
    });
  }

  await prisma.unit.delete({ where: { id: unitId } });
  return NextResponse.json({ deleted: true });
}
