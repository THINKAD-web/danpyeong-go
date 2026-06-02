"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function TeacherError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TeacherError]", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="font-display text-5xl font-bold text-coral">앗!</div>
      <h1 className="font-display mt-4 text-2xl font-bold text-ink">
        페이지를 불러오지 못했어요
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        잠시 후 다시 시도하거나, 대시보드로 돌아가세요.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
        <button
          onClick={reset}
          className="card bg-brand px-6 py-3 font-bold text-white transition hover:-translate-y-0.5"
        >
          다시 시도
        </button>
        <Link
          href="/teacher"
          className="card px-6 py-3 font-bold text-ink transition hover:-translate-y-0.5"
        >
          ← 대시보드
        </Link>
      </div>
    </main>
  );
}
