"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="font-display text-6xl font-bold text-coral select-none">앗!</div>
      <h1 className="font-display mt-4 text-2xl font-bold text-ink">
        예상치 못한 오류가 발생했어요
      </h1>
      <p className="mt-3 text-ink/60 max-w-sm text-sm">
        일시적인 오류일 수 있어요. 아래 버튼을 눌러 다시 시도해 보세요.
        <br />
        문제가 계속되면 선생님께 알려주세요.
      </p>

      <div className="my-8 w-48 border-t-2 border-dashed border-ink/20" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="card bg-brand px-6 py-3 font-bold text-white transition hover:-translate-y-0.5"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="card px-6 py-3 font-bold text-ink transition hover:-translate-y-0.5"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
