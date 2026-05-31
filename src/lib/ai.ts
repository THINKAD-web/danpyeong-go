// ============================================================
// AI 문항 생성 — Claude API 연동
// 모델: claude-sonnet-4-6 (정확도 우선)
// 프롬프트: AI_문항생성_프롬프트.md SYSTEM/USER 원문 그대로 사용
// 2-pass: 생성 → 자기검산(isCorrect·계산 일치 교정)
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
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

const SYSTEM_PROMPT = `당신은 대한민국 초등학교 수학 평가 문항 출제 전문가입니다.
2022 개정 교육과정을 따르며, 초등학교 3학년 학생의 인지 수준에 맞는
단원평가 문항을 출제합니다.

[출제 원칙]
- 3학년 학생이 이해할 수 있는 쉽고 명확한 한국어를 사용한다.
- 한 문항은 하나의 개념만 평가한다.
- 객관식은 4지선다이며, 정답은 정확히 1개다.
- 오답(매력적 오답)은 학생이 흔히 하는 실수를 반영하되, 명백히 틀린 것이어야 한다.
- 보기 간 길이·형식을 비슷하게 맞춰 정답이 티 나지 않게 한다.
- 숫자 계산은 반드시 검산하여 정답과 해설이 일치하도록 한다.
- 문화적으로 한국 초등학생에게 자연스러운 소재(이름, 상황)를 쓴다.
- 해설은 풀이 과정을 단계적으로, 3학년이 읽을 수 있게 쓴다.

[금지]
- 교육과정 범위를 벗어나는 개념(예: 3학년에 미등장 연산) 사용 금지.
- 함정성 표현, 이중 부정, 모호한 문장 금지.
- 특정 교과서·기출문제의 문구를 그대로 베끼지 않는다(자체 창작).

[출력 형식]
- 반드시 유효한 JSON만 출력한다. 코드펜스(\`\`\`)나 설명 문장을 절대 덧붙이지 않는다.`;

const VERIFY_SYSTEM_PROMPT = `당신은 초등학교 수학 문항 검수 전문가입니다.
주어진 JSON 문항 배열을 검토하여 오류를 교정하고 올바른 JSON만 반환합니다.

[검수 항목]
1. 객관식(MULTIPLE_CHOICE): 각 선택지를 직접 계산하여 실제로 가장 알맞은 정답에만 isCorrect: true를 표시한다.
   - 현재 isCorrect 표시를 신뢰하지 말고, 반드시 직접 계산으로 확인한다.
   - isCorrect: true가 정확히 1개인지 확인한다.
2. 해설이 실제 정답 선택지와 일치하는지 확인하고, 불일치하면 해설을 교정한다.
3. 단답형(SHORT_ANSWER): answerKeywords가 실제 계산 결과와 일치하는지 확인한다.
4. 문제가 풀 수 없거나(예: 나누어 떨어지지 않는 나눗셈) 정답이 선택지에 없으면 해당 문항을 제거한다.

[출력 형식]
- 반드시 유효한 JSON만 출력한다. 코드펜스나 설명 문장을 절대 덧붙이지 않는다.
- 스키마: { "questions": [ ...교정된 문항 배열... ] }`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

function buildUserPrompt(input: GenerateInput): string {
  const diffLabel = { EASY: "하", MEDIUM: "중", HARD: "상" }[input.difficulty];
  return `다음 조건으로 초등학교 3학년 수학 단원평가 문항을 만들어 주세요.

- 학년/학기: 3학년 ${input.term}학기
- 단원: ${input.unitName}
- 성취기준(참고): 해당 단원의 핵심 계산 및 개념 이해
- 문항 수: ${input.count}개
- 난이도: ${diffLabel}  (하=기초 계산/개념 확인, 중=개념 적용, 상=문장제·복합 사고)
- 유형: ${input.type}  (MULTIPLE_CHOICE=객관식 4지선다 / SHORT_ANSWER=단답형)

아래 JSON 스키마로만 응답하세요:

{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "difficulty": "${input.difficulty}",
      "stem": "문제 본문",
      "choices": [
        { "order": 1, "text": "보기1", "isCorrect": false },
        { "order": 2, "text": "보기2", "isCorrect": true },
        { "order": 3, "text": "보기3", "isCorrect": false },
        { "order": 4, "text": "보기4", "isCorrect": false }
      ],
      "answerKeywords": [],
      "explanation": "단계적 풀이 해설"
    }
  ]
}

단답형(SHORT_ANSWER)일 경우:
- "choices"는 빈 배열 []
- "answerKeywords"에 정답으로 인정할 표현을 배열로 (예: ["12", "12개"])`;
}

function buildVerifyPrompt(questions: GeneratedQuestion[]): string {
  return `아래 문항들을 검수하고, 오류를 교정한 JSON을 반환하세요.
각 선택지를 직접 계산하여 isCorrect가 올바른 정답에 붙어 있는지 반드시 확인하세요.

${JSON.stringify({ questions }, null, 2)}`;
}

async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string
): Promise<GeneratedQuestion[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = JSON.parse(stripFences(rawText)) as { questions: GeneratedQuestion[] };
  return parsed.questions;
}

/**
 * 문항 생성 진입점.
 * Pass 1: 문항 생성 (JSON 파싱 실패 시 1회 재시도)
 * Pass 2: 자기검산 — isCorrect·계산 불일치 교정
 */
export async function generateQuestions(
  input: GenerateInput
): Promise<GeneratedQuestion[]> {
  GenerateInputSchema.parse(input);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");

  const client = new Anthropic({ apiKey });

  // Pass 1: 생성
  let questions: GeneratedQuestion[] | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      questions = await callClaude(client, SYSTEM_PROMPT, buildUserPrompt(input));
      break;
    } catch (e) {
      lastError = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!questions) {
    throw new Error(
      `문항 생성 실패 (2회 시도): ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  // Pass 2: 자기검산 (생성 결과를 검수 모델에 재투입)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      questions = await callClaude(client, VERIFY_SYSTEM_PROMPT, buildVerifyPrompt(questions));
      break;
    } catch {
      if (attempt === 1) break; // 검산 실패 시 1차 결과 그대로 반환
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return questions;
}

/** 객관식 정답 1개 / 보기 4개 검증 */
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
