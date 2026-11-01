import Link from "next/link";
import { IconCheck } from "@/components/icons";
import { PREVIEW_BANK } from "@/lib/design-preview-data";
import { DesignPlayInteractive } from "./DesignPlayInteractive";

/**
 * 학생 응시 시안 — 서버 렌더로 첫 화면/제출완료를 바로 보여 줌
 * (로그인·API 없음). 상호작용은 클라이언트 아일랜드.
 * ?done=1 → 제출 완료 화면
 */
export default async function DesignPlayPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const sp = await searchParams;
  const questions = PREVIEW_BANK.filter((q) => q.unit === "나눗셈").slice(0, 3);

  if (sp.done === "1") {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-4 py-6 safe-bottom">
        <div className="design-banner -mx-4 mb-6">디자인 시안 · 제출 완료 화면</div>

        <div className="card flex flex-1 flex-col items-center justify-center p-8 text-center sm:p-10">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
            <IconCheck size={32} />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">제출 완료</h1>
          <p className="mt-2 text-base text-ink/60">
            샘플 시험지 응답이 기록되었습니다.
            <br />
            (시안 미리보기 — 실제 채점/저장 없음)
          </p>
          <p className="mt-6 rounded-xl bg-brand/5 px-5 py-3 text-base font-bold text-brand">
            응답 {questions.length}/{questions.length}문항
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:max-w-xs">
            <Link href="/design/play" className="btn-primary w-full">
              다시 풀어보기
            </Link>
            <Link href="/design" className="btn-secondary w-full">
              시안 목록으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <DesignPlayInteractive questions={questions} />;
}
