import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  checkDemoRateLimit,
  clampDemoCount,
  clearDemoInProgress,
  clientIpFromHeaders,
  logDemoAiUsage,
  markDemoInProgress,
} from "@/lib/demo-rate-limit";
import { pickDemoSamples, toPublicDemoQuestion } from "@/lib/demo-samples";

const DemoGenerateSchema = z.object({
  unitId: z.string().min(1),
  grade: z.number().int().min(3).max(4),
  term: z.number().int().min(1).max(2),
  count: z.number().int().min(1).max(20).optional().default(3),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  type: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]).default("MULTIPLE_CHOICE"),
});

// POST /api/demo/generate
// 사전 생성 샘플만 반환 — Claude API 호출 없음, Question 테이블 저장 없음
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

    const unit = await prisma.unit.findFirst({
      where: {
        id: parsed.data.unitId,
        isArchived: false,
        term: parsed.data.term,
        subject: { name: "수학", grade: parsed.data.grade },
      },
      select: { id: true, name: true },
    });
    if (!unit) {
      return NextResponse.json(
        { error: "체험 가능한 단원이 아니거나 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const count = clampDemoCount(parsed.data.count);

    markDemoInProgress(ipHash);
    let publicQuestions;
    try {
      const samples = await prisma.demoSampleQuestion.findMany({
        where: { unitId: unit.id },
      });

      if (samples.length === 0) {
        return NextResponse.json(
          {
            error: "이 단원 샘플은 준비 중입니다.",
            hint: "다른 단원을 골라 보시거나, 가입 후 직접 AI로 문항을 만들어 보세요.",
          },
          { status: 404 }
        );
      }

      const picked = pickDemoSamples(samples, count, parsed.data.type);
      publicQuestions = picked.map(toPublicDemoQuestion);
    } finally {
      clearDemoInProgress(ipHash);
    }

    logDemoAiUsage({
      ipHash,
      unitId: parsed.data.unitId,
      model: "demo-sample",
      questionCount: publicQuestions.length,
      questionType: parsed.data.type,
    }).catch((e) => console.error("[demo-generate] 로그 기록 실패:", e));

    return NextResponse.json({
      questions: publicQuestions,
      generated: publicQuestions.length,
      kept: publicQuestions.length,
      saved: 0,
      demo: true,
      countUsed: publicQuestions.length,
      fromSamples: true,
    });
  } catch (err) {
    if (ipHash) clearDemoInProgress(ipHash);
    console.error("[/api/demo/generate]", err);
    return NextResponse.json(
      { error: "문항을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
