// KST(UTC+9, 서머타임 없음) 날짜 경계 — 서버(Vercel)는 UTC 로 돌기 때문에
// Date#setHours 같은 로컬 시간 API 를 쓰면 경계가 KST 오전 9시로 밀린다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstParts(now: Date) {
  const k = new Date(now.getTime() + KST_OFFSET_MS);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth(), d: k.getUTCDate() };
}

/** KST 오늘 00:00 */
export function kstDayStart(now: Date = new Date()): Date {
  const { y, m, d } = kstParts(now);
  return new Date(Date.UTC(y, m, d) - KST_OFFSET_MS);
}

/** KST 이번 달 1일 00:00 */
export function kstMonthStart(now: Date = new Date()): Date {
  const { y, m } = kstParts(now);
  return new Date(Date.UTC(y, m, 1) - KST_OFFSET_MS);
}

/** KST 다음 달 1일 00:00 — 월간 한도 초기화 시각 */
export function kstNextMonthStart(now: Date = new Date()): Date {
  const { y, m } = kstParts(now);
  return new Date(Date.UTC(y, m + 1, 1) - KST_OFFSET_MS);
}

/** "12월 1일" 형태 (KST) */
export function formatKstMonthDay(date: Date): string {
  const { m, d } = kstParts(date);
  return `${m + 1}월 ${d}일`;
}
