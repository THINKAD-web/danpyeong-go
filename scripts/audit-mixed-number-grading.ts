/**
 * 대분수 채점 버그 영향 조사 + (선택) 재채점
 *
 * 버그: 단답형 채점 정규화가 공백을 지워 대분수 "1 2/3" 이 가분수처럼 "12/3" 이 됐다.
 *  - 오채점(정답 처리): 학생이 "12/3" 을 입력 → 정답 "1 2/3" 과 같다고 판정
 *  - 오채점(오답 처리): 학생이 "1과 2/3" 을 입력 → 정답 "1 2/3"("12/3") 과 달라 오답 판정
 * 수정 후 정규화(src/lib/grading.ts)로 제출된 단답형 답안을 다시 채점해, 판정이 바뀌는 답안을 찾는다.
 *
 * 실행:
 *   npx tsx scripts/audit-mixed-number-grading.ts          # 조사만 (DB 변경 없음)
 *   npx tsx scripts/audit-mixed-number-grading.ts --apply  # 판정이 바뀐 답안·응시 점수 갱신
 *
 * ⚠️ --apply 는 학생 점수를 바꾼다. 교사가 이미 점수를 안내했을 수 있으니, 조사 결과를 먼저 검토한 뒤 실행.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { gradeShortAnswer } from "../src/lib/grading";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  // 분수가 들어간 단답형 답안만 대상 (정답 키워드나 학생 답에 "/")
  const answers = await prisma.answer.findMany({
    where: {
      textAnswer: { not: null },
      attempt: { status: "SUBMITTED" },
      testQuestion: { question: { type: "SHORT_ANSWER" } },
    },
    select: {
      id: true,
      attemptId: true,
      textAnswer: true,
      isCorrect: true,
      earnedPoints: true,
      attempt: {
        select: {
          studentName: true,
          test: { select: { title: true, owner: { select: { email: true } } } },
        },
      },
      testQuestion: {
        select: { points: true, question: { select: { stem: true, answerKeywords: true } } },
      },
    },
  });

  const changed = answers
    .filter((a) => a.textAnswer!.includes("/") || a.testQuestion.question.answerKeywords.some((k) => k.includes("/")))
    .map((a) => {
      const nowCorrect = gradeShortAnswer(a.textAnswer!, a.testQuestion.question.answerKeywords);
      return { ...a, nowCorrect };
    })
    .filter((a) => a.nowCorrect !== (a.isCorrect ?? false));

  console.log(`분수 단답형 제출 답안 중 판정이 바뀌는 답안: ${changed.length}건`);
  const toWrong = changed.filter((a) => !a.nowCorrect);
  const toRight = changed.filter((a) => a.nowCorrect);
  console.log(`  - 정답 → 오답 (예: "12/3" 을 대분수 정답으로 인정했던 경우): ${toWrong.length}건`);
  console.log(`  - 오답 → 정답 (예: "1과 2/3" 을 틀렸다고 했던 경우): ${toRight.length}건`);

  for (const a of changed) {
    console.log(
      [
        `\n[${a.nowCorrect ? "오답→정답" : "정답→오답"}] ${a.attempt.test.title} (교사 ${a.attempt.test.owner.email ?? "-"})`,
        `  학생: ${a.attempt.studentName}`,
        `  문항: ${a.testQuestion.question.stem.slice(0, 80)}`,
        `  학생 답: "${a.textAnswer}" / 정답 키워드: ${JSON.stringify(a.testQuestion.question.answerKeywords)}`,
      ].join("\n")
    );
  }

  if (!apply) {
    console.log("\n조사만 했습니다 (DB 변경 없음). 재채점하려면 --apply 를 붙여 다시 실행하세요.");
    return;
  }

  const attemptIds = [...new Set(changed.map((a) => a.attemptId))];
  for (const attemptId of attemptIds) {
    await prisma.$transaction(async (tx) => {
      for (const a of changed.filter((c) => c.attemptId === attemptId)) {
        await tx.answer.update({
          where: { id: a.id },
          data: { isCorrect: a.nowCorrect, earnedPoints: a.nowCorrect ? a.testQuestion.points : 0 },
        });
      }
      const sum = await tx.answer.aggregate({ where: { attemptId }, _sum: { earnedPoints: true } });
      await tx.attempt.update({ where: { id: attemptId }, data: { score: sum._sum.earnedPoints ?? 0 } });
    });
  }
  console.log(`\n재채점 완료: 답안 ${changed.length}건, 응시 ${attemptIds.length}건 점수 갱신.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
