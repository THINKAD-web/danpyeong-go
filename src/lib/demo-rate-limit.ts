// 공개 데모 샘플 서빙 — Claude 비용 없음. 서버 부하만 완화.
//
//   DEMO_AI_HOURLY_LIMIT_PER_IP  (기본 20) — IP당 시간당 호출
//
// DemoAiUsageLog는 이용 현황 파악용으로 유지한다.

import { createHash } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export const DEMO_MAX_QUESTIONS = 3;

function getLimit(envKey: string, defaultVal: number): number {
  const v = process.env[envKey];
  if (!v) return defaultVal;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

export function getDemoLimits() {
  return {
    perIpPerHour: getLimit("DEMO_AI_HOURLY_LIMIT_PER_IP", 20),
  };
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function clientIpFromHeaders(headers: {
  get(name: string): string | null;
}): string {
  const xf = headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

function hourAgo(now = new Date()): Date {
  return new Date(now.getTime() - 60 * 60 * 1000);
}

/** count를 1~DEMO_MAX_QUESTIONS로 강제 */
export function clampDemoCount(count: number): number {
  if (!Number.isFinite(count)) return DEMO_MAX_QUESTIONS;
  return Math.min(DEMO_MAX_QUESTIONS, Math.max(1, Math.floor(count)));
}

const inProgress = new Set<string>();

export type DemoRateLimitDeps = {
  prisma?: Pick<PrismaClient, "demoAiUsageLog">;
  now?: () => Date;
  inProgressSet?: Set<string>;
};

export type DemoRateLimitResult =
  | { ok: true; ipHash: string }
  | { ok: false; status: 429; error: string; hint?: string };

export async function checkDemoRateLimit(
  ip: string,
  deps: DemoRateLimitDeps = {}
): Promise<DemoRateLimitResult> {
  const limits = getDemoLimits();
  const ipHash = hashIp(ip);
  const progress = deps.inProgressSet ?? inProgress;
  const db = deps.prisma ?? prisma;
  const since = hourAgo(deps.now?.() ?? new Date());

  if (progress.has(ipHash)) {
    return {
      ok: false,
      status: 429,
      error: "이미 문항을 불러오고 있어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  const ipCount = await db.demoAiUsageLog.count({
    where: { ipHash, createdAt: { gte: since } },
  });

  if (ipCount >= limits.perIpPerHour) {
    return {
      ok: false,
      status: 429,
      error: `잠시 요청이 많아요. 한 시간에 ${limits.perIpPerHour}회까지 체험할 수 있어요.`,
      hint: "가입하면 제한 없이 문항을 만들고 평가로 배포할 수 있어요.",
    };
  }

  return { ok: true, ipHash };
}

export function markDemoInProgress(ipHash: string, set: Set<string> = inProgress) {
  set.add(ipHash);
}

export function clearDemoInProgress(ipHash: string, set: Set<string> = inProgress) {
  set.delete(ipHash);
}

export async function logDemoAiUsage(
  params: {
    ipHash: string;
    unitId?: string;
    model: string;
    questionCount: number;
    questionType: string;
  },
  db: Pick<PrismaClient, "demoAiUsageLog"> = prisma
): Promise<void> {
  await db.demoAiUsageLog.create({ data: params });
}
