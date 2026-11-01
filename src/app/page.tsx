import Link from "next/link";
import {
  IconBook,
  IconChart,
  IconCheck,
  IconDevice,
  IconFile,
  IconLink,
  IconList,
  IconLock,
  IconShield,
  IconSpark,
  IconUsers,
} from "@/components/icons";
import { PickPreview, ReportPreview, SharePreview } from "@/components/ProductPreviews";

const FEATURES = [
  {
    icon: IconShield,
    title: "모든 문항 사람이 검수 + 오류 신고 즉시 반영",
    desc: "문제은행 문항은 사람이 검수한 뒤 제공합니다. 오류가 보이면 신고해 주세요. 바로 반영합니다.",
  },
  {
    icon: IconBook,
    title: "2022 개정 교육과정 기준",
    desc: "초등 3학년 수학 전 단원 문항을 성취기준에 맞춰 준비했습니다. 4학년은 순차 오픈 예정입니다.",
  },
  {
    icon: IconUsers,
    title: "학생 로그인 불필요",
    desc: "학생은 시험 코드와 이름(또는 출석번호)만 입력하면 바로 응시합니다. 계정 만들 필요가 없습니다.",
  },
  {
    icon: IconChart,
    title: "즉시 채점·분석 리포트",
    desc: "제출 즉시 문항별 정답률, 취약 문항 하이라이트. PDF·Excel 내보내기를 지원합니다.",
  },
  {
    icon: IconList,
    title: "단원 전체 또는 직접 선택",
    desc: "단원 전체를 담거나, 원하는 문항만 골라 시험지를 완성할 수 있습니다.",
  },
  {
    icon: IconDevice,
    title: "태블릿·폰 응시 최적화",
    desc: "학생은 PC 없이 태블릿이나 스마트폰으로 응시할 수 있습니다.",
  },
];

const STEPS = [
  {
    step: "1",
    icon: IconList,
    title: "문항 고르기 (단원 전체 / 직접 선택)",
    desc: "검수된 문제은행에서 단원을 고르거나, 필요한 문항만 직접 선택해 시험지를 만듭니다.",
    detail: "보통 3분 이내",
  },
  {
    step: "2",
    icon: IconLink,
    title: "링크·코드로 배포",
    desc: "테스트를 저장하면 공유 링크와 코드가 생성됩니다. 학생에게 카톡·알림장으로 전달하면 끝입니다.",
    detail: "학생은 로그인 없이 응시",
  },
  {
    step: "3",
    icon: IconChart,
    title: "자동 채점·분석",
    desc: "학생이 제출하면 즉시 채점됩니다. 문항별 정답률, 학생별 점수를 한눈에 확인하고 리포트를 내보내세요.",
    detail: "PDF·Excel 다운로드",
  },
];

const STEP_PREVIEWS = [PickPreview, SharePreview, ReportPreview];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── 네비게이션 ── */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-6">
        <div className="font-display text-2xl font-bold tracking-tight text-brandink sm:text-3xl">
          단평<span className="text-brand">GO</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/play"
            className="px-2 py-2 text-sm font-bold text-ink/60 transition hover:text-ink sm:px-3"
          >
            학생 응시
          </Link>
          <Link href="/teacher" className="btn-primary !min-h-11 !px-4 !py-2 !text-sm !shadow-none">
            교사 시작
          </Link>
        </div>
      </header>

      {/* ── 히어로 (한 화면·한 구성) ── */}
      <section className="relative mx-auto max-w-5xl overflow-hidden px-5 pb-16 pt-10 text-center sm:px-6 sm:pb-20 sm:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-sm font-bold text-brand">
          초등 3학년 수학 (4학년 순차 오픈)
        </p>

        <h1 className="font-display mt-6 text-[2.35rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-5xl md:text-6xl">
          단평<span className="text-brand">GO</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-2xl font-bold leading-snug text-ink sm:text-3xl md:text-4xl">
          3분이면 단원평가 완성,{" "}
          <span className="scribble-underline text-brand">무료 베타</span>
        </p>

        <p className="mx-auto mt-5 max-w-xl text-base text-ink/70 sm:text-lg">
          검수된 3학년 수학 전 단원 문항에서 골라 바로 시험지 완성
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/teacher" className="btn-primary">
            무료로 시험지 만들기
          </Link>
          <Link href="/design/play" className="btn-secondary">
            <IconFile size={18} />
            샘플 시험지 보기
          </Link>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-sm text-ink/45">
          <IconLock size={14} className="shrink-0" />
          학생 이름은 서버에 저장하지 않습니다
        </p>
      </section>

      {/* ── 3단계 흐름 ── */}
      <section className="border-y border-ink/8 bg-white/70 py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            이렇게 쓰면 됩니다
          </h2>
          <p className="mt-3 text-center text-base text-ink/60">
            검수된 문제은행으로 고르고, 배포하고, 바로 채점합니다.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => {
              const Preview = STEP_PREVIEWS[i];
              const StepIcon = s.icon;
              return (
                <div key={s.step} className="card flex flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-white shrink-0">
                      {s.step}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/8 text-brand">
                      <StepIcon size={20} />
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold leading-snug">{s.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-ink/70">{s.desc}</p>
                  <p className="mt-3 border-t border-ink/8 pt-3 text-xs font-bold text-brand/80">
                    {s.detail}
                  </p>
                  <div className="mt-4 flex-1">
                    <Preview />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 특징 ── */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          왜 단평GO인가요?
        </h2>
        <p className="mt-3 text-center text-base text-ink/60">
          교실에서 바로 쓸 수 있는 것만 담았습니다.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card flex gap-4 p-5">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/8 text-brand">
                  <Icon size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold leading-snug">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60 sm:text-base">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 하단 CTA ── */}
      <section className="border-t border-ink/8 bg-brand py-16 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          지금 바로 첫 단원평가를 만들어 보세요
        </h2>
        <p className="mt-3 text-base text-white/80">무료 베타 · 가입 즉시 사용 · 별도 설치 없음</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/teacher"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-white px-8 py-3.5 text-lg font-bold text-brand transition hover:-translate-y-0.5"
          >
            교사로 시작하기
          </Link>
          <Link
            href="/design/teacher"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-white/50 px-8 py-3.5 text-lg font-bold text-white transition hover:-translate-y-0.5"
          >
            시안 미리보기
          </Link>
        </div>
        <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/90">
          <IconSpark size={14} />
          AI 문항 생성 — 곧 오픈
        </p>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-ink/8 py-10 text-center text-sm text-ink/45">
        <p className="font-display text-lg font-bold text-brandink">
          단평<span className="text-brand">GO</span>
        </p>
        <p className="mt-1 text-base">검수된 문제은행으로 만드는 초등 단원평가</p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-ink/50">
          <IconCheck size={14} />
          학생 이름은 서버에 저장하지 않습니다
        </p>
        <p className="mt-4">
          <Link href="/privacy" className="font-bold text-ink/60 hover:text-brand">
            개인정보처리방침
          </Link>
          <span className="mx-2 text-ink/20">·</span>
          <Link href="/design" className="font-bold text-ink/60 hover:text-brand">
            디자인 시안
          </Link>
        </p>
      </footer>
    </div>
  );
}
