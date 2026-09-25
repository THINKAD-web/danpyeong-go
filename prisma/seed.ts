// prisma/seed.ts
// 3학년 + 4학년 수학 단원 시드 (2022 개정 교육과정, EBS 기준)
// constraints: AI 문항 생성 정확도 유지용 단원별 제약

import { PrismaClient } from "@prisma/client";
import { GRADE3_UNITS, GRADE4_UNITS } from "../src/lib/curriculum";

const prisma = new PrismaClient();

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
