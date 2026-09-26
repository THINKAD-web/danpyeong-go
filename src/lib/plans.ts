// 요금제 정의 — 요금 페이지·한도·게이트·관리자 화면이 모두 이 파일만 읽는다.
// (docs/PHASE2-5_지시서.md 2-A-1, 결정 R2: 무료/프로 차이는 생성 횟수 + 프로 전용 기능뿐.
//  평가 저장·배포·채점·기본 리포트·기본 내보내기는 모든 요금제에서 제한 없음)
// 클라이언트에서도 import 하므로 서버 전용 모듈을 가져오지 않는다.

import { kstMonthStart, kstNextMonthStart } from "./kst";

export type PlanId = "FREE" | "PRO" | "SCHOOL";

export const FREE_MONTHLY_GENERATIONS = 8;

export const PRICES = {
  PRO_MONTHLY: 4900,
  PRO_YEARLY: 39000,
} as const;

/** 프로 전용 기능 — 기능이 출시될 때 이 키로 게이트한다 */
export const PRO_FEATURES = {
  REMEDIAL_QUESTIONS: "오답 기반 보충 문항",
  GROWTH_REPORT: "누적 성장 리포트",
  GRADE_SHARE_SEND: "동학년 평가 공유 보내기",
  CUSTOM_EXPORT: "PDF/Excel 커스텀 (학교 로고 등)",
} as const;
export type ProFeature = keyof typeof PRO_FEATURES;

export const PLANS: Record<
  PlanId,
  { label: string; monthlyGenerationLimit: number | null; proFeatures: boolean }
> = {
  FREE: { label: "Free", monthlyGenerationLimit: FREE_MONTHLY_GENERATIONS, proFeatures: false },
  PRO: { label: "Pro", monthlyGenerationLimit: null, proFeatures: true },
  SCHOOL: { label: "학교 라이선스", monthlyGenerationLimit: null, proFeatures: true },
};

/** 연간 결제 시 절약액 — 요금 페이지 표기용 (R3: "4개월 절약" / "34% 할인") */
export function yearlySavings() {
  const monthlyTotal = PRICES.PRO_MONTHLY * 12;
  const won = monthlyTotal - PRICES.PRO_YEARLY;
  return {
    won,
    months: Math.floor(won / PRICES.PRO_MONTHLY),
    percent: Math.round((won / monthlyTotal) * 100),
  };
}

/** 만료된 유료 요금제는 FREE 로 본다 (데이터는 건드리지 않음) */
export function effectivePlan(
  plan: PlanId,
  expiresAt: Date | null,
  now: Date = new Date()
): PlanId {
  if (plan === "FREE") return "FREE";
  if (expiresAt && expiresAt.getTime() <= now.getTime()) return "FREE";
  return plan;
}

/**
 * 유료 게이팅 시작 시각. BILLING_ENFORCED_FROM(예: "2027-02-01") 을 받아
 * KST 월 1일 00:00 으로 올림한다 — 월 중간에 켜도 그 달은 제한하지 않고 다음 달 1일부터 적용
 * (이미 한도를 넘긴 교사가 갑자기 막히지 않도록). 미설정·형식 오류 = null(게이팅 안 함).
 */
export function enforcementStart(from: string | undefined | null): Date | null {
  if (!from) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(from.trim());
  if (!m) return null;
  const at = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`); // KST 자정
  if (Number.isNaN(at.getTime())) return null;
  // 2027-02-30 같은 없는 날짜는 다음 달로 넘어가므로 거부
  const kst = new Date(at.getTime() + 9 * 60 * 60 * 1000);
  if (kst.getUTCMonth() + 1 !== Number(m[2]) || kst.getUTCDate() !== Number(m[3])) return null;
  const monthStart = kstMonthStart(at);
  return monthStart.getTime() === at.getTime() ? at : kstNextMonthStart(at);
}

export function isEnforced(start: Date | null, now: Date = new Date()): boolean {
  return start !== null && now.getTime() >= start.getTime();
}

export type QuotaDecision =
  | { ok: true }
  | { ok: false; used: number; limit: number };

/**
 * 월간 생성 한도 판정. enforced=false(베타, 게이팅 시작 전)면 항상 통과.
 */
export function evaluateGenerationQuota(params: {
  plan: PlanId;
  used: number;
  enforced: boolean;
}): QuotaDecision {
  const limit = PLANS[params.plan].monthlyGenerationLimit;
  if (!params.enforced || limit === null) return { ok: true };
  if (params.used >= limit) return { ok: false, used: params.used, limit };
  return { ok: true };
}

export function hasProFeature(plan: PlanId, enforced: boolean): boolean {
  return !enforced || PLANS[plan].proFeatures;
}
