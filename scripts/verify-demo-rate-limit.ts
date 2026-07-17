/**
 * 공개 데모 rate limit 모킹 검증 (샘플 서빙 기준 — 시간당 IP 한도).
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

async function main() {
  assert(clampDemoCount(5) === DEMO_MAX_QUESTIONS, "count clamped to 3");
  const limits = getDemoLimits();
  assert(limits.perIpPerHour === 20, "default hourly per-IP is 20");

  const ip = "203.0.113.50";
  const ipHash = hashIp(ip);

  const ok = await checkDemoRateLimit(ip, {
    prisma: {
      demoAiUsageLog: {
        count: async () => 19,
        create: async () => ({ id: "x" }),
      },
    } as never,
  });
  assert(ok.ok === true, "19/20 allowed");

  const blocked = await checkDemoRateLimit(ip, {
    prisma: {
      demoAiUsageLog: {
        count: async () => 20,
        create: async () => ({ id: "x" }),
      },
    } as never,
  });
  assert(blocked.ok === false && blocked.status === 429, "20/20 blocked");

  const progress = new Set<string>();
  markDemoInProgress(ipHash, progress);
  const inFlight = await checkDemoRateLimit(ip, {
    prisma: {
      demoAiUsageLog: {
        count: async () => 0,
        create: async () => ({ id: "x" }),
      },
    } as never,
    inProgressSet: progress,
  });
  assert(inFlight.ok === false, "in-progress blocked");
  clearDemoInProgress(ipHash, progress);

  console.log("\nAll demo rate-limit verify cases passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
