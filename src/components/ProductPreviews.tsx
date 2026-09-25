// 랜딩·데모용 제품 화면 미리보기.
// 스크린샷 이미지 대신 실제 화면을 축소 재현한 정적 마크업 — 느린 학교 와이파이에서도 즉시 표시되고,
// 화면이 바뀌면 코드와 함께 갱신된다. 수치는 모두 예시(가상 학급) 데이터.

function PreviewFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-xl border-2 border-ink bg-white text-left shadow-[3px_3px_0_0_rgba(0,0,0,0.85)]">
      <div className="flex items-center gap-1.5 border-b-2 border-ink bg-ink/5 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-coral/70" />
        <span className="h-2 w-2 rounded-full bg-sun" />
        <span className="h-2 w-2 rounded-full bg-mint" />
        <span className="ml-2 truncate text-[10px] font-bold text-ink/40">{label}</span>
      </div>
      <div className="p-3 text-xs">{children}</div>
      <figcaption className="border-t border-ink/10 px-3 py-1 text-[10px] text-ink/40">
        예시 화면 · 가상 데이터
      </figcaption>
    </figure>
  );
}

export function GeneratePreview() {
  return (
    <PreviewFrame label="새 평가 만들기">
      <div className="grid grid-cols-2 gap-1.5">
        {[
          ["학년·학기", "3학년 1학기"],
          ["단원", "3. 나눗셈"],
          ["난이도", "중"],
          ["문항 수", "10문항"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-ink/30 px-2 py-1">
            <p className="text-[9px] text-ink/40">{k}</p>
            <p className="font-bold">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-lg border border-ink/20 bg-brand/5 p-2">
        <p className="text-[10px] font-bold text-brand">✨ AI 초안 · 검산 완료</p>
        <p className="mt-1 font-bold leading-snug">Q1. 사탕 24개를 4명에게 똑같이 나누면 한 명이 몇 개씩 받나요?</p>
        <p className="mt-1 text-ink/60">① 4개 ② 5개 <b className="text-brand">③ 6개</b> ④ 8개</p>
      </div>
    </PreviewFrame>
  );
}

export function SharePreview() {
  return (
    <PreviewFrame label="평가 배포">
      <p className="text-[10px] text-ink/40">학생에게 이 코드를 알려주세요</p>
      <p className="mt-1 text-center font-display text-3xl font-bold tracking-[0.3em] text-brandink tabular-nums">
        482931
      </p>
      <div className="mt-2 flex justify-center gap-1.5">
        <span className="rounded-md border border-ink bg-sun/40 px-2 py-0.5 text-[10px] font-bold">코드만 복사</span>
        <span className="rounded-md border border-ink bg-white px-2 py-0.5 text-[10px] font-bold">링크 복사</span>
      </div>
      <div className="mt-2 rounded-lg border border-ink/20 p-2 text-[10px] text-ink/60">
        학생 화면: 코드 + 이름(또는 출석번호) 입력 → 바로 응시
      </div>
    </PreviewFrame>
  );
}

const SAMPLE_RATES = [92, 88, 45, 81, 76, 52, 95, 70, 84, 63];
const WEAK = 60;

export function ReportPreview() {
  const weak = SAMPLE_RATES.map((r, i) => ({ r, q: i + 1 })).filter((x) => x.r < WEAK);
  return (
    <PreviewFrame label="결과 리포트 · 3학년 2반 나눗셈">
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          ["응시", "24명"],
          ["평균", "74.6점"],
          ["최고", "100점"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-ink/20 py-1">
            <p className="text-[9px] text-ink/40">{k}</p>
            <p className="font-bold">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] font-bold text-ink/60">문항별 정답률</p>
      <div className="mt-1 flex h-20 items-end gap-1" aria-hidden="true">
        {SAMPLE_RATES.map((r, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
            <div
              className={`w-full rounded-t ${r < WEAK ? "bg-coral" : "bg-brand/70"}`}
              style={{ height: `${r * 0.7}px` }}
            />
            <span className="text-[8px] text-ink/40">Q{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 rounded-md bg-coral/10 px-2 py-1 text-[10px] font-bold text-coral">
        ⚠️ 취약 문항 {weak.length}개 (정답률 {WEAK}% 미만): {weak.map((w) => `Q${w.q}`).join(", ")}
      </p>
    </PreviewFrame>
  );
}
