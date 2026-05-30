import { NextRequest, NextResponse } from "next/server";
import {
  generateQuestions,
  validateQuestion,
  GenerateInputSchema,
} from "@/lib/ai";

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

    // 품질 가드: 잘못된 문항 필터링 (실제 API 응답에도 동일 적용)
    const valid = questions.filter((q) => validateQuestion(q) === null);

    return NextResponse.json({
      questions: valid,
      generated: questions.length,
      kept: valid.length,
      mock: true,
    });
  } catch (err) {
    console.error("[/api/ai/generate]", err);
    return NextResponse.json(
      { error: "문항 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
