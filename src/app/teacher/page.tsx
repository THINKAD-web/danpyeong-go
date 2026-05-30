import Link from "next/link";
import { currentTeacher } from "@/lib/auth";
import { MOCK_TESTS } from "@/lib/mock-data";

const statusLabel: Record<string, { text: string; cls: string }> = {
  PUBLISHED: { text: "진행 중", cls: "bg-mint/20 text-green-700 border-green-700" },
  CLOSED: { text: "마감", cls: "bg-ink/10 text-ink border-ink" },
  DRAFT: { text: "작성 중", cls: "bg-sun/30 text-yellow-800 border-yellow-700" },
};

export default function TeacherDashboard() {
  const teacher = currentTeacher();
  const published = MOCK_TESTS.filter((t) => t.status === "PUBLISHED").length;
  const totalAttempts = MOCK_TESTS.reduce((s, t) => s + t.attemptCount, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="mb-10 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold text-brandink">
          단평<span className="text-coral">GO</span>
        </Link>
        <span className="text-sm text-ink/60">
          {teacher.name} 선생님 · <span className="text-ink/40">데모 계정</span>
        </span>
      </nav>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold">내 단원평가</h1>
        <Link
          href="/teacher/test/new"
          className="card bg-brand px-5 py-3 font-bold text-white transition hover:-translate-y-1"
        >
          + AI로 새로 만들기
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="전체 평가" value={`${MOCK_TESTS.length}개`} />
        <Stat label="진행 중" value={`${published}개`} />
        <Stat label="총 응시" value={`${totalAttempts}회`} />
      </div>

      {/* 테스트 목록 */}
      <div className="mt-8 space-y-4">
        {MOCK_TESTS.map((t) => {
          const s = statusLabel[t.status];
          return (
            <div
              key={t.id}
              className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{t.title}</h3>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-bold ${s.cls}`}
                  >
                    {s.text}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/60">
                  문항 {t.questionCount}개 · 응시 {t.attemptCount}명
                  {t.avgScore !== null && ` · 평균 ${t.avgScore}점`}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="card bg-white px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5">
                  결과 보기
                </button>
                <button className="card bg-sun/40 px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5">
                  공유
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-ink/60">{label}</div>
      <div className="font-display mt-1 text-3xl font-bold text-brand">{value}</div>
    </div>
  );
}
