// AI 일일 global cap 사용률 임계치 Slack 알림
//
// - AI_DAILY_LIMIT_GLOBAL 대비 80% 이상일 때 운영 Slack 웹훅으로 알림
// - 같은 날(Asia/Seoul) 중복 발송 방지: OpsAlertDay (key, day) 유니크
// - 웹훅 미설정·전송 실패는 절대 본 API를 실패시키지 않음

import { prisma } from "./prisma";

export const AI_GLOBAL_ALERT_KEY = "ai_global_80";
export const AI_GLOBAL_ALERT_RATIO = 0.8;

export type AiUsageAlertDeps = {
  getWebhookUrl?: () => string | undefined;
  claimDay?: (key: string, day: string) => Promise<boolean>;
  fetchFn?: typeof fetch;
  now?: () => Date;
  logError?: (message: string, err?: unknown) => void;
};

export function seoulDayKey(date: Date = new Date()): string {
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function shouldAlertAiGlobalUsage(
  globalCount: number,
  globalLimit: number,
  ratio = AI_GLOBAL_ALERT_RATIO
): boolean {
  if (!Number.isFinite(globalCount) || !Number.isFinite(globalLimit) || globalLimit <= 0) {
    return false;
  }
  return globalCount / globalLimit >= ratio;
}

async function defaultClaimDay(key: string, day: string): Promise<boolean> {
  try {
    await prisma.opsAlertDay.create({ data: { key, day } });
    return true;
  } catch {
    // unique 충돌 = 이미 오늘 발송됨
    return false;
  }
}

function buildSlackPayload(globalCount: number, globalLimit: number, day: string) {
  const pct = Math.round((globalCount / globalLimit) * 100);
  const text =
    `[단평GO] AI 일일 사용량 경고\n` +
    `• 사용률: ${pct}% (${globalCount}/${globalLimit})\n` +
    `• 임계치: ${Math.round(AI_GLOBAL_ALERT_RATIO * 100)}%\n` +
    `• 기준일(Asia/Seoul): ${day}\n` +
    `• 조치: /admin 대시보드에서 사용량 확인, 필요 시 AI_DAILY_LIMIT_GLOBAL 조정`;
  return { text };
}

/**
 * global 사용률이 임계치 이상이면 Slack 웹훅 알림 (하루 1회).
 * 실패해도 throw하지 않는다.
 */
export async function maybeNotifyAiGlobalThreshold(
  globalCount: number,
  globalLimit: number,
  deps: AiUsageAlertDeps = {}
): Promise<{ attempted: boolean; sent: boolean }> {
  const logError = deps.logError ?? ((msg, err) => console.error(msg, err));

  try {
    if (!shouldAlertAiGlobalUsage(globalCount, globalLimit)) {
      return { attempted: false, sent: false };
    }

    const getWebhookUrl = deps.getWebhookUrl ?? (() => process.env.SLACK_WEBHOOK_URL);
    const webhookUrl = getWebhookUrl()?.trim();
    if (!webhookUrl) {
      return { attempted: false, sent: false };
    }

    const now = deps.now ?? (() => new Date());
    const day = seoulDayKey(now());
    const claimDay = deps.claimDay ?? defaultClaimDay;
    const claimed = await claimDay(AI_GLOBAL_ALERT_KEY, day);
    if (!claimed) {
      return { attempted: true, sent: false };
    }

    const fetchFn = deps.fetchFn ?? fetch;
    const res = await fetchFn(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackPayload(globalCount, globalLimit, day)),
    });

    if (!res.ok) {
      logError(`[ai-usage-alert] Slack webhook HTTP ${res.status}`);
      return { attempted: true, sent: false };
    }

    return { attempted: true, sent: true };
  } catch (err) {
    logError("[ai-usage-alert] notify failed (ignored)", err);
    return { attempted: true, sent: false };
  }
}
