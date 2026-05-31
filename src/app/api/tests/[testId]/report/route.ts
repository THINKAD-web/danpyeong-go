import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { createElement } from "react";
import { computeTestStats } from "@/lib/stats";

// NanumGothic — 한글 지원 폰트 (Google Fonts CDN)
Font.register({
  family: "NanumGothic",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/nanumgothic/v21/PN_3Rfi-oW3hYwmKDpxS7F_z-7Vd.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/nanumgothic/v21/PN_oRfi-oW3hYwmKDpxS7F_LQv37zlEn14YEUQ.ttf",
      fontWeight: "bold",
    },
  ],
});

const c = {
  brand: "#5B5BFF",
  coral: "#FF6B6B",
  ink: "#1A1A2E",
  inkLight: "#6B6B8A",
  bg: "#F8F8FF",
  green: "#2D7A2D",
  border: "#E0E0F0",
};

const s = StyleSheet.create({
  page: { fontFamily: "NanumGothic", fontSize: 9, color: c.ink, padding: "30 36 30 36", backgroundColor: "#fff" },
  // header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, borderBottom: `2 solid ${c.brand}`, paddingBottom: 10 },
  logo: { fontSize: 18, fontWeight: "bold", color: c.brand },
  logoSub: { color: c.coral },
  testTitle: { fontSize: 11, fontWeight: "bold", maxWidth: 320 },
  dateText: { fontSize: 8, color: c.inkLight, marginTop: 3 },
  // summary cards
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  card: { flex: 1, backgroundColor: c.bg, borderRadius: 6, padding: "8 10", border: `1 solid ${c.border}` },
  cardLabel: { fontSize: 7.5, color: c.inkLight, marginBottom: 3 },
  cardValue: { fontSize: 15, fontWeight: "bold", color: c.brand },
  // section
  sectionTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 8, marginTop: 14, color: c.ink },
  weakBadge: { fontSize: 7.5, color: c.coral, fontWeight: "bold" },
  // table
  table: { width: "100%" },
  thead: { flexDirection: "row", backgroundColor: c.brand, borderRadius: "4 4 0 0" },
  th: { color: "#fff", fontWeight: "bold", fontSize: 8, padding: "5 6" },
  row: { flexDirection: "row", borderBottom: `1 solid ${c.border}` },
  rowAlt: { backgroundColor: c.bg },
  rowLow: { backgroundColor: "#FFF0F0" },
  td: { fontSize: 8, padding: "4 6", color: c.ink },
  // bar
  barBg: { height: 7, backgroundColor: c.border, borderRadius: 4, flex: 1, marginTop: 2 },
  barFill: { height: 7, borderRadius: 4 },
  rateCell: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
});

function Header({ title, date }: { title: string; date: string }) {
  return createElement(
    View,
    { style: s.headerRow },
    createElement(
      View,
      null,
      createElement(Text, { style: s.logo }, ["단평", createElement(Text, { style: s.logoSub, key: "go" }, "GO")]),
      createElement(Text, { style: s.testTitle }, title),
      createElement(Text, { style: s.dateText }, `생성: ${date}`)
    )
  );
}

function SummaryCards(props: { total: number; avg: number; high: number; low: number }) {
  const items = [
    { label: "응시 인원", value: `${props.total}명` },
    { label: "반 평균", value: `${props.avg}점` },
    { label: "최고점", value: `${props.high}점` },
    { label: "최저점", value: `${props.low}점` },
  ];
  return createElement(
    View,
    { style: s.summaryRow },
    ...items.map((it, i) =>
      createElement(
        View,
        { style: s.card, key: i },
        createElement(Text, { style: s.cardLabel }, it.label),
        createElement(Text, { style: s.cardValue }, it.value)
      )
    )
  );
}

