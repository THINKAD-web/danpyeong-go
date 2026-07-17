"use client";

import { useState } from "react";
import { copyToClipboard, playEntryUrl } from "@/lib/play-share";

type Props = {
  // DRAFT 상태 테스트가 있을 때: 배포 안내
  // PUBLISHED 상태가 있지만 응시자 0: 공유 안내
  kind: "deploy" | "share";
  shareToken?: string;
};

type CopiedKind = "code" | "link" | null;

// 테스트 목록 위에 한 번씩 보여주는 상황별 다음 단계 힌트 배너.
// localStorage로 dismiss 상태 유지 — 한 번 닫으면 해당 kind는 다시 안 뜸.
export function NextStepBanner({ kind, shareToken }: Props) {
  const storageKey = `onboarding_dismissed_${kind}`;

  // SSR-safe: 서버에서는 항상 null, 클라이언트에서 localStorage 확인
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "1";
  });
  const [copied, setCopied] = useState<CopiedKind>(null);

  function dismiss() {
    localStorage.setItem(storageKey, "1");
    setDismissed(true);
  }

  function flashCopied(kind: CopiedKind) {
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleCopyCode() {
    if (!shareToken) return;
    await copyToClipboard(shareToken);
    flashCopied("code");
  }

  async function handleCopyLink() {
    await copyToClipboard(playEntryUrl(window.location.origin));
    flashCopied("link");
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
            <strong>코드만 복사</strong>로 시험 코드를, <strong>링크 복사</strong>로 응시 주소(/play)를
            각각 복사할 수 있어요. 카톡·알림장으로 전달하면 학생이 바로 응시할 수 있습니다.
          </p>
          {shareToken && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-ink/50">
                코드: <span className="font-bold tracking-wider text-ink/70">{shareToken}</span>
              </p>
              <button
                type="button"
                onClick={handleCopyCode}
                className="card bg-sun/30 px-4 py-1.5 text-xs font-bold transition hover:-translate-y-0.5"
              >
                {copied === "code" ? "✓ 복사됨" : "코드만 복사"}
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="card bg-white px-4 py-1.5 text-xs font-bold transition hover:-translate-y-0.5"
              >
                {copied === "link" ? "✓ 복사됨" : "링크 복사"}
              </button>
            </div>
          )}
        </div>
        <button onClick={dismiss} className="shrink-0 text-ink/30 hover:text-ink transition text-lg leading-none" aria-label="닫기">×</button>
      </div>
    );
  }

  return null;
}
