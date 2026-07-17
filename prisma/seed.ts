// prisma/seed.ts
// 교육과정 트리 시드: Subject(학년·과목) + Unit(학기·단원·성취기준)
//
// 새 학년/과목 추가 방법:
//   1) 아래에 GRADE*_UNITS 배열을 추가하고 seedSubjectUnits(...) 호출
//   2) npx prisma db seed  (또는 npm run db:seed)
// Subject 는 @@unique([name, grade]), Unit 은 @@unique([subjectId, term, order])
// 이므로 upsert 기준이 학년별로 분리된다 → 기존 3학년 행을 덮어쓰지 않는다.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type UnitSeed = {
  term: number;
  order: number;
  name: string;
  achievementStandard?: string;
};

// ── 3학년 수학 (기존 MVP) ─────────────────────────────────
// 성취기준은 추후 채움. update 시 name 만 갱신해 수동 입력한
// achievementStandard 를 지우지 않는다.
const GRADE3_UNITS: UnitSeed[] = [
  // 1학기
  { term: 1, order: 1, name: "덧셈과 뺄셈" },
  { term: 1, order: 2, name: "평면도형" },
  { term: 1, order: 3, name: "나눗셈" },
  { term: 1, order: 4, name: "곱셈" },
  { term: 1, order: 5, name: "길이와 시간" },
  { term: 1, order: 6, name: "분수와 소수" },
  // 2학기
  { term: 2, order: 1, name: "곱셈" },
  { term: 2, order: 2, name: "나눗셈" },
  { term: 2, order: 3, name: "원" },
  { term: 2, order: 4, name: "분수" },
  { term: 2, order: 5, name: "들이와 무게" },
  { term: 2, order: 6, name: "자료의 정리" },
];

