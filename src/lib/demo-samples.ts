import type { Difficulty, QuestionType } from "@prisma/client";
import type { GeneratedChoice, GeneratedQuestion } from "./ai-shared";

export type DemoSampleChoiceStored = {
  order: number;
  text: string;
  isCorrect: boolean;
};

export type DemoSampleRow = {
  id: string;
  unitId: string;
  type: QuestionType;
  difficulty: Difficulty;
  stem: string;
  choicesJson: unknown;
  answerKeywords: string[];
  explanation: string | null;
};

/** Fisher–Yates */
export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function parseStoredChoices(choicesJson: unknown): DemoSampleChoiceStored[] {
  if (!Array.isArray(choicesJson)) return [];
  return choicesJson
    .map((c) => {
      if (!c || typeof c !== "object") return null;
      const o = c as Record<string, unknown>;
      const order = Number(o.order);
      const text = typeof o.text === "string" ? o.text : "";
      const isCorrect = Boolean(o.isCorrect);
      if (!Number.isFinite(order) || !text) return null;
      return { order, text, isCorrect };
    })
    .filter((c): c is DemoSampleChoiceStored => c !== null);
}

/**
 * 데모 API 응답용 — 정답(isCorrect)·answerKeywords 절대 노출하지 않음.
 * 스키마 형태는 GeneratedQuestion과 동일하게 유지.
 */
export function toPublicDemoQuestion(row: DemoSampleRow): GeneratedQuestion {
  const stored = parseStoredChoices(row.choicesJson);
  const choices: GeneratedChoice[] = stored.map((c) => ({
    order: c.order,
    text: c.text,
    isCorrect: false,
  }));

  return {
    type: row.type,
    difficulty: row.difficulty,
    stem: row.stem,
    choices,
    answerKeywords: [],
    explanation: row.explanation ?? "",
    source: "AI",
  };
}

/** unitId 샘플 풀에서 count개 랜덤 선택. type 일치 분량이 있으면 우선. */
export function pickDemoSamples<T extends { type: QuestionType }>(
  rows: T[],
  count: number,
  preferredType?: QuestionType
): T[] {
  if (rows.length === 0 || count <= 0) return [];
  const preferred =
    preferredType != null ? rows.filter((r) => r.type === preferredType) : [];
  const pool = preferred.length > 0 ? preferred : rows;
  const shuffled = shuffleInPlace([...pool]);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/** 응답에 정답 힌트가 없는지 검사 (테스트용) */
export function assertNoAnswerLeak(q: GeneratedQuestion): boolean {
  if (q.answerKeywords.length > 0) return false;
  if (q.choices.some((c) => c.isCorrect)) return false;
  return true;
}
