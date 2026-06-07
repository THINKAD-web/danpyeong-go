// ============================================================
// AI 문항 생성 — Claude/Grok 공유 프롬프트·타입·헬퍼
// ai.ts(Claude)와 ai-grok.ts(Grok) 양쪽에서 임포트한다.
// ============================================================

import { z } from "zod";

export const GenerateInputSchema = z.object({
  unitId: z.string().min(1),
  unitName: z.string().min(1),
  grade: z.number().int().min(1).max(6).default(3),
  term: z.number().int().min(1).max(2),
  count: z.number().int().min(1).max(20),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  type: z.enum(["MULTIPLE_CHOICE", "SHORT_ANSWER"]),
  // DB에서 편집된 단원 제약 — 있으면 getUnitConstraints() 기본값 대신 사용
  unitConstraints: z.string().optional(),
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
  source?: "AI" | "MANUAL";
};

export type RawMCQ = {
  type: "MULTIPLE_CHOICE";
  difficulty: GenerateInput["difficulty"];
  stem: string;
  correctValue: string;
  distractors: string[];
  explanation: string;
};

export type RawSA = {
  type: "SHORT_ANSWER";
  difficulty: GenerateInput["difficulty"];
  stem: string;
  answerKeywords: string[];
  explanation: string;
};

export type RawQuestion = RawMCQ | RawSA;

// ── 프롬프트 ──────────────────────────────────────────────

export function buildSystemPrompt(grade: number): string {
  return `당신은 대한민국 초등학교 수학 평가 문항 출제 전문가입니다.
2022 개정 교육과정을 따르며, 초등학교 ${grade}학년 학생의 인지 수준에 맞는
단원평가 문항을 출제합니다.

[출제 원칙]
- ${grade}학년 학생이 이해할 수 있는 쉽고 명확한 한국어를 사용한다.
- 한 문항은 하나의 개념만 평가한다.
- 객관식은 4지선다이며, 정답은 정확히 1개다.
- 오답(매력적 오답)은 학생이 흔히 하는 실수를 반영하되, 명백히 틀린 것이어야 한다.
- 보기 간 길이·형식을 비슷하게 맞춰 정답이 티 나지 않게 한다.
- 숫자 계산은 반드시 검산하여 correctValue와 해설이 일치하도록 한다.
- 문화적으로 한국 초등학생에게 자연스러운 소재(이름, 상황)를 쓴다.
- 해설은 풀이 과정을 단계적으로, ${grade}학년이 읽을 수 있게 쓴다.

[계산 정확성 — 필수]
- stem에 포함된 모든 숫자 연산을 직접 계산한 뒤 correctValue를 확정한다.
- 나눗셈 문항: 나누어 떨어지는 수만 사용하거나, 나머지가 있을 경우 반드시 "나머지를 구하시오" 형태로 명시한다.
  예) "28 ÷ 5의 몫을 구하시오" 는 나머지가 3이므로 금지. → "28 ÷ 4 = □" 처럼 나누어 떨어지는 수 사용.
  예) 나머지를 묻고 싶다면 "28 ÷ 5의 나머지는 얼마입니까?" 형태로 명시.
- 단위 변환: 1L=1000mL, 1kg=1000g, 1m=100cm, 1km=1000m 기준 엄수.
- 결과값이 음수·소수가 되는 연산 금지.

[교육과정 범위 — 절대 준수]
- 반드시 ${grade}학년 교육과정 범위 안의 개념만 사용한다.
- ${grade + 1}학년 이상에서 처음 등장하는 개념(예: 넓이=가로×세로, 비례식, 분수의 나눗셈 등)은 절대 사용하지 않는다.
- 지정된 단원 이외의 개념을 문항에 혼용하지 않는다.

[금지]
- 교육과정 범위를 벗어나는 개념 사용 금지.
- 함정성 표현, 이중 부정, 모호한 문장 금지.
- 특정 교과서·기출문제의 문구를 그대로 베끼지 않는다(자체 창작).
- distractors 에 correctValue 와 동일한 값을 포함하지 않는다.
- distractors 3개가 서로 중복되지 않아야 한다.

[출력 형식]
- 반드시 유효한 JSON만 출력한다. 코드펜스(\`\`\`)나 설명 문장을 절대 덧붙이지 않는다.`;
}

export function buildVerifySystemPrompt(grade: number, unitName: string): string {
  return `당신은 초등학교 수학 문항 검수 전문가입니다.
주어진 JSON 문항 배열을 검토하여 오류를 교정하고 동일 스키마로 반환합니다.

[검수 절차 — 각 문항마다 반드시 수행]
1. stem을 처음부터 직접 계산한다. 외부 정보나 기존 correctValue는 참고하지 않는다.
2. 직접 계산한 값과 correctValue를 비교한다.
3. 다르면 correctValue와 explanation을 올바른 값으로 교정한다.
4. 다음 중 하나라도 해당하면 해당 문항을 배열에서 제거한다:
   - 나눗셈 연산이 포함된 stem에서 나누어 떨어지지 않는데 몫만 묻는 경우
   - 결과가 음수·소수가 되는 경우
   - 어떻게 계산해도 명확한 정답을 구할 수 없는 경우
   - ${grade}학년 ${unitName} 단원 범위를 벗어나는 개념이 사용된 경우 (예: ${grade + 1}학년 이상 개념)
5. distractors에 correctValue와 동일한 값이 있으면 다른 오답으로 교체한다.
6. distractors 3개 중 중복이 있으면 중복 오답을 다른 값으로 교체한다.
7. distractors는 정확히 3개여야 한다.

[출력 형식]
- 반드시 유효한 JSON만 출력한다. 코드펜스나 설명 문장을 절대 덧붙이지 않는다.
- 스키마: { "questions": [ ...교정된 문항 배열... ] }`;
}

// ── 단원별 제약 힌트 ───────────────────────────────────────

export function getUnitConstraints(unitName: string): string {
  const hints: string[] = [];

  if (unitName.includes("나눗셈")) {
    hints.push(
      "나눗셈: stem에 사용하는 수는 반드시 나누어 떨어지는 수만 선택하거나, " +
      "나머지를 묻는 형태로 명시할 것. " +
      "나누어 떨어지지 않는 수로 몫만 묻는 문항은 절대 생성 금지. " +
      "예) ○÷△ 형태로 쓸 때, ○이 △로 나누어 떨어지는지 먼저 확인."
    );
  }
  if (unitName.includes("곱셈")) {
    hints.push(
      "곱셈: 올림이 발생하는 경우 각 자릿값 계산을 단계적으로 검산할 것. " +
      "3학년 1학기는 (두 자리)×(한 자리), 2학기는 (두·세 자리)×(한·두 자리) 범위. " +
      "곱의 자릿수가 예상을 벗어나는 오류 주의."
    );
  }
  if (unitName.includes("분수")) {
    hints.push(
      "분수: 분모는 10 이하 자연수. 1학기는 단위분수·크기 비교, 2학기는 대분수·가분수 변환 포함. " +
      "약분·통분은 3학년 범위 초과이므로 사용 금지. " +
      "소수와 혼용하지 않는다."
    );
  }
  if (unitName.includes("들이") || unitName.includes("무게")) {
    hints.push(
      "들이·무게: 단위 변환 1L=1000mL, 1kg=1000g 기준 엄수. " +
      "뺄셈 결과가 음수가 되는 상황 금지. " +
      "단위를 혼용(mL를 L로 쓰는 등)하지 않는다. " +
      "보기의 단위를 stem과 일치시킬 것."
    );
  }
  if (unitName.includes("길이") || unitName.includes("시간")) {
    hints.push(
      "길이·시간: 단위 변환 1m=100cm, 1km=1000m, 1시간=60분, 1분=60초 엄수. " +
      "결과가 음수가 되는 뺄셈 금지."
    );
  }
  if (unitName.includes("덧셈") || unitName.includes("뺄셈")) {
    hints.push(
      "덧셈·뺄셈: 세 자리 수 범위(0~999) 내 계산. 받아올림·받아내림 검산 필수. " +
      "결과가 음수가 되는 뺄셈 금지."
    );
  }

  return hints.length > 0
    ? `\n[단원별 주의사항 — 반드시 준수]\n${hints.map((h) => `- ${h}`).join("\n")}`
    : "";
}

// ── 헬퍼 ──────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}

export function assembleMCQ(raw: RawMCQ): GeneratedQuestion {
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

export function buildUserPrompt(input: GenerateInput, count = input.count): string {
  const diffLabel = { EASY: "하", MEDIUM: "중", HARD: "상" }[input.difficulty];
  const isMCQ = input.type === "MULTIPLE_CHOICE";
  // DB에 편집된 제약이 있으면 우선 사용, 없으면 unitName 기반 기본값 사용
  const unitConstraints = input.unitConstraints
    ? `\n[단원별 주의사항 — 반드시 준수]\n- ${input.unitConstraints}`
    : getUnitConstraints(input.unitName);

  const grade = input.grade ?? 3;
  return `다음 조건으로 초등학교 ${grade}학년 수학 단원평가 문항을 만들어 주세요.

- 학년/학기: ${grade}학년 ${input.term}학기
- 단원: ${input.unitName}
- 성취기준(참고): 해당 단원의 핵심 계산 및 개념 이해
- 문항 수: ${count}개
- 난이도: ${diffLabel}  (하=기초 계산/개념 확인, 중=개념 적용, 상=문장제·복합 사고)
- 유형: ${input.type}
- 절대 준수: ${grade}학년 ${input.unitName} 단원 범위를 벗어나는 개념 사용 금지. ${grade + 1}학년 이상에서 배우는 내용(예: 넓이 공식, 비례식, 분수의 나눗셈 등)은 절대 포함하지 말 것.
${unitConstraints}

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

주의:
- isCorrect 필드는 출력하지 않는다. 보기 조합·순서는 서버가 처리한다.
- distractors 3개는 서로 다른 값이어야 하고, correctValue와도 달라야 한다.
- correctValue는 stem을 직접 계산한 결과여야 한다.
- 나눗셈이 포함된 stem은 반드시 나누어 떨어지는지 확인 후 작성한다.` :
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

export function buildVerifyPrompt(questions: RawQuestion[], grade: number, unitName: string): string {
  return `대상: ${grade}학년 ${unitName} 단원 문항

아래 문항들의 correctValue가 stem을 실제로 풀었을 때 나오는 값과 일치하는지 검수하세요.
각 문항을 처음부터 직접 계산하여 틀린 경우 correctValue와 explanation을 교정해 반환하세요.
나눗셈이 나누어 떨어지지 않는데 몫만 묻는 문항은 배열에서 제거하세요.
${grade}학년 ${unitName} 단원 범위를 벗어나는 개념(${grade + 1}학년 이상 내용 포함)이 사용된 문항은 배열에서 제거하세요.
distractors에 correctValue와 같은 값이 있거나 distractors 간 중복이 있으면 다른 값으로 교체하세요.

${JSON.stringify({ questions }, null, 2)}`;
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
