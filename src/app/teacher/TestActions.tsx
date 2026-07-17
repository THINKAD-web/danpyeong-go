"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { copyToClipboard, playEntryUrl } from "@/lib/play-share";

type Status = "DRAFT" | "PUBLISHED" | "CLOSED";
type CopiedKind = "code" | "link" | null;

export function TestActions({
  testId,
  status,
  shareToken,
  title,
  attemptCount,
}: {
  testId: string;
  status: Status;
  shareToken: string;
  title: string;
  attemptCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<CopiedKind>(null);
  const [deleting, setDeleting] = useState(false);

  async function changeStatus(next: Status) {
    setLoading(true);
    try {
      await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function flashCopied(kind: CopiedKind) {
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleCopyCode() {
    await copyToClipboard(shareToken);
    flashCopied("code");
  }

  async function handleCopyLink() {
    await copyToClipboard(playEntryUrl(window.location.origin));
    flashCopied("link");
  }

  async function handleDelete() {
    const attemptNotice =
      attemptCount > 0
        ? `\n\n응시 기록 ${attemptCount}건이 함께 삭제되며 복구할 수 없습니다.`
        : "\n\n이 작업은 복구할 수 없습니다.";
    const confirmed = confirm(`"${title}" 평가를 삭제할까요?${attemptNotice}`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/teacher/tests/${testId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "삭제 중 오류가 발생했어요.");
        return;
      }
      alert(`"${title}" 평가가 삭제됐어요. (응시 기록 ${data.deletedAttemptCount ?? 0}건 포함)`);
      router.refresh();
    } catch {
      alert("삭제 중 오류가 발생했어요.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap gap-2 justify-end">
        <Link
          href={`/teacher/test/${testId}/results`}
          className="card bg-white px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
        >
          결과 보기
        </Link>
        {status === "DRAFT" && (
          <button
            onClick={() => changeStatus("PUBLISHED")}
            disabled={loading}
            className="card bg-brand px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            배포하기
          </button>
        )}
        {status === "PUBLISHED" && (
          <button
            onClick={() => changeStatus("CLOSED")}
            disabled={loading}
            className="card bg-ink/10 px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            마감
          </button>
        )}
        {status === "CLOSED" && (
          <span className="px-4 py-2 text-sm text-ink/40">마감됨</span>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="card bg-white px-4 py-2 text-sm font-bold text-coral transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {deleting ? "삭제 중…" : "삭제"}
        </button>
      </div>
      {/* 배포 중: 코드 상시 노출 + 코드/링크 단독 복사 */}
      {status === "PUBLISHED" && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="text-xs text-ink/40">
            코드: <span className="font-bold tracking-wider text-ink/60">{shareToken}</span>
          </p>
          <button
            type="button"
            onClick={handleCopyCode}
            className="card bg-sun/40 px-3 py-1 text-xs font-bold transition hover:-translate-y-0.5"
          >
            {copied === "code" ? "✓ 복사됨" : "코드만 복사"}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="card bg-white px-3 py-1 text-xs font-bold transition hover:-translate-y-0.5"
          >
            {copied === "link" ? "✓ 복사됨" : "링크 복사"}
          </button>
        </div>
      )}
    </div>
  );
}
