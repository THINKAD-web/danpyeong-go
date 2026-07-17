/**
 * 6자리 shortCode + play rate limit 모킹 검증 (실제 DB/Slack 불필요).
 * 실행: npx tsx scripts/verify-short-code.ts
 */
import {
  allocateUniqueShortCode,
  generateShortCode,
  isShortCodeShape,
} from "../src/lib/short-code";
import {
  checkPlayShortCodeRateLimit,
  hashIp,
  memoryCount,
  PLAY_SHORT_CODE_LIMIT_PER_MIN,
} from "../src/lib/play-rate-limit";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

async function main() {
  // ── 형태 판별 ────────────────────────────────────────────
  assert(isShortCodeShape("482931") === true, "6-digit is short code");
  assert(isShortCodeShape("4829310") === true, "7-digit fallback is short code");
  assert(isShortCodeShape("clxyzcuidtoken123456789") === false, "cuid is not short code");
  assert(isShortCodeShape("48293") === false, "5-digit is not short code");

  // ── 생성: 숫자만, 길이 ───────────────────────────────────
  const samples = Array.from({ length: 50 }, () => generateShortCode(6));
  assert(
    samples.every((c) => /^\d{6}$/.test(c)),
    "generateShortCode(6) always 6 digits"
  );
  assert(new Set(samples).size > 1, "generateShortCode produces variety");

  // ── 유니크 할당 (모킹 exists) ────────────────────────────
  const taken = new Set<string>(["000000", "111111"]);
  let calls = 0;
  const code = await allocateUniqueShortCode(
    { test: { findUnique: async () => null } } as never,
    {
      exists: async (c) => {
        calls += 1;
        return taken.has(c);
      },
    }
  );
  assert(/^\d{6,7}$/.test(code), "allocated code is 6-7 digits");
  assert(!taken.has(code), "allocated code not in taken set");
  assert(calls >= 1, "exists was consulted");

  // 강제 충돌 → 7자리 폴백
  const alwaysTaken6 = new Set<string>();
  const code7 = await allocateUniqueShortCode(
    { test: { findUnique: async () => null } } as never,
    {
      exists: async (c) => {
        if (c.length === 6) {
          alwaysTaken6.add(c);
          return true; // 6자리는 전부 충돌
        }
        return false;
      },
    }
  );
  assert(code7.length === 7, "falls back to 7 digits after 6-digit collisions");

  // ── rate limit: 5회 허용, 6번째 차단 ─────────────────────
  const store = new Map<string, number[]>();
  const fakeDb = {
    playCodeAttempt: {
      count: async () => 0,
      create: async () => ({ id: "x" }),
    },
  };
  const ip = "203.0.113.10";
  let allowed = 0;
  let denied = 0;
  for (let i = 0; i < PLAY_SHORT_CODE_LIMIT_PER_MIN + 2; i++) {
    const r = await checkPlayShortCodeRateLimit(ip, {
      prisma: fakeDb as never,
      memoryStore: store,
      now: () => 1_000_000 + i, // same window
    });
    if (r.ok) allowed += 1;
    else denied += 1;
  }
  assert(allowed === PLAY_SHORT_CODE_LIMIT_PER_MIN, `allows exactly ${PLAY_SHORT_CODE_LIMIT_PER_MIN}`);
  assert(denied === 2, "denies after limit");
  assert(memoryCount(hashIp(ip), 1_000_000 + 10, store) === PLAY_SHORT_CODE_LIMIT_PER_MIN, "memory bucket size");

  // DB가 이미 limit이면 in-memory 여유와 무관하게 차단
  const store2 = new Map<string, number[]>();
  const rDb = await checkPlayShortCodeRateLimit("198.51.100.1", {
    prisma: {
      playCodeAttempt: {
        count: async () => PLAY_SHORT_CODE_LIMIT_PER_MIN,
        create: async () => {
          throw new Error("should not create");
        },
      },
    } as never,
    memoryStore: store2,
    now: () => 2_000_000,
  });
  assert(rDb.ok === false && rDb.status === 429, "DB count at limit → 429");

  // cuid 경로는 isShortCodeShape로 제외됨 — 호출부 계약만 문서화
  assert(isShortCodeShape("cl9abc") === false, "shareToken path skips short-code RL");

  console.log("\nAll short-code verify cases passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
