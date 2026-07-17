/**
 * 데모 샘플 서빙 로직 모킹 검증 — 실제 DB/Claude 불필요.
 * 실행: npx tsx scripts/verify-demo-samples.ts
 */
import {
  assertNoAnswerLeak,
  pickDemoSamples,
  toPublicDemoQuestion,
  type DemoSampleRow,
} from "../src/lib/demo-samples";
import {
  checkDemoRateLimit,
  clampDemoCount,
  getDemoLimits,
  hashIp,
} from "../src/lib/demo-rate-limit";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function sample(
  overrides: Partial<DemoSampleRow> & Pick<DemoSampleRow, "id" | "unitId">
): DemoSampleRow {
  return {
    type: "MULTIPLE_CHOICE",
    difficulty: "MEDIUM",
    stem: "2 + 3 = ?",
    choicesJson: [
      { order: 1, text: "4", isCorrect: false },
      { order: 2, text: "5", isCorrect: true },
      { order: 3, text: "6", isCorrect: false },
      { order: 4, text: "7", isCorrect: false },
    ],
    answerKeywords: [],
    explanation: "2에 3을 더하면 5입니다.",
    ...overrides,
  };
}

async function main() {
  // ── unitId 매칭 픽 ───────────────────────────────────────
  const unitA = [
    sample({ id: "a1", unitId: "unit-a" }),
    sample({ id: "a2", unitId: "unit-a", stem: "다른 문항" }),
    sample({ id: "a3", unitId: "unit-a", type: "SHORT_ANSWER", choicesJson: [] }),
  ];
  const picked = pickDemoSamples(unitA, 2, "MULTIPLE_CHOICE");
  assert(picked.length === 2, "picks 2 samples");
  assert(
    picked.every((p) => p.unitId === "unit-a" && p.type === "MULTIPLE_CHOICE"),
    "prefers matching type for same unitId pool"
  );

  const empty = pickDemoSamples([], 3);
  assert(empty.length === 0, "empty pool returns []");

  // ── 정답 필드 응답 제외 ──────────────────────────────────
  const leaked = sample({
    id: "x",
    unitId: "u",
    answerKeywords: ["5"],
  });
  const pub = toPublicDemoQuestion(leaked);
  assert(assertNoAnswerLeak(pub), "public question has no answer leak");
  assert(pub.answerKeywords.length === 0, "answerKeywords stripped");
  assert(pub.choices.every((c) => c.isCorrect === false), "isCorrect all false");
  assert(pub.choices.some((c) => c.text === "5"), "choice texts preserved");
  assert(pub.stem === leaked.stem, "stem preserved");
  assert(pub.explanation.includes("5"), "explanation kept (no isCorrect flag)");

  // ── rate limit 완화값 ────────────────────────────────────
  assert(clampDemoCount(5) === 3, "count still clamped to 3");
  const limits = getDemoLimits();
  assert(limits.perIpPerHour === 20, "default IP hourly limit is 20");

  const ip = "203.0.113.9";
  const ipHash = hashIp(ip);
  const ok = await checkDemoRateLimit(ip, {
    prisma: {
      demoAiUsageLog: {
        count: async () => 19,
        create: async () => ({ id: "x" }),
      },
    } as never,
  });
  assert(ok.ok === true, "19/20 hourly allowed");

  const blocked = await checkDemoRateLimit(ip, {
    prisma: {
      demoAiUsageLog: {
        count: async () => 20,
        create: async () => ({ id: "x" }),
      },
    } as never,
  });
  assert(blocked.ok === false && blocked.status === 429, "20/20 hourly blocked");
  assert(ipHash.length === 32, "ip hash length");

  console.log("\nAll demo-samples verify cases passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
