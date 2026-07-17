import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="font-display text-8xl font-bold text-brand select-none">404</div>
      <h1 className="font-display mt-4 text-3xl font-bold text-ink">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-3 text-ink/60 max-w-xs">
        주소가 잘못됐거나 삭제된 페이지예요.
        <br />
        아래 버튼으로 돌아가세요.
      </p>

      {/* 노트 찢어진 선 느낌 */}
      <div className="my-8 w-48 border-t-2 border-dashed border-ink/20" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="card px-6 py-3 font-bold text-ink transition hover:-translate-y-0.5"
        >
          홈으로
        </Link>
        <Link
          href="/play"
          className="card bg-coral px-6 py-3 font-bold text-white transition hover:-translate-y-0.5"
        >
          응시하기
        </Link>
      </div>
    </main>
  );
}
