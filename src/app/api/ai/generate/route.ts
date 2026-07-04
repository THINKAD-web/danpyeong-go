import { NextRequest, NextResponse } from "next/server";
import {
  generateQuestions,
  validateQuestion,
  GenerateInputSchema,
} from "@/lib/ai";
import { currentTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  markInProgress,
  clearInProgress,
  logAiUsage,
} from "@/lib/ai-rate-limit";

// POST /api/ai/generate
export async function POST(req: NextRequest) {
  let authorId: string | null = null;

  try {
    const body = await req.json();
    const parsed = GenerateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 인증 + DB 사용자 upsert
    const teacher = await currentTeacher();
    const author = await prisma.user.upsert({
      where: { clerkId: teacher.id },
      update: {},
      create: {
        clerkId: teacher.id,
        email: teacher.email,
        name: teacher.name,
        role: "TEACHER",
      },
    });
    authorId = author.id;

    // ── Rate limit 확인 ──────────────────────────────────────
    const limitCheck = await checkRateLimit(authorId);
    if (!limitCheck.ok) {
      return NextResponse.json(
        { error: limitCheck.error, hint: limitCheck.hint },
        { status: limitCheck.status }
      );
    }

    // DB에서 단원 이름·제약 조회 — 프롬프트에는 클라이언트가 보낸 값이 아닌
    // 이 값만 사용한다 (클라이언트발 unitName을 신뢰하지 않기 위함)
    const unit = await prisma.unit.findUnique({
      where: { id: parsed.data.unitId },
      select: { name: true, constraints: true },
    });
    if (!unit) {
      return NextResponse.json({ error: "단원을 찾을 수 없습니다." }, { status: 404 });
    }
    const unitConstraints = unit.constraints ?? undefined;

    // ── 동시 요청 잠금 ────────────────────────────────────────
    markInProgress(authorId);

    let questions;
    try {
      questions = await generateQuestions({ ...parsed.data, unitName: unit.name, unitConstraints });
    } finally {
      // 성공·실패 모두 잠금 해제
      clearInProgress(authorId);
    }

    // 품질 가드
    const valid = questions.filter((q) => validateQuestion(q) === null);

    // ── 사용량 기록 (best-effort, 실패해도 생성 결과 반환) ────
    logAiUsage({
      userId: authorId,
      unitId: parsed.data.unitId,
      model: "claude-sonnet-4-6",
      questionCount: parsed.data.count,
      questionType: parsed.data.type,
    }).catch((e) => console.error("[ai-rate-limit] 로그 기록 실패:", e));

    // ── 문항 DB 저장 (best-effort) ────────────────────────────
    let savedCount = 0;
    try {
      for (const q of valid) {
        await prisma.question.create({
          data: {
            unitId: parsed.data.unitId,
            authorId: author.id,
            type: q.type,
            difficulty: q.difficulty,
            source: "AI",
            stem: q.stem,
            explanation: q.explanation ?? "",
            answerKeywords: q.answerKeywords,
            isReviewed: false,
            choices: {
              create: q.choices.map((c) => ({
                order: c.order,
                text: c.text,
                isCorrect: c.isCorrect,
              })),
            },
          },
        });
        savedCount++;
      }
    } catch (dbErr) {
      console.error("[/api/ai/generate] 문항 DB 저장 실패 (생성 결과는 유지):", dbErr);
    }

    return NextResponse.json({
      questions: valid,
      generated: questions.length,
      kept: valid.length,
      saved: savedCount,
    });
  } catch (err) {
    if (authorId) clearInProgress(authorId);
    console.error("[/api/ai/generate]", err);
    return NextResponse.json(
      { error: "문항 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
