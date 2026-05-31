// ============================================================
// AI 문항 생성 — Claude API 연동 (구조적 정답 보장)
// 모델: claude-sonnet-4-6
//
// 설계 원칙 (stem-정답 불일치 구조적 차단):
//   Pass 1: 모델은 stem·correctValue·distractors·explanation만 생성.
//            isCorrect 플래그를 모델에게 맡기지 않는다.
//   Pass 2: 모델이 stem을 독립적으로 풀어 correctValue 검증·교정.
//   조립:   코드가 correctValue 기준으로 isCorrect를 기계적으로 부여.
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

// 모델이 반환하는 원시 타입 (isCorrect 없음)
type RawMCQ = {
  type: "MULTIPLE_CHOICE";
  difficulty: GenerateInput["difficulty"];
  stem: string;
  correctValue: string;   // 정답 텍스트 — 코드가 isCorrect 매칭에 사용
  distractors: string[];  // 오답 3개
  explanation: string;
};

type RawSA = {
  type: "SHORT_ANSWER";
  difficulty: GenerateInput["difficulty"];
  stem: string;
  answerKeywords: string[];
  explanation: string;
};

type RawQuestion = RawMCQ | RawSA;

// ── 프롬프트 ──────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 대한민국 초등학교 수학 평가 문항 출제 전문가입니다.
2022 개정 교육과정을 따르며, 초등학교 3학년 학생의 인지 수준에 맞는
단원평가 문항을 출제합니다.

[출제 원칙]
- 3학년 학생이 이해할 수 있는 쉽고 명확한 한국어를 사용한다.
- 한 문항은 하나의 개념만 평가한다.
- 객관식은 4지선다이며, 정답은 정확히 1개다.
- 오답(매력적 오답)은 학생이 흔히 하는 실수를 반영하되, 명백히 틀린 것이어야 한다.
- 보기 간 길이·형식을 비슷하게 맞춰 정답이 티 나지 않게 한다.
- 숫자 계산은 반드시 검산하여 correctValue와 해설이 일치하도록 한다.
- 문화적으로 한국 초등학생에게 자연스러운 소재(이름, 상황)를 쓴다.
- 해설은 풀이 과정을 단계적으로, 3학년이 읽을 수 있게 쓴다.

[금지]
- 교육과정 범위를 벗어나는 개념(예: 3학년에 미등장 연산) 사용 금지.
- 함정성 표현, 이중 부정, 모호한 문장 금지.
- 특정 교과서·기출문제의 문구를 그대로 베끼지 않는다(자체 창작).
- distractors 에 correctValue 와 동일한 값을 포함하지 않는다.
- distractors 3개가 서로 중복되지 않아야 한다.

[출력 형식]
- 반드시 유효한 JSON만 출력한다. 코드펜스(\`\`\`)나 설명 문장을 절대 덧붙이지 않는다.`;

const VERIFY_SYSTEM_PROMPT = `당신은 초등학교 수학 문항 검수 전문가입니다.
주어진 JSON 문항 배열을 검토하여 correctValue 오류를 교정하고 동일 스키마로 반환합니다.

[검수 절차 — 각 문항마다 반드시 수행]
1. stem을 처음부터 직접 계산한다. 외부 정보나 기존 correctValue는 참고하지 않는다.
2. 직접 계산한 값과 correctValue를 비교한다.
3. 다르면 correctValue와 explanation을 올바른 값으로 교정한다.
4. 나눗셈이 나누어 떨어지지 않는 등 문제 자체가 성립 불가이면 해당 문항을 배열에서 제거한다.
5. distractors에 correctValue와 동일한 값이 있으면 다른 오답으로 교체한다.

[출력 형식]
- 반드시 유효한 JSON만 출력한다. 코드펜스나 설명 문장을 절대 덧붙이지 않는다.
- 스키마: { "questions": [ ...교정된 문항 배열... ] }`;

// ── 헬퍼 ──────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

/** RawMCQ → GeneratedQuestion: 코드가 isCorrect를 기계적으로 부여 */
function assembleMCQ(raw: RawMCQ): GeneratedQuestion {
  const options = shuffle([raw.correctValue, ...raw.distractors.slice(0, 3)]);
  return {
    type: "MULTIPLE_CHOICE",
    difficulty: raw.difficulty,
    stem: raw.stem,
    choices: options.map((text, i) => ({
      order: i + 1,
      text,
      isCorrect: text === raw.correctValue,
    })),
    answerKeywords: [],
    explanation: raw.explanation,
  };
}

function buildUserPrompt(input: GenerateInput): string {
  const diffLabel = { EASY: "하", MEDIUM: "중", HARD: "상" }[input.difficulty];
  const isMCQ = input.type === "MULTIPLE_CHOICE";

  return `다음 조건으로 초등학교 3학년 수학 단원평가 문항을 만들어 주세요.

- 학년/학기: 3학년 ${input.term}학기
- 단원: ${input.unitName}
- 성취기준(참고): 해당 단원의 핵심 계산 및 개념 이해
- 문항 수: ${input.count}개
- 난이도: ${diffLabel}  (하=기초 계산/개념 확인, 중=개념 적용, 상=문장제·복합 사고)
- 유형: ${input.type}

${isMCQ ? `아래 JSON 스키마로만 응답하세요 (객관식):

{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "difficulty": "${input.difficulty}",
      "stem": "문제 본문",
      "correctValue": "정답 텍스트 그대로 (예: 72, 3팀, 128자루)",
      "distractors": ["오답1", "오답2", "오답3"],
      "explanation": "단계적 풀이 해설"
    }
  ]
}

