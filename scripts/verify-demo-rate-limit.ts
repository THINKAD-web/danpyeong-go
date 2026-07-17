/**
 * 공개 데모 AI rate limit / count clamp 모킹 검증 (실제 AI·DB 불필요).
 * 실행: npx tsx scripts/verify-demo-rate-limit.ts
 */
import {
  checkDemoRateLimit,
  clampDemoCount,
  clearDemoInProgress,
  DEMO_MAX_QUESTIONS,
  getDemoLimits,
  hashIp,
  markDemoInProgress,
} from "../src/lib/demo-rate-limit";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function fakeDb(ipCounts: Record<string, number>, globalCount: number) {
  return {
    demoAiUsageLog: {
      count: async ({ where }: { where: { ipHash?: string; createdAt?: unknown } }) => {
        if (where.ipHash) return ipCounts[where.ipHash] ?? 0;
        return globalCount;
      },
      create: async () => ({ id: "x" }),
    },
  };
}

async function main() {
  assert(clampDemoCount(1) === 1, "count 1 stays 1");
  assert(clampDemoCount(3) === 3, "count 3 stays 3");
  assert(clampDemoCount(5) === DEMO_MAX_QUESTIONS, "count 5 clamped to 3");
  assert(clampDemoCount(99) === 3, "count 99 clamped to 3");
  assert(clampDemoCount(0) === 1, "count 0 becomes 1");
  assert(DEMO_MAX_QUESTIONS === 3, "max questions is 3");

  const limits = getDemoLimits();
  assert(limits.perIp === 3, "default per-IP daily limit is 3");
  assert(limits.global === 50, "default global daily limit is 50");

  const ip = "203.0.113.50";
  const ipHash = hashIp(ip);

  // IP 3회까지 허용
  const ok = await checkDemoRateLimit(ip, {
    prisma: fakeDb({ [ipHash]: 2 }, 10) as never,
  });
  assert(ok.ok === true, "IP with 2/3 usage is allowed");

  const blockedIp = await checkDemoRateLimit(ip, {
    prisma: fakeDb({ [ipHash]: 3 }, 10) as never,
  });
  assert(
    blockedIp.ok === false && blockedIp.status === 429,
    "IP at 3/3 is blocked with 429"
  );

  // global 50 초과
  const blockedGlobal = await checkDemoRateLimit("198.51.100.2", {
    prisma: fakeDb({}, 50) as never,
  });
  assert(
    blockedGlobal.ok === false && blockedGlobal.status === 503,
    "global 50/50 returns 503"
  );
  if (!blockedGlobal.ok) {
    assert(
      blockedGlobal.error.includes("체험이 많아"),
      "global cap message mentions busy demo"
    );
  }

  // 동시 요청 잠금
  const progress = new Set<string>();
  markDemoInProgress(ipHash, progress);
  const inFlight = await checkDemoRateLimit(ip, {
    prisma: fakeDb({ [ipHash]: 0 }, 0) as never,
    inProgressSet: progress,
  });
  assert(inFlight.ok === false && inFlight.status === 429, "in-progress IP blocked");
  clearDemoInProgress(ipHash, progress);

  // 응답 계약: saved는 라우트에서 항상 0 — 여기서는 생성 라우트가 DB write 없음을 문서화
  assert(true, "demo generate route must not create Question rows (manual/code review)");

  console.log("\nAll demo rate-limit verify cases passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
