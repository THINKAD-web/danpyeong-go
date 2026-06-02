// 문항 타입·검증 헬퍼 — 클라이언트/서버 공용 (SDK 의존 없음)

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

/** 객관식 정답 1개 / 보기 4개 / 중복 보기 없음, 단답형 키워드 1개 이상 검증 */
export function validateQuestion(q: GeneratedQuestion): string | null {
  if (q.type === "MULTIPLE_CHOICE") {
    if (q.choices.length !== 4) return "객관식 보기는 4개여야 합니다.";
    const correctChoices = q.choices.filter((c) => c.isCorrect);
    if (correctChoices.length !== 1) return "정답은 정확히 1개여야 합니다.";
    const texts = q.choices.map((c) => c.text);
    if (new Set(texts).size !== texts.length) return "보기에 중복된 값이 있습니다.";
    if (q.choices.some((c) => !c.text.trim())) return "보기 내용을 모두 입력해 주세요.";
  }
  if (q.type === "SHORT_ANSWER" && q.answerKeywords.filter(Boolean).length === 0) {
    return "단답형은 정답 키워드가 1개 이상 필요합니다.";
  }
  if (!q.stem.trim()) return "문제 본문을 입력해 주세요.";
  return null;
}
