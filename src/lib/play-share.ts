/** 학생 응시 진입 URL — 코드는 별도 입력 (쿼리 프리필 없음) */
export function playEntryUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/play`;
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
