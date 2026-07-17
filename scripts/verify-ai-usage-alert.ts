/**
 * AI 사용량 Slack 알림 모킹 검증 — 실제 Slack/DB 접촉 없음.
 * 실행: npx tsx scripts/verify-ai-usage-alert.ts
 * 또는: npm run verify:ai-usage-alert
 */
import {
  maybeNotifyAiGlobalThreshold,
  shouldAlertAiGlobalUsage,
  seoulDayKey,
} from "../src/lib/ai-usage-alert";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function main() {
  // ── 임계치 판정 ──────────────────────────────────────────
  assert(shouldAlertAiGlobalUsage(400, 500) === true, "80% (400/500) triggers");
  assert(shouldAlertAiGlobalUsage(399, 500) === false, "79.8% (399/500) does not trigger");
  assert(shouldAlertAiGlobalUsage(0, 500) === false, "0% does not trigger");
  assert(shouldAlertAiGlobalUsage(500, 500) === true, "100% triggers");
  assert(shouldAlertAiGlobalUsage(1, 0) === false, "limit 0 does not trigger");

  assert(/^\d{4}-\d{2}-\d{2}$/.test(seoulDayKey()), "seoulDayKey format YYYY-MM-DD");

  // ── 80% → 웹훅 호출 ─────────────────────────────────────
  let fetchCalls = 0;
  let claimedDays: string[] = [];
  const result80 = await maybeNotifyAiGlobalThreshold(400, 500, {
    getWebhookUrl: () => "https://hooks.slack.example/test",
    claimDay: async (_key, day) => {
      claimedDays.push(day);
      return true;
    },
    fetchFn: async () => {
      fetchCalls += 1;
      return new Response("ok", { status: 200 });
    },
  });
  assert(result80.attempted && result80.sent, "80% sends webhook");
  assert(fetchCalls === 1, "fetch called once at 80%");
  assert(claimedDays.length === 1, "claimDay called once at 80%");

  // ── 79% → 웹훅 미호출 ───────────────────────────────────
  fetchCalls = 0;
  const result79 = await maybeNotifyAiGlobalThreshold(399, 500, {
    getWebhookUrl: () => "https://hooks.slack.example/test",
    claimDay: async () => true,
    fetchFn: async () => {
      fetchCalls += 1;
      return new Response("ok", { status: 200 });
    },
  });
  assert(!result79.attempted && !result79.sent, "79% does not attempt");
  assert(fetchCalls === 0, "fetch not called at 79%");

  // ── 같은 날 중복 방지 ───────────────────────────────────
  fetchCalls = 0;
  const resultDup = await maybeNotifyAiGlobalThreshold(450, 500, {
    getWebhookUrl: () => "https://hooks.slack.example/test",
    claimDay: async () => false,
    fetchFn: async () => {
      fetchCalls += 1;
      return new Response("ok", { status: 200 });
    },
  });
  assert(resultDup.attempted && !resultDup.sent, "dedupe skips send");
  assert(fetchCalls === 0, "fetch not called when already claimed");

  // ── 웹훅 실패해도 throw 없음 (API 응답에 영향 없음) ─────
  let threw = false;
  try {
    const resultFail = await maybeNotifyAiGlobalThreshold(400, 500, {
      getWebhookUrl: () => "https://hooks.slack.example/test",
      claimDay: async () => true,
      fetchFn: async () => {
        throw new Error("network down");
      },
      logError: () => {},
    });
    assert(resultFail.attempted && !resultFail.sent, "webhook failure is swallowed");
  } catch {
    threw = true;
  }
  assert(!threw, "notify never throws on webhook failure");

  // ── 웹훅 URL 미설정 → no-op ──────────────────────────────
  fetchCalls = 0;
  const resultNoUrl = await maybeNotifyAiGlobalThreshold(400, 500, {
    getWebhookUrl: () => undefined,
    claimDay: async () => true,
    fetchFn: async () => {
      fetchCalls += 1;
      return new Response("ok", { status: 200 });
    },
  });
  assert(!resultNoUrl.attempted && !resultNoUrl.sent, "missing webhook url is no-op");
  assert(fetchCalls === 0, "fetch not called without webhook url");

  console.log("\nAll ai-usage-alert verify cases passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
