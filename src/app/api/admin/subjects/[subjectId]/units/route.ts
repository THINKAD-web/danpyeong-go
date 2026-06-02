import { NextRequest, NextResponse } from "next/server";
import { currentTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ subjectId: string }> };

// GET /api/admin/subjects/[subjectId]/units
export async function GET(_req: NextRequest, { params }: Params) {
  await currentTeacher();
  const { subjectId } = await params;

  const units = await prisma.unit.findMany({
    where: { subjectId },
    orderBy: [{ term: "asc" }, { order: "asc" }],
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json({ units });
}

const CreateUnitSchema = z.object({
  term: z.number().int().min(1).max(2),
  order: z.number().int().min(1),
  name: z.string().min(1),
  achievementStandard: z.string().optional(),
  constraints: z.string().optional(),
});

// POST /api/admin/subjects/[subjectId]/units
export async function POST(req: NextRequest, { params }: Params) {
  await currentTeacher();
  const { subjectId } = await params;
  const body = await req.json();
  const parsed = CreateUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  try {
    const unit = await prisma.unit.create({
      data: { subjectId, ...parsed.data },
    });
    return NextResponse.json({ unit }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "같은 학기·순서의 단원이 이미 존재합니다." },
      { status: 409 }
    );
  }
}
