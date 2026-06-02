import Link from "next/link";

// ── 차별점 데이터 ─────────────────────────────────────────
const FEATURES = [
  {
    icon: "📐",
    title: "2022 개정 교육과정 기준",
    desc: "3학년 수학 12개 단원, 성취기준에 맞춰 문항이 생성됩니다.",
  },
  {
    icon: "🔍",
    title: "AI 자기검산 탑재",
    desc: "생성 후 AI가 정답을 직접 다시 풀어 오류를 걸러냅니다. 나눗셈 나머지 오류도 자동 차단.",
  },
  {
    icon: "👤",
    title: "학생 로그인 불필요",
    desc: "학생은 시험 코드와 이름만 입력하면 바로 응시. 계정 만들 필요 없습니다.",
  },
  {
    icon: "📊",
    title: "즉시 채점·분석 리포트",
    desc: "제출 즉시 문항별 정답률, 취약 문항 하이라이트. PDF·Excel 내보내기 지원.",
  },
  {
    icon: "✏️",
    title: "생성 후 직접 편집 가능",
    desc: "AI 초안을 그대로 쓰거나, 문항 삭제·수정 후 저장. 교사가 최종 검수합니다.",
  },
  {
    icon: "📱",
    title: "태블릿·폰 응시 최적화",
    desc: "학생은 PC 없이 태블릿이나 스마트폰으로 응시할 수 있습니다.",
  },
];

const STEPS = [
  {
    step: "1",
    emoji: "✨",
    title: "AI로 문항 생성",
    desc: "단원·난이도·문항 수를 고르면 AI가 객관식·단답형 초안을 만들어요. 생성 후 수정·삭제도 자유롭습니다.",
    detail: "보통 30초~2분 소요",
  },
  {
    step: "2",
    emoji: "🔗",
    title: "링크·코드로 배포",
    desc: "테스트를 저장하면 공유 링크와 코드가 생성돼요. 학생에게 카톡·알림장으로 전달하면 끝.",
    detail: "학생은 로그인 없이 응시",
  },
  {
    step: "3",
    emoji: "📊",
    title: "자동 채점·분석",
    desc: "학생이 제출하면 즉시 채점됩니다. 문항별 정답률, 학생별 점수를 한눈에 확인하고 리포트를 내보내세요.",
    detail: "PDF·Excel 다운로드",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* ── 네비게이션 ── */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="font-display text-2xl font-bold text-brandink">
          단평<span className="text-coral">GO</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/play"
            className="text-sm font-bold text-ink/60 hover:text-ink transition"
          >
            학생 응시
          </Link>
          <Link
            href="/teacher"
            className="card bg-brand px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            교사 로그인
          </Link>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-12 text-center sm:pt-20">
        {/* 배지 */}
        <span className="inline-block rounded-full border-2 border-brand/30 bg-brand/5 px-4 py-1 text-sm font-bold text-brand">
          초등학교 3학년 수학 · 2022 개정 교육과정
        </span>

        <h1 className="font-display mt-6 text-5xl font-bold leading-tight sm:text-6xl md:text-7xl">
          초등 단원평가,
          <br />
          <span className="scribble-underline">AI로 5분 컷!</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink/70 sm:text-xl">
          단원만 고르면 AI가 문항을 만들고, 학생은 코드로 응시하고, 결과는 즉시 분석돼요.
          <br className="hidden sm:block" />
          <span className="font-bold text-ink">출제부터 분석까지 — 교사 혼자서 5분.</span>
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/teacher"
            className="card bg-brand px-8 py-4 text-lg font-bold text-white transition hover:-translate-y-1 active:translate-y-0"
          >
            👩‍🏫 교사로 시작하기 — 무료
          </Link>
          <Link
            href="/play"
            className="card bg-white px-8 py-4 text-lg font-bold transition hover:-translate-y-1 active:translate-y-0"
          >
            ✏️ 학생 — 코드로 응시
          </Link>
        </div>

        <p className="mt-4 text-sm text-ink/40">
          교사는 Clerk 소셜 로그인으로 시작 · 학생은 코드+이름만으로 응시
        </p>
      </section>

      {/* ── 3단계 흐름 ── */}
      <section className="bg-white/60 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-center text-3xl font-bold sm:text-4xl">
            이렇게 쓰면 돼요
          </h2>
          <p className="mt-3 text-center text-ink/60">처음 쓰는 선생님도 5분이면 첫 평가를 만들 수 있어요.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="card p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-white shrink-0">
                    {s.step}
                  </span>
                  <span className="text-2xl">{s.emoji}</span>
                </div>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-ink/70 leading-relaxed">{s.desc}</p>
                <p className="mt-3 text-xs font-bold text-brand/70 border-t border-ink/10 pt-3">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 차별점 6개 ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-center text-3xl font-bold sm:text-4xl">
          왜 단평GO인가요?
        </h2>
        <p className="mt-3 text-center text-ink/60">
          실제로 작동하는 것만 적었어요.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5 flex gap-4">
              <span className="text-3xl shrink-0 mt-0.5">{f.icon}</span>
              <div>
                <h3 className="font-bold text-base">{f.title}</h3>
                <p className="mt-1 text-sm text-ink/60 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section className="border-t-2 border-ink/10 bg-brand py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
          지금 바로 첫 단원평가를 만들어보세요
        </h2>
        <p className="mt-3 text-white/80">
          무료 · 가입 즉시 사용 · 별도 설치 없음
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/teacher"
            className="card bg-white px-8 py-4 text-lg font-bold text-brand transition hover:-translate-y-1"
          >
            👩‍🏫 교사로 시작하기
          </Link>
          <Link
            href="/play"
            className="rounded-xl border-2 border-white/50 px-8 py-4 text-lg font-bold text-white transition hover:-translate-y-1"
          >
            ✏️ 학생 응시하기
          </Link>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-ink/10 py-8 text-center text-sm text-ink/40">
        <p className="font-display text-base font-bold text-brandink">
          단평<span className="text-coral">GO</span>
        </p>
        <p className="mt-1">초등 교사를 위한 AI 단원평가 도구</p>
      </footer>
    </div>
  );
}
