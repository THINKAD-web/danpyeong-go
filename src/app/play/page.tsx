"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { STUDENT_NUMBER_REQUIRED } from "@/lib/student-id";

export default function PlayEntryPage() {
  const router = useRouter();
  const [shareToken, setShareToken] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 선생님이 "출석번호만" 모드로 배포한 평가면 서버 응답을 받고 번호 입력으로 전환
  const [numberMode, setNumberMode] = useState(false);

  async function handleStart() {
    if (!shareToken.trim() || !studentName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/play/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToken: shareToken.trim(), studentName: studentName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === STUDENT_NUMBER_REQUIRED && !numberMode) {
          setNumberMode(true);
          setStudentName("");
          setError("이 평가는 이름 대신 출석번호만 입력해요.");
          return;
        }
        setError(data.error ?? "오류가 발생했습니다.");
        return;
      }
      router.push(`/play/${data.attemptId}`);
    } catch {
      setError("연결에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // min-h-[100dvh]: dynamic viewport — iOS Safari 주소창 포함 계산 방지
    // pb-safe: 홈 인디케이터 영역 침범 방지
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-8 safe-bottom">
      <Link href="/" className="font-display mb-8 text-3xl font-bold text-brandink">
        단평<span className="text-coral">GO</span>
      </Link>

      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">테스트 응시하기</h1>
        <p className="mt-1 text-sm text-ink/60">
          6자리 코드 또는 공유 링크의 코드를 입력하세요.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="share-token" className="mb-1 block text-sm font-bold text-ink/70">
              시험 코드
            </label>
            <input
              id="share-token"
              value={shareToken}
              onChange={(e) => setShareToken(e.target.value)}
              placeholder="예: 482931"
              // autocomplete off: 코드칸에 이전 이름 제안 방지
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              className="w-full rounded-xl border-2 border-ink px-4 py-3.5 text-lg font-bold tracking-widest focus:outline-none focus:border-brand"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>
          <div>
            <label htmlFor="student-name" className="mb-1 block text-sm font-bold text-ink/70">
              {numberMode ? "출석번호" : "이름"}
            </label>
            <input
              id="student-name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={numberMode ? "예: 12" : "홍길동"}
              maxLength={numberMode ? 3 : 20}
              autoComplete={numberMode ? "off" : "name"}
              inputMode={numberMode ? "numeric" : "text"}
              className="w-full rounded-xl border-2 border-ink px-4 py-3.5 text-lg font-bold focus:outline-none focus:border-brand"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>

          {error && <p className="text-sm font-bold text-coral">{error}</p>}

          {/* min-h-[52px]: 터치 영역 44px+ 보장 */}
          <button
            onClick={handleStart}
            disabled={loading || !shareToken.trim() || !studentName.trim()}
            className="card w-full min-h-[52px] bg-coral text-lg font-bold text-white transition active:translate-y-0.5 disabled:opacity-40"
          >
            {loading ? "확인 중…" : "시작하기 →"}
          </button>
        </div>
      </div>
    </main>
  );
}
