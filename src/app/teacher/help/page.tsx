import Link from "next/link";

const FAQS = [
  {
    q: "학생이 로그인해야 하나요?",
    a: "아니요. 학생은 시험 코드와 이름만 입력하면 바로 응시할 수 있어요. 별도 계정이나 앱 설치가 필요 없습니다.",
  },
  {
    q: "시험 코드를 학생에게 어떻게 전달하나요?",
    a: "테스트를 배포하면 시험 코드가 생겨요. 대시보드 테스트 카드 오른쪽에 코드가 표시됩니다. '공유' 버튼을 누르면 코드와 응시 주소(danpyeong.go/play)가 클립보드에 복사돼요. 카카오톡·알림장·학교 LMS에 붙여넣기 하면 됩니다.",
  },
  {
    q: "AI가 만든 문항을 그냥 써도 되나요?",
    a: "AI가 2022 개정 교육과정 기준으로 생성하고 자기검산까지 하지만, 교사가 최종 검수하는 걸 권장합니다. 생성 후 문항 목록에서 수정·삭제가 자유롭습니다.",
  },
  {
    q: "배포 후 문항을 바꿀 수 있나요?",
    a: "배포(PUBLISHED) 상태에서는 문항을 직접 수정할 수 없어요. 마감 후 새 테스트를 만들어 배포해 주세요.",
  },
  {
    q: "결과 리포트는 어디서 받나요?",
    a: "대시보드에서 테스트의 '결과 보기'를 클릭하면 결과 분석 화면이 열려요. 오른쪽 상단의 'PDF 다운로드' 또는 'Excel 내보내기'를 누르면 파일이 저장됩니다.",
  },
  {
    q: "한 테스트에 문항을 몇 개까지 만들 수 있나요?",
    a: "한 번 생성 시 최대 20문항입니다. 생성 후 마음에 안 드는 문항을 삭제하고 저장하면 돼요.",
  },
  {
    q: "시험 시간 제한을 설정할 수 있나요?",
    a: "현재는 테스트 저장 후 시간 제한을 별도로 설정하는 기능은 준비 중입니다. 학생 응시 화면에서 제한 없이 풀 수 있습니다.",
  },
  {
    q: "단원이 없거나 더 추가하고 싶어요.",
    a: "대시보드 상단의 '단원 관리' 메뉴에서 과목·단원을 추가하고 AI 생성 제약도 직접 편집할 수 있습니다.",
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-8 flex items-center gap-3 text-sm">
        <Link href="/teacher" className="font-bold text-brand">
          ← 대시보드
        </Link>
        <span className="text-ink/30">/</span>
        <span className="font-bold text-ink">도움말</span>
      </nav>

      <h1 className="font-display text-4xl font-bold">자주 묻는 질문</h1>
      <p className="mt-2 text-ink/60">처음 쓰는 선생님을 위한 안내예요.</p>

      <div className="mt-10 space-y-4">
        {FAQS.map((faq, i) => (
          <div key={i} className="card p-6">
            <p className="font-bold text-ink">
              <span className="text-brand mr-2">Q.</span>{faq.q}
            </p>
            <p className="mt-2 text-sm text-ink/70 leading-relaxed">
              <span className="font-bold text-ink/40 mr-2">A.</span>{faq.a}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 card bg-brand/5 border-brand/20 p-6 text-center">
        <p className="font-bold text-ink">더 궁금한 점이 있으신가요?</p>
        <p className="mt-1 text-sm text-ink/60">
          첫 단원평가를 만들어 보세요. 막히는 부분이 있으면 온보딩 가이드를 참고하세요.
        </p>
        <Link
          href="/teacher/test/new"
          className="mt-4 inline-block card bg-brand px-6 py-3 font-bold text-white transition hover:-translate-y-0.5"
        >
          첫 문항 만들기 →
        </Link>
      </div>
    </main>
  );
}
