"use client";

import Link from "next/link";
import { formatKstMonthDay } from "@/lib/kst";

// 월간 생성 한도(402 PLAN_LIMIT) 도달 시 — 계속 무료로 되는 것을 먼저 알리고 프로를 안내한다
export function UpgradeModal({
  used,
  limit,
  resetsAt,
  onClose,
}: {
  used: number;
  limit: number;
  resetsAt: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 id="upgrade-title" className="font-display text-2xl font-bold">
          이번 달 무료 생성 {used}/{limit}회를 모두 썼어요
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          {formatKstMonthDay(new Date(resetsAt))}에 다시 {limit}회가 채워져요.
        </p>
        <ul className="mt-4 space-y-1.5 rounded-xl bg-mint/10 p-4 text-sm">
          <li>✅ 직접 문항 추가해서 평가 만들기</li>
          <li>✅ 만든 평가 배포·자동 채점·리포트</li>
          <li>✅ PDF·Excel 내보내기</li>
          <li className="pt-1 text-xs text-ink/50">위 기능은 무료 플랜에서도 계속 쓸 수 있어요.</li>
        </ul>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/pricing"
            className="card flex-1 bg-brand px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            프로로 무제한 생성 →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="card flex-1 bg-white px-4 py-3 text-sm font-bold transition hover:-translate-y-0.5"
          >
            직접 작성할게요
          </button>
        </div>
      </div>
    </div>
  );
}
