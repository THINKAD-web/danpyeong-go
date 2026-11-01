/** 디자인 시안 미리보기용 목 데이터 — API/DB와 무관 */

export type PreviewChoice = { id: string; order: number; text: string };
export type PreviewQuestion = {
  id: string;
  unit: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER";
  stem: string;
  choices: PreviewChoice[];
  answerKeywords?: string[];
};

export const PREVIEW_UNITS = [
  "덧셈과 뺄셈",
  "평면도형",
  "나눗셈",
  "곱셈",
  "길이와 시간",
  "분수와 소수",
] as const;

export const PREVIEW_BANK: PreviewQuestion[] = [
  {
    id: "pq1",
    unit: "나눗셈",
    difficulty: "EASY",
    type: "MULTIPLE_CHOICE",
    stem: "사탕 24개를 4명에게 똑같이 나누면 한 명이 몇 개씩 받나요?",
    choices: [
      { id: "c1", order: 1, text: "4개" },
      { id: "c2", order: 2, text: "5개" },
      { id: "c3", order: 3, text: "6개" },
      { id: "c4", order: 4, text: "8개" },
    ],
  },
  {
    id: "pq2",
    unit: "나눗셈",
    difficulty: "MEDIUM",
    type: "MULTIPLE_CHOICE",
    stem: "연필 35자루를 한 묶음에 7자루씩 묶으면 몇 묶음이 되나요?",
    choices: [
      { id: "c1", order: 1, text: "4묶음" },
      { id: "c2", order: 2, text: "5묶음" },
      { id: "c3", order: 3, text: "6묶음" },
      { id: "c4", order: 4, text: "7묶음" },
    ],
  },
  {
    id: "pq3",
    unit: "나눗셈",
    difficulty: "HARD",
    type: "SHORT_ANSWER",
    stem: "사과 58개를 6명에게 똑같이 나누어 주고 남은 사과는 몇 개인가요?",
    choices: [],
    answerKeywords: ["4"],
  },
  {
    id: "pq4",
    unit: "곱셈",
    difficulty: "EASY",
    type: "MULTIPLE_CHOICE",
    stem: "한 상자에 달걀이 6개씩 들어 있습니다. 상자 8개의 달걀은 모두 몇 개인가요?",
    choices: [
      { id: "c1", order: 1, text: "42개" },
      { id: "c2", order: 2, text: "48개" },
      { id: "c3", order: 3, text: "54개" },
      { id: "c4", order: 4, text: "56개" },
    ],
  },
  {
    id: "pq5",
    unit: "곱셈",
    difficulty: "MEDIUM",
    type: "MULTIPLE_CHOICE",
    stem: "한 줄에 학생이 9명씩 서 있습니다. 7줄이면 학생은 모두 몇 명인가요?",
    choices: [
      { id: "c1", order: 1, text: "56명" },
      { id: "c2", order: 2, text: "63명" },
      { id: "c3", order: 3, text: "72명" },
      { id: "c4", order: 4, text: "81명" },
    ],
  },
  {
    id: "pq6",
    unit: "분수와 소수",
    difficulty: "MEDIUM",
    type: "MULTIPLE_CHOICE",
    stem: "피자 1판을 8등분했을 때, 3조각은 전체의 얼마인가요?",
    choices: [
      { id: "c1", order: 1, text: "1/8" },
      { id: "c2", order: 2, text: "3/8" },
      { id: "c3", order: 3, text: "3/5" },
      { id: "c4", order: 4, text: "5/8" },
    ],
  },
  {
    id: "pq7",
    unit: "길이와 시간",
    difficulty: "EASY",
    type: "MULTIPLE_CHOICE",
    stem: "1m는 몇 cm인가요?",
    choices: [
      { id: "c1", order: 1, text: "10cm" },
      { id: "c2", order: 2, text: "100cm" },
      { id: "c3", order: 3, text: "1000cm" },
      { id: "c4", order: 4, text: "10000cm" },
    ],
  },
  {
    id: "pq8",
    unit: "평면도형",
    difficulty: "MEDIUM",
    type: "MULTIPLE_CHOICE",
    stem: "네 각이 모두 직각이고 네 변의 길이가 모두 같은 도형은 무엇인가요?",
    choices: [
      { id: "c1", order: 1, text: "직사각형" },
      { id: "c2", order: 2, text: "마름모" },
      { id: "c3", order: 3, text: "정사각형" },
      { id: "c4", order: 4, text: "평행사변형" },
    ],
  },
];

export const DIFFICULTY_LABEL: Record<PreviewQuestion["difficulty"], string> = {
  EASY: "하",
  MEDIUM: "중",
  HARD: "상",
};
