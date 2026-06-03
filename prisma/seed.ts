// prisma/seed.ts
// 3학년 + 4학년 수학 단원 시드 (2022 개정 교육과정, EBS 기준)
// constraints: AI 문항 생성 정확도 유지용 단원별 제약

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── 3학년 수학 (기존 데이터 유지) ────────────────────────
const GRADE3_UNITS = [
  { term: 1, order: 1, name: "덧셈과 뺄셈" },
  { term: 1, order: 2, name: "평면도형" },
  { term: 1, order: 3, name: "나눗셈" },
  { term: 1, order: 4, name: "곱셈" },
  { term: 1, order: 5, name: "길이와 시간" },
  { term: 1, order: 6, name: "분수와 소수" },
  { term: 2, order: 1, name: "곱셈" },
  { term: 2, order: 2, name: "나눗셈" },
  { term: 2, order: 3, name: "원" },
  { term: 2, order: 4, name: "분수" },
  { term: 2, order: 5, name: "들이와 무게" },
  { term: 2, order: 6, name: "자료의 정리" },
];

// ── 4학년 수학 (신규) ─────────────────────────────────────
const GRADE4_UNITS: { term: number; order: number; name: string; constraints: string }[] = [
  {
    term: 1, order: 1, name: "큰 수",
    constraints: "만·억·조 단위까지만 다룰 것(4학년 범위). 읽기·자릿값·크기 비교 중심. 숫자는 10자리 이하로 제한. 자릿수 오류 없이 검산할 것.",
  },
  {
    term: 1, order: 2, name: "각도",
    constraints: "각의 크기는 반드시 정수 도(°)로 표현. 예각(0°<x<90°)·둔각(90°<x<180°)·직각(90°) 분류 정확히. 각도의 합·차 계산 결과는 0~360° 범위 내. 계산 결과 검산 필수.",
  },
  {
    term: 1, order: 3, name: "곱셈과 나눗셈",
    constraints: "(세 자리 수)×(두 자리 수), (세 자리 수)÷(두 자리 수) 범위 내. 나눗셈 문제는 나누어떨어지거나 나머지를 명확히 묻는 형식으로. 반드시 나머지 < 나누는 수 조건 검산. 계산 결과가 음수가 되지 않도록.",
  },
  {
    term: 1, order: 4, name: "평면도형의 이동",
    constraints: "밀기·뒤집기·돌리기 세 가지 이동 개념 중심. 계산보다 도형의 변화 이해를 묻는 문항 위주. 이동 방향(위·아래·왼쪽·오른쪽), 회전 각도(90°·180°·270°)는 명확히 제시.",
  },
  {
    term: 1, order: 5, name: "막대그래프",
    constraints: "자료 수치는 양의 정수로 제한. 눈금 단위를 문제에 명확히 표시. 막대 높이와 수치의 일치를 검산. 읽기·비교·합계 중심 문항.",
  },
  {
    term: 1, order: 6, name: "규칙 찾기",
    constraints: "수 배열 또는 도형 배열의 규칙 찾기. 4학년 수준의 단순 규칙(등차수열, 배수 관계 등). 규칙에서 도출되는 다음 항을 명확히 검산할 것.",
  },
  {
    term: 2, order: 1, name: "분수의 덧셈과 뺄셈",
    constraints: "분모가 같은 분수의 덧셈·뺄셈만(이분모 혼합 금지). 대분수 포함 가능하나 분모는 동일해야 함. 계산 결과가 음수가 되지 않도록. 결과는 기약분수 또는 대분수로 표현. 반드시 계산 결과 검산.",
  },
  {
    term: 2, order: 2, name: "삼각형",
    constraints: "변 기준: 이등변삼각형(두 변 같음)·정삼각형(세 변 같음). 각 기준: 예각삼각형·직각삼각형·둔각삼각형. 정의 혼동 없이 정확히. 삼각 부등식(두 변의 합 > 나머지 한 변) 위반 금지. 변의 길이는 양의 정수(cm).",
  },
  {
    term: 2, order: 3, name: "소수의 덧셈과 뺄셈",
    constraints: "소수점 이하 두 자리(0.01 단위)까지만. 자릿수를 맞춰 계산하고 결과 검산 필수. 뺄셈은 큰 수에서 작은 수를 빼서 결과가 0 이상이어야 함(음수 결과 금지). 소수 자리수 오류 없이.",
  },
  {
    term: 2, order: 4, name: "사각형",
    constraints: "수직·평행 개념과 사다리꼴·평행사변형·마름모·직사각형·정사각형 정의·성질 정확히. 포함 관계(예: 정사각형은 직사각형이기도 함) 오류 없이. 변의 길이와 각도는 각 도형의 정의에 맞게 검산.",
  },
  {
    term: 2, order: 5, name: "꺾은선 그래프",
    constraints: "자료 수치는 양의 정수. 시간 순서에 따른 변화 경향(증가·감소·유지) 읽기 중심. 눈금 단위 명확히 제시. 꺾은선 기울기와 수치 변화의 일치 검산.",
  },
  {
    term: 2, order: 6, name: "다각형",
    constraints: "변의 수에 따른 분류(삼각형~십각형). 정다각형은 모든 변과 각이 같은 도형. 대각선 수: n각형의 대각선 수 = n(n-3)÷2. 볼록 다각형 범위 내. 대각선 수 계산 시 공식 검산 필수.",
  },
];

async function main() {
  // 데모 교사
  await prisma.user.upsert({
    where: { clerkId: "teacher_demo" },
    update: {},
    create: {
      clerkId: "teacher_demo",
      email: "demo.teacher@danpyeong.go",
      name: "김선생",
      role: "TEACHER",
    },
  });

  // 3학년 수학 (기존 데이터 유지, name만 upsert)
  const subject3 = await prisma.subject.upsert({
    where: { name_grade: { name: "수학", grade: 3 } },
    update: {},
    create: { name: "수학", grade: 3 },
  });

  for (const u of GRADE3_UNITS) {
    await prisma.unit.upsert({
      where: { subjectId_term_order: { subjectId: subject3.id, term: u.term, order: u.order } },
      update: { name: u.name },
      create: { subjectId: subject3.id, ...u },
    });
  }

  // 4학년 수학 (신규)
  const subject4 = await prisma.subject.upsert({
    where: { name_grade: { name: "수학", grade: 4 } },
    update: {},
    create: { name: "수학", grade: 4 },
  });

  for (const u of GRADE4_UNITS) {
    await prisma.unit.upsert({
      where: { subjectId_term_order: { subjectId: subject4.id, term: u.term, order: u.order } },
      update: { name: u.name, constraints: u.constraints },
      create: { subjectId: subject4.id, ...u },
    });
  }

  console.log(`Seeded: 수학 3학년 ${GRADE3_UNITS.length}개 단원 + 수학 4학년 ${GRADE4_UNITS.length}개 단원`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
