import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getLimits } from "@/lib/ai-rate-limit";
import { effectivePlan, FREE_MONTHLY_GENERATIONS, type PlanId } from "@/lib/plans";
import { ProPrice } from "./ProPrice";

export const metadata: Metadata = {
  title: "요금제 — 단평GO",
  description: "단평GO 무료·프로·학교 라이선스 요금제 비교. 평가 배포·자동 채점·기본 리포트는 모든 요금제에서 무료입니다.",
};

const CONTACT = "mailto:mannote@tkad.co.kr?subject=%5B%EB%8B%A8%ED%8F%89GO%5D%20%ED%95%99%EA%B5%90%20%EB%8F%84%EC%9E%85%20%EB%AC%B8%EC%9D%98";

// 로그인한 교사면 현재 요금제 — 비로그인·오류 시 null (페이지는 공개)
async function currentPlan(): Promise<PlanId | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { plan: true, planExpiresAt: true },
    });
    return user ? effectivePlan(user.plan, user.planExpiresAt) : "FREE";
  } catch {
    return null;
  }
}

type Cell = string | boolean;
const SOON = "출시 예정";

export default async function PricingPage() {
  const plan = await currentPlan();
  const fairUse = getLimits().perUser;

  const rows: { label: string; free: Cell; pro: Cell; school: Cell }[] = [
    { label: "AI 문항 생성", free: `월 ${FREE_MONTHLY_GENERATIONS}회`, pro: "무제한*", school: "무제한*" },
    { label: "평가 저장·배포·자동 채점", free: true, pro: true, school: true },
    { label: "기본 리포트 (문항별 정답률·취약 문항)", free: true, pro: true, school: true },
    { label: "PDF·Excel 내보내기", free: "기본", pro: `커스텀 (${SOON})`, school: `커스텀 (${SOON})` },
    { label: "오답 기반 보충 문항", free: false, pro: SOON, school: SOON },
    { label: "누적 성장 리포트", free: false, pro: SOON, school: SOON },
    { label: "동학년 평가 공유", free: `받기 (${SOON})`, pro: `보내기+받기 (${SOON})`, school: `전체 (${SOON})` },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="mb-10 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold text-brandink">
          단평<span className="text-coral">GO</span>
        </Link>
        <Link href="/teacher" className="text-sm font-bold text-brand hover:underline">
          {plan ? "대시보드 →" : "교사 로그인 →"}
        </Link>
      </nav>

      <header className="text-center">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">요금제</h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/60">
          평가 저장·배포·자동 채점·기본 리포트는 <b className="text-ink">모든 요금제에서 무료</b>예요.
          프로는 AI 생성을 무제한으로 쓰고, 프로 전용 기능을 함께 쓰는 요금제입니다.
        </p>
        <p className="mt-3 inline-block rounded-full border-2 border-ink bg-mint/30 px-4 py-1 text-sm font-bold">
          🎉 오픈 베타 기간에는 모든 기능을 무료로 쓸 수 있어요 · 유료 플랜은 2027년 2월 오픈
        </p>
      </header>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {/* Free */}
        <div className="card flex flex-col p-6">
          <h2 className="text-lg font-bold">Free</h2>
          <p className="mt-3 font-display text-4xl font-bold">0원</p>
          <p className="mt-1 text-xs text-ink/50">교사 개인 · 카드 등록 없음</p>
          <ul className="mt-5 flex-1 space-y-1.5 text-sm text-ink/70">
            <li>✅ AI 문항 생성 월 {FREE_MONTHLY_GENERATIONS}회</li>
            <li>✅ 평가 저장·배포·채점 제한 없음</li>
            <li>✅ 기본 리포트·PDF·Excel</li>
          </ul>
          {plan === "FREE" ? (
            <p className="mt-6 rounded-xl border-2 border-ink/20 py-3 text-center text-sm font-bold text-ink/50">현재 플랜</p>
          ) : (
            <Link href="/teacher" className="card mt-6 bg-white py-3 text-center text-sm font-bold transition hover:-translate-y-0.5">
              무료로 시작하기
            </Link>
          )}
        </div>

        {/* Pro */}
        <div className="card relative flex flex-col border-brand p-6 ring-2 ring-brand">
          <span className="absolute -top-3 right-5 rounded-full border-2 border-ink bg-sun px-3 py-0.5 text-xs font-bold">추천</span>
          <h2 className="text-lg font-bold">Pro</h2>
          <div className="mt-3">
            <ProPrice />
          </div>
          <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink/70">
            <li>✅ AI 문항 생성 무제한*</li>
            <li>✅ Free의 모든 기능</li>
            <li>🕒 오답 기반 보충 문항 ({SOON})</li>
            <li>🕒 누적 성장 리포트 ({SOON})</li>
            <li>🕒 동학년 공유 보내기 ({SOON})</li>
          </ul>
          {plan === "PRO" ? (
            <p className="mt-6 rounded-xl border-2 border-brand/30 py-3 text-center text-sm font-bold text-brand">현재 플랜</p>
          ) : (
            <p className="mt-6 rounded-xl bg-brand/10 py-3 text-center text-sm font-bold text-brand">2027년 2월 결제 오픈</p>
          )}
        </div>

        {/* School */}
        <div className="card flex flex-col p-6">
          <h2 className="text-lg font-bold">학교 라이선스</h2>
          <p className="mt-3 font-display text-4xl font-bold">별도 협의</p>
          <p className="mt-1 text-xs text-ink/50">학년·학교 단위 연간 계약 · 세금계산서 발행</p>
          <ul className="mt-5 flex-1 space-y-1.5 text-sm text-ink/70">
            <li>✅ 소속 선생님 전원 Pro 기능</li>
            <li>✅ 학교 예산 집행 일정에 맞춘 연간 계약</li>
          </ul>
          {plan === "SCHOOL" ? (
            <p className="mt-6 rounded-xl border-2 border-ink/20 py-3 text-center text-sm font-bold text-ink/50">현재 플랜</p>
          ) : (
            <a href={CONTACT} className="card mt-6 bg-white py-3 text-center text-sm font-bold transition hover:-translate-y-0.5">
              도입 문의하기
            </a>
          )}
        </div>
      </section>

      <section className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b-2 border-ink py-2 text-left">기능</th>
              <th className="border-b-2 border-ink py-2">Free</th>
              <th className="border-b-2 border-ink py-2 text-brand">Pro</th>
              <th className="border-b-2 border-ink py-2">학교</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-ink/10">
                <td className="py-2.5 pr-3 font-bold text-ink/80">{r.label}</td>
                {[r.free, r.pro, r.school].map((c, i) => (
                  <td key={i} className="py-2.5 text-center text-ink/70">
                    {c === true ? "✅" : c === false ? "—" : c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink/40">
          * 공정 사용 범위 내 무제한 (서비스 안정을 위해 하루 {fairUse}회까지). 생성에 실패한 경우는 횟수에서 빠져요.
        </p>
      </section>

      <section className="mx-auto mt-14 max-w-3xl">
        <h2 className="font-display text-2xl font-bold">자주 묻는 질문</h2>
        <dl className="mt-4 space-y-4">
          {[
            ["베타 기간에 만든 평가는 어떻게 되나요?", "모든 기존 데이터는 유지됩니다. 유료 플랜이 열려도 지금까지 만든 평가·문항·응시 결과는 그대로 쓸 수 있어요."],
            ["무료 플랜에서 계속 쓸 수 있는 건 무엇인가요?", `평가 저장·배포·자동 채점·기본 리포트·PDF/Excel 내보내기, 직접 문항 작성은 개수 제한 없이 계속 무료예요. AI 문항 생성만 월 ${FREE_MONTHLY_GENERATIONS}회로 제한됩니다.`],
            ["AI 생성 횟수는 언제 초기화되나요?", "매월 1일 0시(한국 시간)에 초기화돼요. 문항 생성 버튼 1번이 1회이고, 생성에 실패하면 차감되지 않아요."],
            ["프로를 해지하면 데이터가 사라지나요?", "아니요. 월간 구독은 결제한 기간이 끝날 때 무료 플랜으로 바뀌고, 만든 평가와 결과는 모두 남아요. 연간 구독은 자동 갱신되지 않아요."],
            ["학교 예산으로 결제할 수 있나요?", "학교 라이선스는 연간 계약·세금계산서 발행으로 진행해요. 도입 문의로 연락 주세요."],
            ["학생 정보도 요금제에 따라 다르게 처리되나요?", "아니요. 학생 정보는 요금제와 관계없이 개인정보처리방침에 따라 동일하게 보호되고, 학생·학부모에게는 어떤 결제나 광고도 보이지 않아요."],
          ].map(([q, a]) => (
            <div key={q} className="card p-4">
              <dt className="font-bold">{q}</dt>
              <dd className="mt-1 text-sm text-ink/70">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="mt-16 border-t border-ink/10 pt-6 text-center text-sm text-ink/40">
        <Link href="/privacy" className="font-bold text-ink/60 hover:text-brand">개인정보처리방침</Link>
      </footer>
    </main>
  );
}
