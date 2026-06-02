"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "DRAFT" | "PUBLISHED" | "CLOSED";

export function TestActions({
  testId,
  status,
  shareToken,
}: {
  testId: string;
  status: Status;
  shareToken: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  function handleShare() {
    const url = `${window.location.origin}/play`;
    navigator.clipboard.writeText(`시험 코드: ${shareToken}\n응시: ${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap gap-2">
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
          <>
            <button
              onClick={handleShare}
              className="card bg-sun/40 px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
            >
              {copied ? "✓ 복사됨" : "공유"}
            </button>
            <button
              onClick={() => changeStatus("CLOSED")}
              disabled={loading}
              className="card bg-ink/10 px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              마감
            </button>
          </>
        )}
        {status === "CLOSED" && (
          <span className="px-4 py-2 text-sm text-ink/40">마감됨</span>
        )}
      </div>
      {/* 배포 중인 테스트에 코드를 항상 노출 — 카톡/알림장 공유 시 참고 */}
      {status === "PUBLISHED" && (
        <p className="text-xs text-ink/40 text-right">
          코드: <span className="font-bold tracking-wider text-ink/60">{shareToken}</span>
        </p>
      )}
    </div>
  );
}
