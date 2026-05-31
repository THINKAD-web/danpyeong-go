export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/,/g, "");
}

export function gradeShortAnswer(input: string, keywords: string[]): boolean {
  if (!keywords.length) return false;
  const norm = normalizeAnswer(input);
  return keywords.some((k) => normalizeAnswer(k) === norm);
}
