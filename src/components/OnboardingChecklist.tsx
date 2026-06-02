"use client";

import Link from "next/link";

// 빈 대시보드(테스트 0개)일 때 표시하는 3단계 온보딩 가이드.
// 테스트가 1개 이상이면 부모 컴포넌트에서 렌더하지 않음 → dismiss 상태 관리 불필요.
export function OnboardingChecklist() {
  return (
    <div className="card overflow-hidden">
      {/* 헤더 */}
      <div className="bg-brand px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">시작 가이드</p>
        <h2 className="font-display mt-1 text-2xl font-bold text-white">
          첫 단원평가, 5분이면 충분해요 ✨
        </h2>
        <p className="mt-1 text-sm text-white/80">
          아래 3단계만 따라가면 첫 평가가 완성됩니다.
        </p>
      </div>

      {/* 3단계 */}
      <div className="divide-y divide-ink/10">
        {[
          {
            step: "1",
            title: "AI로 문항 만들기",
            desc: "단원·난이도를 고르면 AI가 객관식·단답형 초안을 만들어요. 생성 후 수정·삭제도 자유롭습니다.",
            action: { label: "문항 만들기 →", href: "/teacher/test/new" },
            color: "text-brand",
            bg: "bg-brand/10",
          },
          {
            step: "2",
            title: "배포하고 코드 공유하기",
            desc: "저장 후 테스트를 '배포'하면 공유 코드가 생겨요. 그 코드를 학생에게 알려주세요. 학생은 로그인 없이 바로 응시할 수 있어요.",
            action: null,
            color: "text-coral",
            bg: "bg-coral/10",
          },
          {
            step: "3",
            title: "자동 채점·결과 확인",
            desc: "학생이 제출하면 즉시 채점됩니다. '결과 보기'에서 문항별 정답률과 학생별 점수를 확인하고 PDF·Excel로 내보내세요.",
            action: null,
            color: "text-mint",
            bg: "bg-mint/10",
          },
        ].map((s, i) => (
          <div key={i} className="flex gap-4 px-6 py-5 sm:items-start">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold ${s.bg} ${s.color}`}
            >
              {s.step}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink">{s.title}</p>
              <p className="mt-0.5 text-sm text-ink/60 leading-relaxed">{s.desc}</p>
              {s.action && (
                <Link
                  href={s.action.href}
                  className="mt-3 inline-block card bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                >
                  {s.action.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 도움말 링크 */}
      <div className="border-t border-ink/10 bg-ink/[0.02] px-6 py-3 text-right">
        <Link href="/teacher/help" className="text-xs font-bold text-ink/40 hover:text-brand transition">
          자주 묻는 질문 →
        </Link>
      </div>
    </div>
  );
}
