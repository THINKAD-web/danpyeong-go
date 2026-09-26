"use client";

import { useState } from "react";
import { PRICES, yearlySavings } from "@/lib/plans";

// 프로 카드 월간/연간 토글 (연간은 1회 결제·수동 갱신 — 자동 갱신 없음)
export function ProPrice() {
  const [yearly, setYearly] = useState(false);
  const save = yearlySavings();
  return (
    <div>
      <div className="inline-flex rounded-full border-2 border-ink p-0.5 text-xs font-bold" role="group" aria-label="결제 주기">
        {[
          [false, "월간"],
          [true, "연간"],
        ].map(([v, label]) => (
          <button
            key={String(label)}
            type="button"
            aria-pressed={yearly === v}
            onClick={() => setYearly(v as boolean)}
            className={`rounded-full px-3 py-1 transition ${yearly === v ? "bg-ink text-white" : "text-ink/60"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 font-display text-4xl font-bold">
        {(yearly ? PRICES.PRO_YEARLY : PRICES.PRO_MONTHLY).toLocaleString("ko-KR")}원
        <span className="ml-1 text-base font-normal text-ink/50">/ {yearly ? "년" : "월"}</span>
      </p>
      <p className="mt-1 h-5 text-xs font-bold text-green-700">
        {yearly ? `월 결제보다 ${save.months}개월 절약 (${save.percent}% 할인) · 1회 결제, 자동 갱신 없음` : "매월 자동 결제 · 언제든 해지"}
      </p>
    </div>
  );
}