주의: isCorrect 필드는 출력하지 않는다. 보기 조합·순서는 서버가 처리한다.
distractors 3개는 서로 다른 값이어야 하고, correctValue와도 달라야 한다.` :
`아래 JSON 스키마로만 응답하세요 (단답형):

{
  "questions": [
    {
      "type": "SHORT_ANSWER",
      "difficulty": "${input.difficulty}",
      "stem": "문제 본문",
      "answerKeywords": ["정답1", "정답1의 다른 표현"],
      "explanation": "단계적 풀이 해설"
    }
  ]
}`}`;
}

function buildVerifyPrompt(questions: RawQuestion[]): string {
  return `아래 문항들의 correctValue가 stem을 실제로 풀었을 때 나오는 값과 일치하는지 검수하세요.
각 문항을 처음부터 직접 계산하여 틀린 경우 correctValue와 explanation을 교정해 반환하세요.

${JSON.stringify({ questions }, null, 2)}`;
}

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

// ── 공개 API ──────────────────────────────────────────────

/**
 * 문항 생성 진입점.
 * Pass 1: 모델이 stem/correctValue/distractors/explanation 생성
 * Pass 2: 모델이 stem을 독립 계산해 correctValue 검증·교정
 * 조립:   코드가 correctValue 기준으로 isCorrect를 기계적으로 부여
 */
export async function generateQuestions(
  input: GenerateInput
): Promise<GeneratedQuestion[]> {
  GenerateInputSchema.parse(input);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  const client = new Anthropic({ apiKey });

  // Pass 1: 생성 (JSON 파싱 실패 시 1회 재시도)
  let rawQuestions: RawQuestion[] | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      rawQuestions = await callClaude(client, SYSTEM_PROMPT, buildUserPrompt(input));
      break;
    } catch (e) {
      lastError = e;
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (!rawQuestions) {
    throw new Error(
      `문항 생성 실패 (2회 시도): ${lastError instanceof Error ? lastError.message : String(lastError)}`
    );
  }

  // Pass 2: correctValue 검증·교정 (실패 시 1차 결과 유지)
  if (input.type === "MULTIPLE_CHOICE") {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        rawQuestions = await callClaude(client, VERIFY_SYSTEM_PROMPT, buildVerifyPrompt(rawQuestions));
        break;
      } catch {
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // 조립: 코드가 isCorrect 기계적 부여
  return rawQuestions
    .filter((q): q is RawMCQ => q.type === "MULTIPLE_CHOICE")
    .map(assembleMCQ)
    .concat(
      rawQuestions
        .filter((q): q is RawSA => q.type === "SHORT_ANSWER")
        .map((q) => ({
          type: "SHORT_ANSWER" as const,
          difficulty: q.difficulty,
          stem: q.stem,
          choices: [],
          answerKeywords: q.answerKeywords,
          explanation: q.explanation,
        }))
    );
}

/** 객관식 정답 1개 / 보기 4개 / 중복 보기 없음 검증 */
export function validateQuestion(q: GeneratedQuestion): string | null {
  if (q.type === "MULTIPLE_CHOICE") {
    if (q.choices.length !== 4) return "객관식 보기는 4개여야 합니다.";
    const correctChoices = q.choices.filter((c) => c.isCorrect);
    if (correctChoices.length !== 1) return "정답은 정확히 1개여야 합니다.";
    const texts = q.choices.map((c) => c.text);
    if (new Set(texts).size !== texts.length) return "보기에 중복된 값이 있습니다.";
  }
  if (q.type === "SHORT_ANSWER" && q.answerKeywords.length === 0) {
    return "단답형은 정답 키워드가 1개 이상 필요합니다.";
  }
  return null;
}
