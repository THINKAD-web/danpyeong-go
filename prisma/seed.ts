// prisma/seed.ts
// 3학년 + 4학년 수학 단원 시드 (2022 개정 교육과정, EBS 기준)
// constraints: AI 문항 생성 정확도 유지용 단원별 제약

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── 3학년 수학 ────────────────────────────────────────────
// constraints: getUnitConstraints() 휴리스틱 내용을 단원별로 이전 + 단원 특화 보완
const GRADE3_UNITS: { term: number; order: number; name: string; constraints: string }[] = [
  {
    term: 1, order: 1, name: "덧셈과 뺄셈",
    constraints: "세 자리 수 범위(0~999) 내 덧셈·뺄셈. 받아올림·받아내림 검산 필수. 결과가 음수가 되는 뺄셈 금지.",
  },
  {
    term: 1, order: 2, name: "평면도형",
    constraints: "선분·반직선·직선, 각, 직각, 직각삼각형·직사각형·정사각형 등 3학년 평면도형 개념 중심. 넓이·둘레 공식(4학년 이상) 사용 금지. 변의 길이는 양의 정수(cm).",
  },
  {
    term: 1, order: 3, name: "나눗셈",
    constraints: "stem에 사용하는 수는 반드시 나누어 떨어지는 수만 선택하거나, 나머지를 묻는 형태로 명시할 것. 나누어 떨어지지 않는 수로 몫만 묻는 문항 절대 금지. 3학년 1학기 나눗셈 범위 내.",
  },
  {
    term: 1, order: 4, name: "곱셈",
    constraints: "3학년 1학기: (두 자리)×(한 자리) 범위. 올림이 발생하는 경우 각 자릿값 계산을 단계적으로 검산. 곱의 자릿수가 예상을 벗어나는 오류 주의.",
  },
  {
    term: 1, order: 5, name: "길이와 시간",
    constraints: "단위 변환 1m=100cm, 1km=1000m, 1시간=60분, 1분=60초 엄수. 결과가 음수가 되는 뺄셈 금지. 보기의 단위를 stem과 일치시킬 것.",
  },
  {
    term: 1, order: 6, name: "분수와 소수",
    constraints: "분모는 10 이하 자연수. 단위분수·크기 비교·소수(소수 한 자리) 중심. 약분·통분은 3학년 범위 초과이므로 사용 금지. 분수와 소수를 한 문항에서 혼용하지 않는다.",
  },
  {
    term: 2, order: 1, name: "곱셈",
    constraints: "3학년 2학기: (두·세 자리)×(한·두 자리) 범위. 올림이 발생하는 경우 각 자릿값 계산을 단계적으로 검산. 곱의 자릿수가 예상을 벗어나는 오류 주의.",
  },
  {
    term: 2, order: 2, name: "나눗셈",
    constraints: "stem에 사용하는 수는 반드시 나누어 떨어지는 수만 선택하거나, 나머지를 묻는 형태로 명시할 것. 나누어 떨어지지 않는 수로 몫만 묻는 문항 절대 금지. 3학년 2학기 나눗셈 범위 내.",
  },
  {
    term: 2, order: 3, name: "원",
    constraints: "원의 중심·반지름·지름 관계(지름=반지름×2) 중심. 원주율·원둘레·넓이 공식은 3학년 범위 초과이므로 사용 금지. 길이는 양의 정수.",
  },
  {
    term: 2, order: 4, name: "분수",
    constraints: "분모는 10 이하 자연수. 대분수·가분수 변환 포함 가능. 약분·통분은 3학년 범위 초과이므로 사용 금지. 소수와 혼용하지 않는다.",
  },
  {
    term: 2, order: 5, name: "들이와 무게",
    constraints: "단위 변환 1L=1000mL, 1kg=1000g 기준 엄수. 뺄셈 결과가 음수가 되는 상황 금지. 단위를 혼용(mL를 L로 쓰는 등)하지 않는다. 보기의 단위를 stem과 일치시킬 것.",
  },
  {
    term: 2, order: 6, name: "자료의 정리",
    constraints: "자료 수치는 양의 정수. 표·그림그래프 읽기·비교·합계 중심. 눈금 단위를 문제에 명확히 표시. 평균·비율 등 상위 학년 개념 사용 금지.",
  },
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

  // 3학년 수학 (name·constraints upsert — 기존 단원·문항 FK 보존)
  const subject3 = await prisma.subject.upsert({
    where: { name_grade: { name: "수학", grade: 3 } },
    update: {},
    create: { name: "수학", grade: 3 },
  });

  for (const u of GRADE3_UNITS) {
    await prisma.unit.upsert({
      where: { subjectId_term_order: { subjectId: subject3.id, term: u.term, order: u.order } },
      update: { name: u.name, constraints: u.constraints },
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
