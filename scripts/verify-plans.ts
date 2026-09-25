/**
 * 요금제 판정·월간 생성 한도·KST 경계 검증 (DB 불필요).
 * 실행: npx tsx scripts/verify-plans.ts
 */
import {
  effectivePlan,
  enforcementStart,
  isEnforced,
  evaluateGenerationQuota,
  FREE_MONTHLY_GENERATIONS,
  hasProFeature,
  yearlySavings,
} from "../src/lib/plans";
import { formatKstMonthDay, kstDayStart, kstMonthStart, kstNextMonthStart } from "../src/lib/kst";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
const iso = (d: Date) => d.toISOString();

// ── KST 경계 (서버 UTC 와 무관) ───────────────────────────
// 2026-11-30 23:59 KST = 2026-11-30T14:59Z → 아직 11월
const lateNov = new Date("2026-11-30T14:59:00Z");
assert(iso(kstMonthStart(lateNov)) === "2026-10-31T15:00:00.000Z", "KST month start = Nov 1 00:00 KST");
assert(iso(kstNextMonthStart(lateNov)) === "2026-11-30T15:00:00.000Z", "resets at Dec 1 00:00 KST");
assert(formatKstMonthDay(kstNextMonthStart(lateNov)) === "12월 1일", "reset label 12월 1일");
// 2026-12-01 00:00 KST = 2026-11-30T15:00Z → 12월
const dec1 = new Date("2026-11-30T15:00:00Z");
assert(iso(kstMonthStart(dec1)) === "2026-11-30T15:00:00.000Z", "KST month rolls over at 00:00 KST, not 09:00");
// 일일 경계: 2026-11-15 08:59 KST 는 15일 (UTC 로는 14일 23:59)
const morning = new Date("2026-11-14T23:59:00Z");
assert(iso(kstDayStart(morning)) === "2026-11-14T15:00:00.000Z", "KST day start = 00:00 KST (UTC bug fixed)");
// 연말
assert(iso(kstNextMonthStart(new Date("2026-12-20T00:00:00Z"))) === "2026-12-31T15:00:00.000Z", "Dec → Jan 1 KST");

// ── effectivePlan ─────────────────────────────────────────
const now = new Date("2027-03-01T00:00:00Z");
assert(effectivePlan("FREE", null, now) === "FREE", "FREE stays FREE");
assert(effectivePlan("PRO", null, now) === "PRO", "PRO without expiry");
assert(effectivePlan("PRO", new Date("2027-04-01T00:00:00Z"), now) === "PRO", "PRO before expiry");
assert(effectivePlan("PRO", new Date("2027-02-28T00:00:00Z"), now) === "FREE", "expired PRO → FREE");
assert(effectivePlan("SCHOOL", new Date("2027-03-01T00:00:00Z"), now) === "FREE", "expiry instant → FREE");

// ── 월간 한도 (R2: 저장 제한 없음, 생성 횟수만) ───────────
assert(FREE_MONTHLY_GENERATIONS === 8, "Free = 월 8회");
const at = (used: number) => evaluateGenerationQuota({ plan: "FREE", used, enforced: true });
assert(at(7).ok, "Free 8번째 생성 허용 (used=7)");
const over = at(8);
assert(!over.ok && over.limit === 8 && over.used === 8, "Free 9번째 생성 차단 (used=8)");
assert(evaluateGenerationQuota({ plan: "FREE", used: 100, enforced: false }).ok, "not enforced → never blocks");
assert(evaluateGenerationQuota({ plan: "PRO", used: 1000, enforced: true }).ok, "PRO unlimited");
assert(evaluateGenerationQuota({ plan: "SCHOOL", used: 1000, enforced: true }).ok, "SCHOOL unlimited");

// ── 게이팅 시작일 + 월 중간 유예 ──────────────────────────
assert(enforcementStart(undefined) === null && enforcementStart("") === null, "unset → no gating");
assert(enforcementStart("2027/02/01") === null && enforcementStart("soon") === null, "bad format → no gating");
assert(enforcementStart("2027-02-30") === null && enforcementStart("2027-13-01") === null, "impossible date → no gating");
const feb1 = enforcementStart("2027-02-01");
assert(feb1 !== null && iso(feb1) === "2027-01-31T15:00:00.000Z", "1st of month → starts that day 00:00 KST");
const midFeb = enforcementStart("2027-02-15");
assert(midFeb !== null && iso(midFeb) === "2027-02-28T15:00:00.000Z", "mid-month → deferred to Mar 1 00:00 KST");
assert(!isEnforced(midFeb, new Date("2027-02-20T00:00:00Z")), "grace: rest of February not enforced");
assert(isEnforced(midFeb, new Date("2027-02-28T15:00:00Z")), "enforced from Mar 1 00:00 KST");
assert(!isEnforced(feb1, new Date("2027-01-31T14:59:59Z")), "not enforced 1s before start");
assert(!isEnforced(null), "null start → never enforced");

// ── 프로 기능 게이트 ──────────────────────────────────────
assert(hasProFeature("FREE", false), "beta: Pro features open to everyone");
assert(!hasProFeature("FREE", true), "enforced: Free has no Pro features");
assert(hasProFeature("PRO", true) && hasProFeature("SCHOOL", true), "enforced: Pro/School have Pro features");

// ── 연간 할인 표기 (R3) ───────────────────────────────────
const save = yearlySavings();
assert(save.won === 19800 && save.months === 4 && save.percent === 34, "연간 = 19,800원 · 4개월 · 34% 절약");

console.log("\nAll plan checks passed.");
