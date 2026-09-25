import Link from "next/link";
import { currentTeacher } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanStatus } from "@/lib/entitlements";
import { formatKstMonthDay } from "@/lib/kst";
import { PlanUsageLine } from "@/components/PlanUsage";

export const dynamic = "force-dynamic";

// 교사 요금제·구독 관리 — 결제 연결은 Phase 2-B (포트원)
export default async function BillingPage() {
  const teacher = await currentTeacher();
  const user = await prisma.user.findUnique({
    where: { clerkId: teacher.id },
    select: { id: true },
  });
  const status = await getPlanStatus(user?.id ?? null);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex items-center justify-between">
        <Link href="/teacher" className="text-sm font-bold text-brand hover:underline">
          ← 대시보드
        </Link>
        <Link href="/pricing" className="text-sm font-bold text-ink/60 hover:text-ink">
          요금제 비교
        </Link>
      </nav>

      <h1 className="font-display text-3xl font-bold">요금제·구독 관리</h1>

      <section className="card mt-6 p-5">
        <h2 className="text-sm font-bold text-ink/50">현재 요금제</h2>
        <p className="mt-1 font-display text-3xl font-bold">{status.planLabel}</p>
        {status.planExpiresAt && (
          <p className="mt-1 text-sm text-ink/60">
            {formatKstMonthDay(new Date(status.planExpiresAt))}까지 이용 · 이후 Free 로 전환 (데이터 유지)
          </p>
        )}
        <div className="mt-3">
          <PlanUsageLine status={status} />
        </div>
        {status.monthlyLimit !== null && (
          <p className="mt-1 text-xs text-ink/40">
            {formatKstMonthDay(new Date(status.resetsAt))} 0시(한국 시간)에 초기화 · 생성 실패는 차감되지 않아요
          </p>
        )}
      </section>

      <section className="card mt-4 p-5">
        <h2 className="font-bold">구독 관리</h2>
        <p className="mt-2 text-sm text-ink/60">
          프로 결제는 <b>2027년 2월</b>에 열려요. 오픈 베타 동안은 모든 기능을 무료로 쓸 수 있고,
          유료 전환 전에 미리 안내해 드릴게요.
        </p>
        <p className="mt-2 text-sm text-ink/60">
          학교 단위 도입은{" "}
          <Link href="/pricing" className="font-bold text-brand hover:underline">
            요금제 페이지
          </Link>
          의 도입 문의를 이용해 주세요.
        </p>
      </section>
    </main>
  );
}