// ── 4학년 수학 ────────────────────────────────────────────
// 단원명: 2022 개정 검정 교과서 공통 목차(학기당 6단원)
// 성취기준: 교육부 고시 제2022-33호 [별책8] 수학과 교육과정
//           3~4학년군 성취기준 코드·문구 (NCIC)
const GRADE4_UNITS: UnitSeed[] = [
  // 1학기
  {
    term: 1,
    order: 1,
    name: "큰 수",
    achievementStandard:
      "[4수01-01] 큰 수의 필요성을 인식하면서 10000 이상의 큰 수에 대한 자릿값과 위치적 기수법을 이해하고, 수를 읽고 쓸 수 있다. " +
      "[4수01-02] 다섯 자리 이상의 수의 범위에서 수의 계열을 이해하고, 수의 크기를 비교하며 그 방법을 설명할 수 있다.",
  },
  {
    term: 1,
    order: 2,
    name: "각도",
    achievementStandard:
      "[4수03-24] 각의 크기의 단위인 1도(°)를 알고, 각도기를 이용하여 각의 크기를 측정하고 어림할 수 있다. " +
      "[4수03-25] 여러 가지 방법으로 삼각형과 사각형의 내각의 크기의 합을 추론하고, 자신의 추론 과정을 설명할 수 있다.",
  },
  {
    term: 1,
    order: 3,
    name: "곱셈과 나눗셈",
    achievementStandard:
      "[4수01-04] 곱하는 수가 한 자리 수 또는 두 자리 수인 곱셈의 계산 원리를 이해하고 그 계산을 할 수 있다. " +
      "[4수01-07] 나누는 수가 두 자리 수인 나눗셈의 계산 원리를 이해하고 그 계산을 할 수 있다. " +
      "[4수01-08] 자연수의 덧셈, 뺄셈, 곱셈, 나눗셈과 관련한 여러 가지 상황에서 어림셈을 할 수 있다.",
  },
  {
    term: 1,
    order: 4,
    name: "평면도형의 이동",
    achievementStandard:
      "[4수03-04] 구체물이나 평면도형의 밀기, 뒤집기, 돌리기 활동을 통하여 그 변화를 이해한다. " +
      "[4수03-05] 평면에서 점의 이동에 대해 위치와 방향을 이용하여 설명할 수 있다.",
  },
  {
    term: 1,
    order: 5,
    name: "막대그래프",
    achievementStandard:
      "[4수04-01] 자료를 수집하여 그림그래프나 막대그래프로 나타내고 해석할 수 있다. " +
      "[4수04-03] 탐구 문제를 해결하기 위해 자료를 수집, 정리하여 막대그래프나 꺾은선그래프로 나타내고 해석할 수 있다.",
  },
  {
    term: 1,
    order: 6,
    name: "규칙 찾기",
    achievementStandard:
      "[4수02-01] 다양한 변화 규칙을 찾아 설명하고, 그 규칙을 수나 식으로 나타낼 수 있다. " +
      "[4수02-02] 계산식의 배열에서 규칙을 찾고, 계산 결과를 추측할 수 있다.",
  },
  // 2학기
  {
    term: 2,
    order: 1,
    name: "분수의 덧셈과 뺄셈",
    achievementStandard:
      "[4수01-15] 분모가 같은 분수의 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",
  },
  {
    term: 2,
    order: 2,
    name: "삼각형",
    achievementStandard:
      "[4수03-08] 여러 가지 모양의 삼각형에 대한 분류 활동을 통하여 이등변삼각형, 정삼각형을 이해하고, 그 성질을 탐구하고 설명할 수 있다. " +
      "[4수03-09] 여러 가지 모양의 삼각형에 대한 분류 활동을 통하여 직각삼각형, 예각삼각형, 둔각삼각형을 이해한다.",
  },
  {
    term: 2,
    order: 3,
    name: "소수의 덧셈과 뺄셈",
    achievementStandard:
      "[4수01-16] 소수 두 자리 수의 범위에서 소수의 덧셈과 뺄셈의 계산 원리를 이해하고 그 계산을 할 수 있다.",
  },
  {
    term: 2,
    order: 4,
    name: "사각형",
    achievementStandard:
      "[4수03-03] 직선의 수직 관계와 평행 관계를 이해한다. " +
      "[4수03-10] 여러 가지 모양의 사각형에 대한 분류 활동을 통하여 직사각형, 정사각형, 사다리꼴, 평행사변형, 마름모를 이해하고, 그 성질을 탐구하고 설명할 수 있다.",
  },
  {
    term: 2,
    order: 5,
    name: "꺾은선그래프",
    achievementStandard:
      "[4수04-02] 자료를 수집하여 꺾은선그래프로 나타내고 해석할 수 있다. " +
      "[4수04-03] 탐구 문제를 해결하기 위해 자료를 수집, 정리하여 막대그래프나 꺾은선그래프로 나타내고 해석할 수 있다.",
  },
  {
    term: 2,
    order: 6,
    name: "다각형",
    achievementStandard:
      "[4수03-11] 다각형과 정다각형을 이해한다. " +
      "[4수03-12] 주어진 도형을 이용하여 여러 가지 모양을 만들거나 채우고 설명할 수 있다.",
  },
];

async function seedSubjectUnits(
  name: string,
  grade: number,
  units: UnitSeed[],
  opts: { updateAchievementStandard: boolean }
) {
  // @@unique([name, grade]) — grade 가 다르면 별도 Subject 행
  const subject = await prisma.subject.upsert({
    where: { name_grade: { name, grade } },
    update: {},
    create: { name, grade },
  });

  for (const u of units) {
    // @@unique([subjectId, term, order]) — subjectId 가 다르면 3학년 Unit 과 충돌 없음
    await prisma.unit.upsert({
      where: {
        subjectId_term_order: {
          subjectId: subject.id,
          term: u.term,
          order: u.order,
        },
      },
      update: opts.updateAchievementStandard
        ? { name: u.name, achievementStandard: u.achievementStandard ?? null }
        : { name: u.name },
      create: {
        subjectId: subject.id,
        term: u.term,
        order: u.order,
        name: u.name,
        achievementStandard: u.achievementStandard ?? null,
      },
    });
  }

  return { subjectId: subject.id, unitCount: units.length };
}

async function main() {
  // 데모 교사 User (mock auth의 teacher_demo 기준, Clerk 연동 전 임시)
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

  const g3 = await seedSubjectUnits("수학", 3, GRADE3_UNITS, {
    updateAchievementStandard: false,
  });
  const g4 = await seedSubjectUnits("수학", 4, GRADE4_UNITS, {
    updateAchievementStandard: true,
  });

  console.log(
    `Seeded: 데모 교사 + 수학 3학년(${g3.unitCount} units, subject=${g3.subjectId})` +
      ` + 수학 4학년(${g4.unitCount} units, subject=${g4.subjectId})`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
