// 교사 요금제·월간 생성 한도 판정 (서버 전용)
// BILLING_ENFORCED_FROM(KST 날짜) 이후에만 차단한다 — 그 전까지는 사용량 표시만 하고 막지 않음.
// 월 중간 날짜를 넣으면 다음 달 1일부터 적용(유예). 문제가 생기면 이 변수를 지우는 것으로 롤백한다.

import "server-only";

import { prisma } from "./prisma";
import { getUserMonthlyCount } from "./ai-rate-limit";
import { kstNextMonthStart } from "./kst";
import {
  PLANS,
  effectivePlan,
  enforcementStart,
  evaluateGenerationQuota,
  isEnforced,
  type PlanId,
} from "./plans";

function billingEnforcementStart(): Date | null {
  const raw = process.env.BILLING_ENFORCED_FROM;
  const start = enforcementStart(raw);
  if (raw && !start) {
    console.error(`[entitlements] BILLING_ENFORCED_FROM 형식 오류 (YYYY-MM-DD): "${raw}" — 게이팅 안 함`);
  }
  return start;
}

export type PlanStatus = {
  plan: PlanId;
  planLabel: string;
  planExpiresAt: string | null;
  monthlyUsed: number;
  monthlyLimit: number | null; // null = 무제한
  resetsAt: string; // 다음 달 1일 00:00 KST (ISO)
  enforced: boolean;
  enforcementStartsAt: string | null; // 게이팅 예정일(아직 전이면 ISO, 이미 시작/미설정이면 null)
};

/** User.id 기준. User 행이 없으면(첫 생성 전) FREE·0회 */
export async function getPlanStatus(userId: string | null): Promise<PlanStatus> {
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, planExpiresAt: true },
      })
    : null;
  const start = billingEnforcementStart();
  const plan = user ? effectivePlan(user.plan, user.planExpiresAt) : "FREE";
  const monthlyUsed = userId ? await getUserMonthlyCount(userId) : 0;
  return {
    plan,
    planLabel: PLANS[plan].label,
    planExpiresAt: plan !== "FREE" && user?.planExpiresAt ? user.planExpiresAt.toISOString() : null,
    monthlyUsed,
    monthlyLimit: PLANS[plan].monthlyGenerationLimit,
    resetsAt: kstNextMonthStart().toISOString(),
    enforced: isEnforced(start),
    enforcementStartsAt: start && !isEnforced(start) ? start.toISOString() : null,
  };
}

export type GenerationQuotaResult =
  | { ok: true }
  | {
      ok: false;
      status: 402;
      code: "PLAN_LIMIT";
      error: string;
      hint: string;
      used: number;
      limit: number;
      resetsAt: string;
    };

export async function checkGenerationQuota(userId: string): Promise<GenerationQuotaResult> {
  const status = await getPlanStatus(userId);
  const decision = evaluateGenerationQuota({
    plan: status.plan,
    used: status.monthlyUsed,
    enforced: status.enforced,
  });
  if (decision.ok) return { ok: true };
  return {
    ok: false,
    status: 402,
    code: "PLAN_LIMIT",
    error:
      "이번 달 무료 생성 횟수를 모두 사용했어요. 프로로 업그레이드하면 무제한으로 사용할 수 있어요.",
    hint: "직접 문항 추가, 기존 평가 배포·채점은 계속 무료로 쓸 수 있어요.",
    used: decision.used,
    limit: decision.limit,
    resetsAt: status.resetsAt,
  };
}
