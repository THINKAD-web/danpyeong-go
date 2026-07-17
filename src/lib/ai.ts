// ============================================================
// AI 문항 생성 — Claude API 연동 (구조적 정답 보장)
// 모델: claude-sonnet-4-6
//
// 설계 원칙 (stem-정답 불일치 구조적 차단):
//   Pass 1: 모델은 stem·correctValue·distractors·explanation만 생성.
//            isCorrect 플래그를 모델에게 맡기지 않는다.
//   Pass 2: 모델이 stem을 독립적으로 풀어 correctValue 검증·교정.
//            성립 불가 문항(나머지≠0 등) → 제거.
//   보충:   Pass 2에서 제거된 수만큼 재생성 (최대 2라운드).
//   조립:   코드가 correctValue 기준으로 isCorrect를 기계적으로 부여.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import {
  GenerateInputSchema,
  GenerateInput,
  GeneratedQuestion,
  RawMCQ,
  RawSA,
  RawQuestion,
  buildSystemPrompt,
  buildVerifySystemPrompt,
  stripFences,
  assembleMCQ,
  buildUserPrompt,
  buildVerifyPrompt,
} from "./ai-shared";

export { GenerateInputSchema, validateQuestion } from "./ai-shared";
export type { GenerateInput, GeneratedChoice, GeneratedQuestion } from "./ai-shared";

// ── API 호출 ───────────────────────────────────────────────

async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string
): Promise<RawQuestion[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const rawText = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(stripFences(rawText)) as { questions: RawQuestion[] };
  return parsed.questions;
}

async function generateAndVerify(
  client: Anthropic,
  input: GenerateInput,
  count: number
): Promise<RawQuestion[]> {
  // Pass 1: 생성 (JSON 파싱 실패 시 1회 재시도)
  let raw: RawQuestion[] | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      raw = await callClaude(
        client,
        buildSystemPrompt(input.grade, input.subject),
        buildUserPrompt(input, count)
      );
      break;
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!raw) return [];

  // Pass 2: correctValue 검증·교정·결함 문항 제거 (객관식만)
  if (input.type === "MULTIPLE_CHOICE") {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        raw = await callClaude(
          client,
          buildVerifySystemPrompt(input.grade, input.subject),
          buildVerifyPrompt(raw)
        );
        break;
      } catch {
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  return raw;
}

// ── 공개 API ──────────────────────────────────────────────

/**
 * 문항 생성 진입점.
 * Pass 1 → Pass 2 검증·교정 → 재생성 최대 2라운드 → 조립
 */
export async function generateQuestions(
  input: GenerateInput
): Promise<GeneratedQuestion[]> {
  GenerateInputSchema.parse(input);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  const client = new Anthropic({ apiKey });

  let accepted: RawQuestion[] = await generateAndVerify(client, input, input.count);

  for (let round = 0; round < 2 && accepted.length < input.count; round++) {
    const needed = input.count - accepted.length;
    const extras = await generateAndVerify(client, input, needed);
    accepted = [...accepted, ...extras];
  }

  const assembled: GeneratedQuestion[] = [];
  for (const q of accepted) {
    if (q.type === "MULTIPLE_CHOICE") {
      assembled.push(assembleMCQ(q as RawMCQ));
    } else {
      const sa = q as RawSA;
      assembled.push({
        type: "SHORT_ANSWER",
        difficulty: sa.difficulty,
        stem: sa.stem,
        choices: [],
        answerKeywords: sa.answerKeywords,
        explanation: sa.explanation,
      });
    }
  }

  return assembled;
}
