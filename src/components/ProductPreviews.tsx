// 랜딩·데모용 제품 화면 미리보기.
// 스크린샷 이미지 대신 실제 화면을 축소 재현한 정적 마크업 — 느린 학교 와이파이에서도 즉시 표시되고,
// 화면이 바뀌면 코드와 함께 갱신된다. 수치는 모두 예시(가상 학급) 데이터.

function PreviewFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-ink/12 bg-white text-left shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-ink/8 bg-brand/[0.03] px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-ink/15" />
        <span className="h-2 w-2 rounded-full bg-ink/15" />
        <span className="h-2 w-2 rounded-full bg-ink/15" />
        <span className="ml-2 truncate text-[10px] font-bold text-ink/40">{label}</span>
      </div>
      <div className="p-3 text-xs">{children}</div>
      <figcaption className="border-t border-ink/8 px-3 py-1 text-[10px] text-ink/40">
        예시 화면 · 가상 데이터
      </figcaption>
    </figure>
  );
}

/** 1단계: 검수된 문제은행에서 문항 고르기 */
export function PickPreview() {
  return (
    <PreviewFrame label="문항 고르기">
      <div className="flex flex-wrap gap-1">
        {["나눗셈", "중", "단원 전체"].map((t) => (
          <span
            key={t}
            className="rounded-md border border-brand/20 bg-brand/5 px-1.5 py-0.5 text-[10px] font-bold text-brand"
          >
            {t}
          </span>
        ))}
      </div>
      <ul className="mt-2 space-y-1.5">
        {[
          "사탕 24개를 4명에게…",
          "연필 35자루를 7자루씩…",
          "사과 58개를 6명에게…",
        ].map((q, i) => (
          <li
            key={q}
            className="flex items-start gap-1.5 rounded-lg border border-ink/10 bg-white px-2 py-1.5"
          >
            <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border border-brand bg-brand text-[8px] font-bold text-white">
              ✓
            </span>
            <span className="font-bold leading-snug text-ink/80">
              {i + 1}. {q}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] font-bold text-brand">선택 10문항 · 시험지 미리보기</p>
    </PreviewFrame>
  );
}

/** @deprecated 랜딩은 PickPreview 사용. 데모 호환용 유지 */
export function GeneratePreview() {
  return <PickPreview />;
}

export function SharePreview() {
  return (
    <PreviewFrame label="평가 배포">
      <p className="text-[10px] text-ink/40">학생에게 이 코드를 알려주세요</p>
      <p className="mt-1 text-center font-display text-3xl font-bold tracking-[0.3em] text-brandink tabular-nums">
        482931
      </p>
      <div className="mt-2 flex justify-center gap-1.5">
        <span className="rounded-md border border-brand/20 bg-brand/5 px-2 py-0.5 text-[10px] font-bold text-brand">
          코드만 복사
        </span>
        <span className="rounded-md border border-ink/15 bg-white px-2 py-0.5 text-[10px] font-bold">
          링크 복사
        </span>
      </div>
      <div className="mt-2 rounded-lg border border-ink/10 p-2 text-[10px] text-ink/60">
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
          <div key={k} className="rounded-lg border border-ink/10 py-1">
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
              className={`w-full rounded-t ${r < WEAK ? "bg-rose-500" : "bg-brand/70"}`}
              style={{ height: `${r * 0.7}px` }}
            />
            <span className="text-[8px] text-ink/40">Q{i + 1}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
        취약 문항 {weak.length}개 (정답률 {WEAK}% 미만): {weak.map((w) => `Q${w.q}`).join(", ")}
      </p>
    </PreviewFrame>
  );
}
