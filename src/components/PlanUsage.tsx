// 요금제·이번 달 AI 생성 사용량 표시 — 대시보드·새 평가 화면 공용
import Link from "next/link";
import type { PlanStatus } from "@/lib/entitlements";
import { formatKstMonthDay } from "@/lib/kst";

export function PlanUsageLine({ status }: { status: PlanStatus }) {
  const unlimited = status.monthlyLimit === null;
  return (
    <p className="text-sm text-ink/60">
      <span className="font-bold text-ink">{status.planLabel} 플랜</span>
      {" · "}
      {unlimited
        ? `이번 달 AI 생성 ${status.monthlyUsed}회 · 무제한`
        : `이번 달 ${status.monthlyUsed}/${status.monthlyLimit}회 사용`}
      {!status.enforced && !unlimited && (
        <span className="text-ink/40"> · 오픈 베타 동안은 한도 없이 사용 중</span>
      )}
      {" · "}
      <Link href="/teacher/billing" className="font-bold text-brand hover:underline">
        요금제
      </Link>
    </p>
  );
}

/** 새 평가 화면 생성 버튼 옆 잔여 횟수 뱃지 */
export function RemainingBadge({ status }: { status: PlanStatus }) {
  if (status.monthlyLimit === null) {
    return (
      <span className="rounded-full border border-ink/20 bg-mint/20 px-2.5 py-0.5 text-xs font-bold text-ink/70">
        {status.planLabel} · 무제한
      </span>
    );
  }
  const left = Math.max(0, status.monthlyLimit - status.monthlyUsed);
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
        status.enforced && left === 0 ? "border-coral/40 bg-coral/10 text-coral" : "border-ink/20 bg-sun/20 text-ink/70"
      }`}
      title={`${formatKstMonthDay(new Date(status.resetsAt))} 초기화`}
    >
      {status.enforced ? `이번 달 ${left}회 남음` : `이번 달 ${status.monthlyUsed}/${status.monthlyLimit}회 · 베타 무제한`}
    </span>
  );
}
