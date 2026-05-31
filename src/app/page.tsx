import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div className="font-display text-3xl font-bold text-brandink">
          단평<span className="text-coral">GO</span>
        </div>
        <span className="rounded-full border-2 border-ink bg-sun/30 px-3 py-1 text-sm font-bold">
          MVP · 3학년 수학
        </span>
      </header>

      {/* 히어로 */}
      <section className="mt-20 text-center">
        <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
          초등 단원평가,
          <br />
          <span className="scribble-underline">AI로 5분 컷!</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink/70">
          단원만 고르면 AI가 객관식·단답형 문항을 뚝딱 만들어요.
          만들고, 배포하고, 자동 채점하고, 분석까지 한 번에.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/teacher"
            className="card inline-block bg-brand px-8 py-4 text-lg font-bold text-white transition hover:-translate-y-1"
          >
            🏫 교사로 시작하기
          </Link>
          <Link
            href="/play"
            className="card inline-block bg-white px-8 py-4 text-lg font-bold transition hover:-translate-y-1"
          >
            ✏️ 학생 — 코드로 응시
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink/40">
          * 교사 로그인 후 이용 가능합니다. 학생은 코드 입력만으로 응시할 수 있어요.
        </p>
      </section>

      {/* 3단계 흐름 */}
      <section className="mt-24 grid gap-6 md:grid-cols-3">
        {[
          {
            step: "1",
            title: "AI로 문항 생성",
            desc: "단원·난이도·문항 수만 고르면 끝. 생성 후 바로 수정·검수.",
          },
          {
            step: "2",
            title: "코드로 배포",
            desc: "클래스 코드 또는 링크 공유. 학생은 로그인 없이 응시.",
          },
          {
            step: "3",
            title: "자동 채점·분석",
            desc: "문제별 정답률, 약점 단원 하이라이트, PDF·Excel 리포트.",
          },
        ].map((c) => (
          <div key={c.step} className="card p-6">
            <div className="font-display text-4xl font-bold text-brand">
              {c.step}
            </div>
            <h3 className="mt-2 text-xl font-bold">{c.title}</h3>
            <p className="mt-2 text-ink/70">{c.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
