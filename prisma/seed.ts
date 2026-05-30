// prisma/seed.ts
// 3학년 수학 단원 시드. 성취기준(achievementStandard)은 교사가 어드민에서 채우는 전제로 비워둠.
// ▶ Claude Code: 실제 사용 교과서 기준으로 단원명/순서 확정.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UNITS = [
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

async function main() {
  const subject = await prisma.subject.upsert({
    where: { name_grade: { name: "수학", grade: 3 } },
    update: {},
    create: { name: "수학", grade: 3 },
  });

  for (const u of UNITS) {
    await prisma.unit.upsert({
      where: {
        subjectId_term_order: {
          subjectId: subject.id,
          term: u.term,
          order: u.order,
        },
      },
      update: { name: u.name },
      create: { subjectId: subject.id, ...u },
    });
  }

  console.log(`Seeded 수학 3학년 + ${UNITS.length} units`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
