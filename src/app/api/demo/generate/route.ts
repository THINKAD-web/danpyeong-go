import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestions, validateQuestion } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import {
  checkDemoRateLimit,
  clampDemoCount,
  clearDemoInProgress,
  clientIpFromHeaders,
  logDemoAiUsage,
  markDemoInProgress,
} from "@/lib/demo-rate-limit";

const DemoGenerateSchema = z.object({
  unitId: z.string().min(1),
  grade: z.number().int().min(3).max(4),
  term: z.number().int().min(1).max(2),
  // 스키마상 여유 있게 받고, 서버에서 3 이하로 clamp
  count: z.number().int().min(1).max(20).optional().default(3),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  type: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]).default("MULTIPLE_CHOICE"),
});

// POST /api/demo/generate — 인증 불필요, DB 저장 없음, 엄격한 rate limit
export async function POST(req: NextRequest) {
  let ipHash: string | null = null;

  try {
    const body = await req.json();
    const parsed = DemoGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ip = clientIpFromHeaders(req.headers);
    const limitCheck = await checkDemoRateLimit(ip);
    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: limitCheck.error, hint: limitCheck.hint },
        { status: limitCheck.status }
      );
    }
    ipHash = limitCheck.ipHash;

    // 허용 단원만: 수학 3·4학년 + 요청 grade/term 일치
    const unit = await prisma.unit.findFirst({
      where: {
        id: parsed.data.unitId,
        isArchived: false,
        term: parsed.data.term,
        subject: { name: "수학", grade: parsed.data.grade },
      },
      select: { name: true, constraints: true },
    });
    if (!unit) {
      return NextResponse.json(
        { error: "체험 가능한 단원이 아니거나 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const count = clampDemoCount(parsed.data.count);
    const unitConstraints = unit.constraints ?? undefined;

    markDemoInProgress(ipHash);
    let questions;
    try {
      questions = await generateQuestions({
        unitId: parsed.data.unitId,
        grade: parsed.data.grade,
        term: parsed.data.term,
        count,
        difficulty: parsed.data.difficulty,
        type: parsed.data.type,
        unitName: unit.name,
        unitConstraints,
      });
    } finally {
      clearDemoInProgress(ipHash);
    }

    const valid = questions.filter((q) => validateQuestion(q) === null);

    // 사용량만 기록 — Question/Test 저장 없음
    logDemoAiUsage({
      ipHash,
      unitId: parsed.data.unitId,
      model: "claude-sonnet-4-6",
      questionCount: count,
      questionType: parsed.data.type,
    }).catch((e) => console.error("[demo-generate] 로그 기록 실패:", e));

    return NextResponse.json({
      questions: valid,
      generated: questions.length,
      kept: valid.length,
      saved: 0, // 데모는 항상 0 — DB 미저장
      demo: true,
      countUsed: count,
    });
  } catch (err) {
    if (ipHash) clearDemoInProgress(ipHash);
    console.error("[/api/demo/generate]", err);
    return NextResponse.json(
      { error: "문항 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
