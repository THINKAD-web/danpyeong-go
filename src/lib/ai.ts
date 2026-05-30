// ============================================================
// AI 문항 생성 — Mock 구현
// 실제 Grok/Claude 호출 없이, 프롬프트 템플릿과 동일한 JSON 형태를
// 반환하여 화면 흐름을 검증할 수 있게 한다.
//
// ▶ Claude Code 작업 (TASK 0 이후):
//   generateQuestions() 내부의 mock 생성부를 실제 모델 호출로 교체.
//   - SYSTEM/USER 프롬프트는 docs/AI_문항생성_프롬프트.md 참고
//   - 응답 JSON 파싱 → 아래 GeneratedQuestion[] 형태로 정규화
//   - isCorrect 1개 검증, 보기 4개 검증은 그대로 재사용
// ============================================================

import { z } from "zod";

export const GenerateInputSchema = z.object({
  unitId: z.string().min(1),
  unitName: z.string().min(1),
  term: z.number().int().min(1).max(2),
  count: z.number().int().min(1).max(20),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  type: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;

export type GeneratedChoice = {
  order: number;
  text: string;
  isCorrect: boolean;
};

export type GeneratedQuestion = {
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  stem: string;
  choices: GeneratedChoice[];
  answerKeywords: string[];
  explanation: string;
};

// --- mock 데이터 생성용 헬퍼 ---
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 곱셈 단원용 mock 객관식 1문항 */
function mockMultiplyQuestion(difficulty: GenerateInput["difficulty"]): GeneratedQuestion {
  const a = difficulty === "EASY" ? randInt(2, 9) : randInt(11, 49);
  const b = randInt(2, 9);
  const answer = a * b;
  // 흔한 실수 기반 오답
  const distractors = new Set<number>();
  distractors.add(answer + b);
  distractors.add(answer - b);
  distractors.add(a + b);
  while (distractors.size < 3) distractors.add(answer + randInt(1, 9));
  const wrong = [...distractors].filter((n) => n !== answer).slice(0, 3);

  const options = shuffle([
    { value: answer, isCorrect: true },
    ...wrong.map((v) => ({ value: v, isCorrect: false })),
  ]);

  return {
    type: "MULTIPLE_CHOICE",
    difficulty,
    stem: `${a} × ${b} 는 얼마일까요?`,
    choices: options.map((o, i) => ({
      order: i + 1,
      text: String(o.value),
      isCorrect: o.isCorrect,
    })),
    answerKeywords: [],
    explanation: `${a}을(를) ${b}번 더하면 ${answer}입니다. 따라서 ${a} × ${b} = ${answer}.`,
  };
}

/** 단답형 mock 1문항 */
function mockShortAnswerQuestion(difficulty: GenerateInput["difficulty"]): GeneratedQuestion {
  const a = difficulty === "EASY" ? randInt(2, 9) : randInt(11, 49);
  const b = randInt(2, 9);
  const answer = a * b;
  return {
    type: "SHORT_ANSWER",
    difficulty,
    stem: `사과가 한 상자에 ${a}개씩 들어 있습니다. ${b}상자에는 사과가 모두 몇 개 있을까요?`,
    choices: [],
    answerKeywords: [String(answer), `${answer}개`],
    explanation: `한 상자에 ${a}개씩 ${b}상자이므로 ${a} × ${b} = ${answer}(개)입니다.`,
  };
}

/**
 * 문항 생성 진입점.
 * 현재는 mock. 실제 모델 연결 시 이 함수 내부만 교체하면 된다.
 */
export async function generateQuestions(
  input: GenerateInput
): Promise<GeneratedQuestion[]> {
  GenerateInputSchema.parse(input);

  // --- 여기부터 mock 생성 (실제 API 호출로 교체 지점) ---
  await new Promise((r) => setTimeout(r, 600)); // 생성 지연 흉내

  const questions: GeneratedQuestion[] = [];
  for (let i = 0; i < input.count; i++) {
    questions.push(
      input.type === "MULTIPLE_CHOICE"
        ? mockMultiplyQuestion(input.difficulty)
        : mockShortAnswerQuestion(input.difficulty)
    );
  }
  return questions;
  // --- mock 끝 ---
}

/** 객관식 정답 1개 / 보기 4개 검증 (실제 API 응답에도 재사용) */
export function validateQuestion(q: GeneratedQuestion): string | null {
  if (q.type === "MULTIPLE_CHOICE") {
    if (q.choices.length !== 4) return "객관식 보기는 4개여야 합니다.";
    const correct = q.choices.filter((c) => c.isCorrect).length;
    if (correct !== 1) return "정답은 정확히 1개여야 합니다.";
  }
  if (q.type === "SHORT_ANSWER" && q.answerKeywords.length === 0) {
    return "단답형은 정답 키워드가 1개 이상 필요합니다.";
  }
  return null;
}
