import { NextRequest, NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/admin/subjects
export async function GET() {
  await currentAdmin();
  const subjects = await prisma.subject.findMany({
    orderBy: [{ grade: "asc" }, { name: "asc" }],
    include: { _count: { select: { units: true } } },
  });
  return NextResponse.json({ subjects });
}

const CreateSubjectSchema = z.object({
  name: z.string().min(1),
  grade: z.number().int().min(1).max(12),
});

// POST /api/admin/subjects
export async function POST(req: NextRequest) {
  await currentAdmin();
  const body = await req.json();
  const parsed = CreateSubjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  try {
    const subject = await prisma.subject.create({ data: parsed.data });
    return NextResponse.json({ subject }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "이미 존재하는 과목입니다." }, { status: 409 });
  }
}
