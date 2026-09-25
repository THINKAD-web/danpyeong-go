export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    // 대분수 "1 2/3"·"1과 2/3"·"1와2/3" → "1과2/3" — 공백을 지우면 가분수 "12/3" 과 섞이므로 먼저 표준화
    .replace(/(\d)\s*(?:과|와|\s)\s*(\d+\s*\/\s*\d+)/g, "$1과$2")
    .replace(/\s+/g, "")
    .replace(/,/g, "");
}

export function gradeShortAnswer(input: string, keywords: string[]): boolean {
  if (!keywords.length) return false;
  const norm = normalizeAnswer(input);
  return keywords.some((k) => normalizeAnswer(k) === norm);
}
