import Link from "next/link";
import { IconDevice, IconFile, IconList } from "@/components/icons";

const SCREENS = [
  {
    href: "/",
    title: "1. 랜딩",
    desc: "무료 베타 히어로 · 3분 완성 메시지",
    icon: IconFile,
    path: "/",
  },
  {
    href: "/design/teacher",
    title: "2. 교사 — 시험지 만들기",
    desc: "미리보기 중심 · 문항 선택 패널",
    icon: IconList,
    path: "/design/teacher",
  },
  {
    href: "/design/play",
    title: "3. 학생 — 응시",
    desc: "한 화면 한 문항 · 큰 터치 버튼",
    icon: IconDevice,
    path: "/design/play",
  },
];

export default function DesignIndexPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-6">
      <div className="design-banner -mx-5 mb-8 sm:-mx-6">디자인 시안 미리보기 · 기능/DB 미연동</div>

      <Link href="/" className="font-display text-2xl font-bold text-brandink">
        단평<span className="text-brand">GO</span>
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">대표님 확인용 시안 3화면</h1>
      <p className="mt-2 text-base text-ink/60">
        로그인 없이 볼 수 있습니다. UI(스타일·레이아웃·카피·아이콘)만 반영한 미리보기입니다.
      </p>

      <ul className="mt-8 space-y-3">
        {SCREENS.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                className="card flex items-center gap-4 p-5 transition hover:border-brand/30 hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/8 text-brand">
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{s.title}</p>
                  <p className="text-sm text-ink/55">{s.desc}</p>
                  <p className="mt-1 font-mono text-xs text-brand">{s.path}</p>
                </div>
                <span className="text-brand font-bold">→</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
