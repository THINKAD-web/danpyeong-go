import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 단평GO",
  description:
    "단평GO의 개인정보 수집·이용·보관·파기 및 정보주체의 권리에 관한 처리방침입니다.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* 헤더 */}
      <nav className="mb-10 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold text-brandink">
          단평<span className="text-coral">GO</span>
        </Link>
        <Link href="/" className="text-sm font-bold text-brand">
          ← 홈으로
        </Link>
      </nav>

      <header className="card p-6">
        <h1 className="font-display text-4xl font-bold">개인정보처리방침</h1>
        <p className="mt-3 inline-block rounded-full border-2 border-ink bg-sun/30 px-3 py-1 text-sm font-bold">
          시행일 · 2026년 8월 1일
        </p>
        <p className="mt-4 text-ink/70">
          단평GO(이하 &ldquo;서비스&rdquo;)를 운영하는 이재한(이하 &ldquo;운영자&rdquo;)은
          「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위해
          다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {/* 1 */}
        <Section n="1" title="수집하는 개인정보의 항목 및 수집 방법">
          <h3 className="font-bold">가. 교사 회원</h3>
          <Table
            head={["구분", "항목", "수집 방법"]}
            rows={[
              ["필수", "이메일 주소, 이름(또는 닉네임), 인증 식별자", "회원가입 시 (Clerk 인증 서비스 경유)"],
              [
                "자동 수집",
                "서비스 이용 기록(평가 생성·배포 이력, AI 문항 생성 횟수), 접속 로그",
                "서비스 이용 과정에서 자동 생성",
              ],
            ]}
          />

          <h3 className="mt-6 font-bold">나. 학생 응시자</h3>
          <Table
            head={["구분", "항목", "수집 방법"]}
            rows={[
              [
                "필수",
                "이름(또는 번호·닉네임), 응시 답안 및 채점 결과",
                "교사가 배포한 응시 코드로 평가 참여 시 입력",
              ],
            ]}
          />
          <List
            items={[
              "학생은 별도의 회원가입 없이 응시 코드와 이름만으로 참여하며, 이메일·연락처 등 추가 정보는 수집하지 않습니다.",
              "학생은 실명 대신 번호 또는 닉네임을 입력하여 참여할 수 있습니다.",
            ]}
          />
        </Section>

        {/* 2 */}
        <Section n="2" title="개인정보의 수집 및 이용 목적">
          <OrderedList
            items={[
              "교사 회원: 회원 식별 및 인증, 평가 생성·관리 기능 제공, AI 문항 생성 이용량 관리, 서비스 관련 안내",
              "학생 응시자: 평가 응시 및 자동 채점, 교사에게 채점 결과·학습 분석 리포트 제공",
              "서비스 운영: 부정 이용 방지, 서비스 개선을 위한 통계 분석(개인 식별 불가능한 형태)",
            ]}
          />
        </Section>

        {/* 3 */}
        <Section n="3" title="개인정보의 보유 및 이용 기간">
          <OrderedList
            items={[
              <>
                <b>교사 회원 정보</b>: 회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.
                단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
              </>,
              <>
                <b>학생 응시 기록(이름)</b>: <b>학기 단위로 보유</b>하며, 매년{" "}
                <b>2월 말일 및 8월 말일</b>에 직전 학기에 마감된 평가의 학생 이름을 일괄
                익명화(비식별 처리)합니다. 익명화 이후에는 개인을 식별할 수 없는 통계
                데이터만 유지됩니다.
              </>,
              "교사가 평가 또는 응시 기록을 직접 삭제하는 경우 해당 데이터는 지체 없이 파기됩니다.",
            ]}
          />
        </Section>

        {/* 4 */}
        <Section n="4" title="개인정보의 제3자 제공">
          <p className="text-ink/80">
            운영자는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 이용자가
            사전에 동의한 경우 또는 법령의 규정에 의한 경우는 예외로 합니다.
          </p>
        </Section>

        {/* 5 */}
        <Section n="5" title="개인정보 처리의 위탁 및 국외 이전">
          <p className="text-ink/80">
            서비스 운영을 위해 다음과 같이 개인정보 처리를 국외 사업자에게 위탁하고 있습니다.
          </p>
          <Table
            head={["수탁자", "소재지", "위탁 업무", "이전되는 항목"]}
            rows={[
              ["Vercel Inc.", "미국", "웹 서비스 호스팅", "서비스 이용 과정의 접속 정보"],
              ["Neon Inc.", "미국", "데이터베이스 운영", "제1조의 수집 항목 일체"],
              ["Clerk Inc.", "미국", "교사 회원 인증", "교사 이메일, 이름, 인증 식별자"],
              [
                "Anthropic PBC",
                "미국",
                "AI 문항 생성",
                "교육과정·단원 정보 (※ 교사·학생의 개인정보는 전송되지 않음)",
              ],
            ]}
          />
          <List
            items={[
              "이전 방법: 서비스 이용 시점에 네트워크를 통한 전송",
              "이용자는 개인정보의 국외 이전을 원하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.",
            ]}
          />
        </Section>

        {/* 6 */}
        <Section n="6" title="만 14세 미만 아동의 개인정보">
          <OrderedList
            items={[
              <>
                학생 응시자는 대부분 만 14세 미만의 아동입니다. 서비스는 아동의 개인정보
                수집을 최소화하기 위해 <b>이름(또는 번호·닉네임)과 응시 기록 외 어떠한
                정보도 수집하지 않습니다.</b>
              </>,
              "학생의 평가 참여는 소속 학급의 교사가 교육 목적으로 안내·관리하며, 운영자는 교사에게 학생 및 법정대리인에 대한 사전 안내를 권고합니다.",
              "법정대리인은 아동의 개인정보에 대한 열람·삭제를 요구할 수 있으며, 아래 제8조의 연락처로 요청 시 지체 없이 조치합니다.",
            ]}
          />
        </Section>

        {/* 7 */}
        <Section n="7" title="개인정보의 파기 절차 및 방법">
          <OrderedList
            items={[
              "파기 사유가 발생한 개인정보는 지체 없이 파기합니다.",
              "전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제하며, 학생 이름의 익명화는 원본을 식별 불가능한 값으로 대체하는 방식으로 수행합니다.",
            ]}
          />
        </Section>

        {/* 8 */}
        <Section n="8" title="정보주체의 권리와 행사 방법">
          <OrderedList
            items={[
              "이용자(학생의 경우 법정대리인 포함)는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다.",
              <>
                권리 행사는 아래 연락처를 통해 요청할 수 있으며, 운영자는 지체 없이
                조치합니다.
                <br />
                이메일:{" "}
                <a className="font-bold text-brand underline" href="mailto:mannote@tkad.co.kr">
                  mannote@tkad.co.kr
                </a>
              </>,
              "교사 회원은 서비스 내에서 본인이 생성한 평가 및 응시 기록을 직접 삭제할 수 있습니다.",
            ]}
          />
        </Section>

        {/* 9 */}
        <Section n="9" title="개인정보의 안전성 확보 조치">
          <OrderedList
            items={[
              "개인정보는 암호화된 통신 구간(HTTPS)을 통해 전송됩니다.",
              "학생 응시 데이터의 정답·채점 정보는 서버에서만 처리되며, 접근 권한은 해당 평가를 생성한 교사로 제한됩니다.",
              "AI 문항 생성 시 학생 개인정보는 AI 모델에 전송되지 않습니다.",
              "데이터베이스 접근은 인증된 서비스 계정으로 제한됩니다.",
            ]}
          />
        </Section>

        {/* 10 */}
        <Section n="10" title="개인정보 보호책임자">
          <Table
            head={["구분", "내용"]}
            rows={[
              ["성명", "이재한"],
              ["직책", "운영자"],
              ["연락처", "mannote@tkad.co.kr"],
            ]}
          />
          <p className="mt-4 text-ink/80">
            개인정보 침해에 대한 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번
            없이 118), 개인정보분쟁조정위원회(www.kopico.go.kr, 1833-6972)에 문의할 수
            있습니다.
          </p>
        </Section>

        {/* 11 */}
        <Section n="11" title="개인정보처리방침의 변경">
          <p className="text-ink/80">
            본 방침의 내용이 변경되는 경우 시행 7일 전부터 서비스 내 공지사항을 통해
            고지합니다.
          </p>
          <List
            items={[
              "공고일: 2026년 7월 25일",
              "시행일: 2026년 8월 1일",
            ]}
          />
        </Section>
      </div>

      <footer className="mt-16 border-t-2 border-ink/10 pt-6 text-center text-sm text-ink/40">
        <Link href="/" className="font-bold text-brand">
          ← 단평GO 홈으로 돌아가기
        </Link>
      </footer>
    </main>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold">
        <span className="text-brand">{n}.</span> {title}
      </h2>
      <div className="mt-4 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="border-2 border-ink bg-ink/5 px-3 py-2 text-left font-bold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border-2 border-ink px-3 py-2 align-top text-ink/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink/80">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function OrderedList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="list-decimal space-y-1.5 pl-5 text-ink/80">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ol>
  );
}
