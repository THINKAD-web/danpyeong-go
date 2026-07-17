/**
 * 데모 샘플 문항 1회성 생성 스크립트
 *
 * 3~4학년 수학 전 단원(최대 24개) × 3문항을 Claude API로 생성해
 * DemoSampleQuestion에 저장한다.
 *
 * ⚠️ 실행 시 실제 Anthropic API 비용이 발생한다.
 *    작성만 되어 있으며, 사용자 승인 후에만 실행할 것.
 *
 * 사전 조건:
 *   - prisma migrate deploy (DemoSampleQuestion 테이블)
 *   - ANTHROPIC_API_KEY 설정
 *
 * 실행:
 *   npx tsx scripts/generate-demo-samples.ts
 *   npx tsx scripts/generate-demo-samples.ts --grade=3   # 학년 필터
 *   npx tsx scripts/generate-demo-samples.ts --dry-run   # API 호출 없이 단원 목록만
 */

import { PrismaClient } from "@prisma/client";
import { generateQuestions, validateQuestion } from "../src/lib/ai";

const prisma = new PrismaClient();

const COUNT_PER_UNIT = 3;
const TYPE = "MULTIPLE_CHOICE" as const;
const DIFFICULTY = "MEDIUM" as const;

function parseArgs(argv: string[]) {
  let grade: number | undefined;
  let dryRun = false;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    const m = a.match(/^--grade=(\d+)$/);
    if (m) grade = Number(m[1]);
  }
  return { grade, dryRun };
}

async function main() {
  const { grade: gradeFilter, dryRun } = parseArgs(process.argv.slice(2));

  const subjects = await prisma.subject.findMany({
    where: {
      name: "수학",
      grade: gradeFilter ? gradeFilter : { in: [3, 4] },
    },
    orderBy: { grade: "asc" },
    include: {
      units: {
        where: { isArchived: false },
        orderBy: [{ term: "asc" }, { order: "asc" }],
      },
    },
  });

  const units = subjects.flatMap((s) =>
    s.units.map((u) => ({
      id: u.id,
      name: u.name,
      term: u.term,
      grade: s.grade,
      constraints: u.constraints,
    }))
  );

  console.log(
    `[generate-demo-samples] units=${units.length}, perUnit=${COUNT_PER_UNIT}, dryRun=${dryRun}`
  );
  console.log(
    "[generate-demo-samples] ⚠️ 실제 실행 시 Claude API 비용 발생 " +
      `(대략 단원당 생성+검수 2회 호출 × ${units.length} ≈ ${units.length * 2}회)`
  );

  if (dryRun) {
    for (const u of units) {
      console.log(`  - ${u.grade}학년 ${u.term}학기 ${u.name} (${u.id})`);
    }
    return;
  }

  let okUnits = 0;
  let failUnits = 0;
  let savedQuestions = 0;

  for (const u of units) {
    console.log(`\n→ ${u.grade}학년 ${u.term}학기 「${u.name}」`);
    try {
      // 기존 샘플 교체(재실행 안전)
      await prisma.demoSampleQuestion.deleteMany({ where: { unitId: u.id } });

      const questions = await generateQuestions({
        unitId: u.id,
        unitName: u.name,
        grade: u.grade,
        term: u.term,
        count: COUNT_PER_UNIT,
        difficulty: DIFFICULTY,
        type: TYPE,
        unitConstraints: u.constraints ?? undefined,
      });

      const valid = questions.filter((q) => validateQuestion(q) === null);
      if (valid.length === 0) {
        console.warn("  ! 유효 문항 0개 — 스킵");
        failUnits += 1;
        continue;
      }

      for (const q of valid) {
        await prisma.demoSampleQuestion.create({
          data: {
            unitId: u.id,
            type: q.type,
            difficulty: q.difficulty,
            stem: q.stem,
            choicesJson: q.choices,
            answerKeywords: q.answerKeywords,
            explanation: q.explanation ?? "",
          },
        });
        savedQuestions += 1;
      }
      okUnits += 1;
      console.log(`  ✓ saved ${valid.length} questions`);
    } catch (err) {
      failUnits += 1;
      console.error(`  ✗ failed:`, err instanceof Error ? err.message : err);
    }

    // API rate 여유
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(
    `\n[generate-demo-samples] done: okUnits=${okUnits}, failUnits=${failUnits}, savedQuestions=${savedQuestions}`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
