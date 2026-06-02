"use client";

import { useState } from "react";

type Props = {
  // DRAFT 상태 테스트가 있을 때: 배포 안내
  // PUBLISHED 상태가 있지만 응시자 0: 공유 안내
  kind: "deploy" | "share";
  shareToken?: string;
};

// 테스트 목록 위에 한 번씩 보여주는 상황별 다음 단계 힌트 배너.
// localStorage로 dismiss 상태 유지 — 한 번 닫으면 해당 kind는 다시 안 뜸.
export function NextStepBanner({ kind, shareToken }: Props) {
  const storageKey = `onboarding_dismissed_${kind}`;

  // SSR-safe: 서버에서는 항상 null, 클라이언트에서 localStorage 확인
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "1";
  });

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setDismissed(true);
  }

  function handleCopy() {
    if (!shareToken) return;
    const url = `${window.location.origin}/play`;
    navigator.clipboard.writeText(`시험 코드: ${shareToken}\n응시 주소: ${url}`).then(() => {
      alert(`클립보드에 복사됐어요!\n\n시험 코드: ${shareToken}\n응시 주소: ${url}`);
    });
  }

  if (dismissed) return null;

  if (kind === "deploy") {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border-2 border-brand/30 bg-brand/5 px-5 py-4">
        <span className="mt-0.5 text-xl shrink-0">💡</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-brand">이제 배포해 보세요!</p>
          <p className="mt-0.5 text-sm text-ink/60">
            저장된 테스트를 <strong>배포</strong>하면 학생이 응시할 수 있어요.
            각 테스트 카드의 <strong>&ldquo;배포하기&rdquo;</strong> 버튼을 누르세요.
          </p>
        </div>
        <button onClick={dismiss} className="shrink-0 text-ink/30 hover:text-ink transition text-lg leading-none" aria-label="닫기">×</button>
      </div>
    );
  }

  if (kind === "share") {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border-2 border-sun/50 bg-sun/10 px-5 py-4">
        <span className="mt-0.5 text-xl shrink-0">🔗</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-ink">학생에게 코드를 공유하세요</p>
          <p className="mt-0.5 text-sm text-ink/60">
            배포된 테스트의 <strong>&ldquo;공유&rdquo;</strong> 버튼을 누르면 시험 코드와 응시 주소가 클립보드에 복사돼요.
            카톡·알림장으로 전달하면 학생이 바로 응시할 수 있습니다.
          </p>
          {shareToken && (
            <button
              onClick={handleCopy}
              className="mt-2 card bg-sun/30 px-4 py-1.5 text-xs font-bold transition hover:-translate-y-0.5"
            >
              코드 복사하기
            </button>
          )}
        </div>
        <button onClick={dismiss} className="shrink-0 text-ink/30 hover:text-ink transition text-lg leading-none" aria-label="닫기">×</button>
      </div>
    );
  }

  return null;
}
