// AI 생성 요청 제한 — 비용 방어 및 악용 차단
//
// 제한값은 환경변수로 설정 가능:
//   AI_DAILY_LIMIT_PER_USER  (기본 30) — 교사 1인 일일 호출 횟수
//   AI_DAILY_LIMIT_GLOBAL    (기본 500) — 서비스 전체 일일 호출 상한
//
// 테스트 시 낮은 값으로 설정 가능:
//   AI_DAILY_LIMIT_PER_USER=2 AI_DAILY_LIMIT_GLOBAL=5 npm run dev

import { prisma } from "./prisma";

// ── 설정값 ───────────────────────────────────────────────
function getLimit(envKey: string, defaultVal: number): number {
  const v = process.env[envKey];
  if (!v) return defaultVal;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

export function getLimits() {
  return {
    perUser: getLimit("AI_DAILY_LIMIT_PER_USER", 30),
    global: getLimit("AI_DAILY_LIMIT_GLOBAL", 500),
  };
}

// ── 동시 요청 throttle (in-memory) ────────────────────────
// 같은 교사가 AI 생성 중에 중복 요청하면 429 반환.
// 악의적 연속 호출(초당 다수) 차단.
const inProgress = new Set<string>();

export function isInProgress(userId: string): boolean {
  return inProgress.has(userId);
}

export function markInProgress(userId: string): void {
  inProgress.add(userId);
}

export function clearInProgress(userId: string): void {
  inProgress.delete(userId);
}

// ── 일일 사용량 조회 ──────────────────────────────────────
function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getUserDailyCount(userId: string): Promise<number> {
  return prisma.aiUsageLog.count({
    where: { userId, createdAt: { gte: todayStart() } },
  });
}

export async function getGlobalDailyCount(): Promise<number> {
  return prisma.aiUsageLog.count({
    where: { createdAt: { gte: todayStart() } },
  });
}

// ── 사용량 기록 ────────────────────────────────────────────
export async function logAiUsage(params: {
  userId: string;
  unitId?: string;
  model: string;
  questionCount: number;
  questionType: string;
}): Promise<void> {
  await prisma.aiUsageLog.create({ data: params });
}

// ── 응답 메시지 ───────────────────────────────────────────
export type RateLimitResult =
  | { ok: true }
  | { ok: false; status: 429 | 503; error: string; hint: string };

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const limits = getLimits();

  if (isInProgress(userId)) {
    return {
      ok: false,
      status: 429,
      error: "이미 문항을 생성하고 있어요. 잠시 후 다시 시도해 주세요.",
      hint: "직접 문항 추가로 지금 바로 작성할 수 있어요.",
    };
  }

  const [userCount, globalCount] = await Promise.all([
    getUserDailyCount(userId),
    getGlobalDailyCount(),
  ]);

  if (userCount >= limits.perUser) {
    return {
      ok: false,
      status: 429,
      error: `오늘 AI 생성 한도(${limits.perUser}회)에 도달했어요. 내일 다시 시도해 주세요.`,
      hint: "직접 문항 추가로 지금 바로 작성할 수 있어요.",
    };
  }

  if (globalCount >= limits.global) {
    return {
      ok: false,
      status: 503,
      error: "현재 AI 생성 요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
      hint: "직접 문항 추가로 지금 바로 작성할 수 있어요.",
    };
  }

  return { ok: true };
}
