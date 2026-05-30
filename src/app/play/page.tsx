"use client";

import Link from "next/link";
import { useState } from "react";

export default function PlayEntry() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="card w-full p-8">
          <div className="text-5xl">🎉</div>
          <h1 className="font-display mt-4 text-2xl font-bold">
            {name} 학생, 준비됐어요!
          </h1>
          <p className="mt-2 text-ink/60">
            여기에 테스트 플레이어가 들어갑니다.
            <br />
            (Phase 2 — 태블릿 최적화 + PWA)
          </p>
          <button
            onClick={() => setStarted(false)}
            className="card mt-6 bg-white px-5 py-2 font-bold"
          >
            ← 뒤로
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <Link href="/" className="font-display mb-8 text-3xl font-bold text-brandink">
        단평<span className="text-coral">GO</span>
      </Link>

      <div className="card w-full p-8">
        <h1 className="font-display text-2xl font-bold">테스트 응시하기</h1>
        <p className="mt-1 text-sm text-ink/60">
          선생님이 알려준 코드와 이름을 입력하세요. 로그인은 필요 없어요!
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-ink/70">
              클래스 코드
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: X7K2"
              className="w-full rounded-xl border-2 border-ink px-4 py-3 text-center text-2xl font-bold tracking-widest"
              maxLength={6}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-ink/70">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full rounded-xl border-2 border-ink px-4 py-3 text-lg font-bold"
            />
          </div>
          <button
            onClick={() => code && name && setStarted(true)}
            disabled={!code || !name}
            className="card w-full bg-coral py-4 text-lg font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            시작하기 →
          </button>
        </div>
      </div>
    </main>
  );
}
