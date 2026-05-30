// ============================================================
// Mock 단원 데이터 — DB 시드 연결 전 화면 흐름용
// ▶ Claude Code 작업: prisma/seed.ts 의 데이터와 일치시키고,
//   화면에서는 DB(prisma) 조회로 교체.
// ============================================================

export type MockUnit = {
  id: string;
  term: number;
  order: number;
  name: string;
};

export const MOCK_UNITS: MockUnit[] = [
  // 1학기
  { id: "u3-1-1", term: 1, order: 1, name: "덧셈과 뺄셈" },
  { id: "u3-1-2", term: 1, order: 2, name: "평면도형" },
  { id: "u3-1-3", term: 1, order: 3, name: "나눗셈" },
  { id: "u3-1-4", term: 1, order: 4, name: "곱셈" },
  { id: "u3-1-5", term: 1, order: 5, name: "길이와 시간" },
  { id: "u3-1-6", term: 1, order: 6, name: "분수와 소수" },
  // 2학기
  { id: "u3-2-1", term: 2, order: 1, name: "곱셈" },
  { id: "u3-2-2", term: 2, order: 2, name: "나눗셈" },
  { id: "u3-2-3", term: 2, order: 3, name: "원" },
  { id: "u3-2-4", term: 2, order: 4, name: "분수" },
  { id: "u3-2-5", term: 2, order: 5, name: "들이와 무게" },
  { id: "u3-2-6", term: 2, order: 6, name: "자료의 정리" },
];

export type MockTest = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  questionCount: number;
  attemptCount: number;
  avgScore: number | null;
  shareToken: string;
};

export const MOCK_TESTS: MockTest[] = [
  {
    id: "t1",
    title: "3-2 곱셈 단원평가",
    status: "PUBLISHED",
    questionCount: 10,
    attemptCount: 24,
    avgScore: 82,
    shareToken: "demo-token-1",
  },
  {
    id: "t2",
    title: "3-1 나눗셈 쪽지시험",
    status: "CLOSED",
    questionCount: 5,
    attemptCount: 26,
    avgScore: 71,
    shareToken: "demo-token-2",
  },
  {
    id: "t3",
    title: "3-2 분수 연습",
    status: "DRAFT",
    questionCount: 8,
    attemptCount: 0,
    avgScore: null,
    shareToken: "demo-token-3",
  },
];
