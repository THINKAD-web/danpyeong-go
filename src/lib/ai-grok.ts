// ============================================================
// AI 문항 생성 — Grok (xAI) API 연동
// 모델: grok-3  (OpenAI-compatible API, base: https://api.x.ai/v1)
//
// Claude(ai.ts)와 동일한 프롬프트·검산·재생성 로직 사용.
// 모델 클라이언트만 교체 — 공정 비교 보장.
// ============================================================

import OpenAI from "openai";
import {
  GenerateInputSchema,
  GenerateInput,
  GeneratedQuestion,
  RawMCQ,
  RawSA,
  RawQuestion,
  SYSTEM_PROMPT,
  VERIFY_SYSTEM_PROMPT,
  stripFences,
  assembleMCQ,
  buildUserPrompt,
  buildVerifyPrompt,
} from "./ai-shared";

export { validateQuestion } from "./ai-shared";
export type { GenerateInput, GeneratedQuestion } from "./ai-shared";

export const GROK_MODEL = "grok-3";

// ── API 호출 ───────────────────────────────────────────────

async function callGrok(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string
): Promise<RawQuestion[]> {
  const response = await client.chat.completions.create({
    model: GROK_MODEL,
    max_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const rawText = response.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(stripFences(rawText)) as { questions: RawQuestion[] };
  return parsed.questions;
}

async function generateAndVerify(
  client: OpenAI,
  input: GenerateInput,
  count: number
): Promise<RawQuestion[]> {
  // Pass 1: 생성 (JSON 파싱 실패 시 1회 재시도)
  let raw: RawQuestion[] | undefined;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      raw = await callGrok(client, SYSTEM_PROMPT, buildUserPrompt(input, count));
      break;
    } catch (e) {
      lastErr = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!raw) {
    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    throw new Error(`Pass 1 실패: ${msg}`);
  }

  // Pass 2: correctValue 검증·교정·결함 문항 제거 (객관식만)
  if (input.type === "MULTIPLE_CHOICE") {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        raw = await callGrok(client, VERIFY_SYSTEM_PROMPT, buildVerifyPrompt(raw));
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
 * 문항 생성 진입점 (Grok).
 * Claude와 동일 로직 — 모델만 grok-3으로 교체.
 */
export async function generateQuestionsGrok(
  input: GenerateInput
): Promise<GeneratedQuestion[]> {
  GenerateInputSchema.parse(input);

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY 환경변수가 설정되지 않았습니다.");
  const client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });

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
