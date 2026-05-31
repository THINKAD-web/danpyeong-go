import { NextRequest, NextResponse } from "next/server";
import {
  generateQuestions,
  validateQuestion,
  GenerateInputSchema,
} from "@/lib/ai";
import { currentTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/ai/generate
// body: { unitId, unitName, term, count, difficulty, type }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = GenerateInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다.", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const questions = await generateQuestions(parsed.data);

    // 품질 가드: validateQuestion 통과한 문항만 사용
    const valid = questions.filter((q) => validateQuestion(q) === null);

    // DB 저장 (best-effort: 실패해도 생성 결과는 반환)
    let savedCount = 0;
    try {
      const teacher = currentTeacher();

      // 데모 교사 User가 없으면 upsert (Clerk 연동 전 임시 처리)
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
      console.error("[/api/ai/generate] DB 저장 실패 (생성 결과는 유지):", dbErr);
    }

    return NextResponse.json({
      questions: valid,
      generated: questions.length,
      kept: valid.length,
      saved: savedCount,
    });
  } catch (err) {
    console.error("[/api/ai/generate]", err);
    return NextResponse.json(
      { error: "문항 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