function StudentTable({ students }: { students: { name: string; pct: number; score: number; max: number; time: string }[] }) {
  const cols = [
    { label: "이름", width: "22%" },
    { label: "점수", width: "13%", align: "right" as const },
    { label: "원점수", width: "15%", align: "right" as const },
    { label: "제출 시각", width: "25%", align: "center" as const },
    { label: "비고", width: "25%" },
  ];

  return createElement(
    View,
    { style: s.table },
    createElement(
      View,
      { style: s.thead },
      ...cols.map((col, i) =>
        createElement(Text, { style: { ...s.th, width: col.width, textAlign: col.align ?? "left" }, key: i }, col.label)
      )
    ),
    ...students.map((st, i) =>
      createElement(
        View,
        { style: { ...s.row, ...(i % 2 === 1 ? s.rowAlt : {}), ...(st.pct < 60 ? s.rowLow : {}) }, key: i },
        createElement(Text, { style: { ...s.td, width: cols[0].width } }, st.name),
        createElement(Text, { style: { ...s.td, width: cols[1].width, textAlign: "right", fontWeight: "bold", color: st.pct < 60 ? c.coral : st.pct >= 80 ? c.green : c.ink } }, `${st.pct}점`),
        createElement(Text, { style: { ...s.td, width: cols[2].width, textAlign: "right", color: c.inkLight } }, `${st.score}/${st.max}`),
        createElement(Text, { style: { ...s.td, width: cols[3].width, textAlign: "center", color: c.inkLight } }, st.time),
        createElement(Text, { style: { ...s.td, width: cols[4].width, color: c.coral } }, st.pct < 60 ? "하위권" : "")
      )
    )
  );
}

function QuestionTable({ questions }: { questions: { order: number; stem: string; rate: number; correct: number; total: number }[] }) {
  return createElement(
    View,
    { style: s.table },
    createElement(
      View,
      { style: s.thead },
      createElement(Text, { style: { ...s.th, width: "8%" } }, "번호"),
      createElement(Text, { style: { ...s.th, width: "50%" } }, "문항"),
      createElement(Text, { style: { ...s.th, width: "14%", textAlign: "right" } }, "정답률"),
      createElement(Text, { style: { ...s.th, width: "13%", textAlign: "center" } }, "정답/응시"),
      createElement(Text, { style: { ...s.th, width: "15%" } }, "그래프"),
    ),
    ...questions.map((q, i) => {
      const weak = q.rate < 60;
      const barColor = weak ? c.coral : c.brand;
      return createElement(
        View,
        { style: { ...s.row, ...(i % 2 === 1 ? s.rowAlt : {}) }, key: i },
        createElement(Text, { style: { ...s.td, width: "8%", fontWeight: "bold" } }, `Q${q.order}`),
        createElement(
          View,
          { style: { ...s.td, width: "50%", paddingTop: 3 } },
          createElement(Text, null, q.stem.length > 45 ? q.stem.slice(0, 44) + "…" : q.stem),
          weak ? createElement(Text, { style: { ...s.weakBadge, marginTop: 2 } }, "취약 문항") : null
        ),
        createElement(Text, { style: { ...s.td, width: "14%", textAlign: "right", fontWeight: "bold", color: weak ? c.coral : c.green } }, `${q.rate}%`),
        createElement(Text, { style: { ...s.td, width: "13%", textAlign: "center", color: c.inkLight } }, `${q.correct}/${q.total}`),
        createElement(
          View,
          { style: { ...s.td, width: "15%", justifyContent: "center" } },
          createElement(
            View,
            { style: s.barBg },
            createElement(View, { style: { ...s.barFill, width: `${q.rate}%`, backgroundColor: barColor } })
          )
        )
      );
    })
  );
}

function ReportDocument({ stats, date }: { stats: Awaited<ReturnType<typeof computeTestStats>>; date: string }) {
  if (!stats) return createElement(Document, null, createElement(Page, { style: s.page }, createElement(Text, null, "데이터 없음")));

  const students = stats.students.map((st) => ({
    name: st.studentName,
    pct: st.pct,
    score: st.score,
    max: st.maxScore,
    time: new Date(st.submittedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
  }));

  const questions = stats.questions.map((q) => ({
    order: q.order,
    stem: q.stem,
    rate: q.correctRate,
    correct: q.correctCount,
    total: q.totalCount,
  }));

  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: s.page },
      createElement(Header, { title: stats.title, date }),
      createElement(SummaryCards, { total: stats.totalAttempts, avg: stats.avgScore, high: stats.maxScore, low: stats.minScore }),
      createElement(Text, { style: s.sectionTitle }, "학생별 점수"),
      createElement(StudentTable, { students }),
      createElement(Text, { style: s.sectionTitle }, "문항별 정답률"),
      createElement(QuestionTable, { questions })
    )
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;

  const stats = await computeTestStats(testId);
  if (!stats) {
    return NextResponse.json({ error: "테스트를 찾을 수 없습니다." }, { status: 404 });
  }

  const date = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  // @react-pdf/renderer expects a Document element as root
  const doc = createElement(ReportDocument, { stats, date }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(doc);

  const filename = encodeURIComponent(`${stats.title}_결과리포트.pdf`);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
