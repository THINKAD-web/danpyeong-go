// 공개 데모 AI 생성 비용 방어
//
//   DEMO_AI_DAILY_LIMIT_PER_IP   (기본 3)  — IP당 일일 호출
//   DEMO_AI_DAILY_LIMIT_GLOBAL   (기본 50) — 데모 전체 일일 호출
//
// AiUsageLog와 분리된 DemoAiUsageLog를 사용한다.

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
    perIp: getLimit("DEMO_AI_DAILY_LIMIT_PER_IP", 3),
    global: getLimit("DEMO_AI_DAILY_LIMIT_GLOBAL", 50),
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

function todayStart(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
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
  | { ok: false; status: 429 | 503; error: string; hint?: string };

export async function checkDemoRateLimit(
  ip: string,
  deps: DemoRateLimitDeps = {}
): Promise<DemoRateLimitResult> {
  const limits = getDemoLimits();
  const ipHash = hashIp(ip);
  const progress = deps.inProgressSet ?? inProgress;
  const db = deps.prisma ?? prisma;
  const since = todayStart(deps.now?.() ?? new Date());

  if (progress.has(ipHash)) {
    return {
      ok: false,
      status: 429,
      error: "이미 문항을 생성하고 있어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  const [ipCount, globalCount] = await Promise.all([
    db.demoAiUsageLog.count({ where: { ipHash, createdAt: { gte: since } } }),
    db.demoAiUsageLog.count({ where: { createdAt: { gte: since } } }),
  ]);

  if (ipCount >= limits.perIp) {
    return {
      ok: false,
      status: 429,
      error: `오늘 체험 한도(${limits.perIp}회)에 도달했어요. 내일 다시 시도하거나 무료로 가입해 이용해 주세요.`,
      hint: "가입하면 더 많은 문항을 만들고 평가로 배포할 수 있어요.",
    };
  }

  if (globalCount >= limits.global) {
    return {
      ok: false,
      status: 503,
      error: "지금은 체험이 많아 잠시 후 다시 시도해주세요.",
      hint: "가입하면 바로 문항을 만들 수 있어요.",
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
