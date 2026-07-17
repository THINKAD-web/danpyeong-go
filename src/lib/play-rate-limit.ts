// 6자리 shortCode 응시 시작 브루트포스 완화
//
// - shortCode 형태(6~7자리 숫자) 요청에만 적용 (cuid shareToken은 키스페이스가 커서 제외)
// - IP당 분당 5회 (SLIDING WINDOW)
// - in-memory 빠른 경로 + PlayCodeAttempt DB로 인스턴스 간 폴백
//   (Vercel 다중 인스턴스에서 in-memory만으로는 한도가 N배로 느슨해지므로 DB 병행)

import { createHash } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export const PLAY_SHORT_CODE_LIMIT_PER_MIN = 5;
export const PLAY_SHORT_CODE_WINDOW_MS = 60_000;

type MemoryBucket = number[]; // timestamps ms

const memoryBuckets = new Map<string, MemoryBucket>();

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

function prune(timestamps: number[], now: number): number[] {
  return timestamps.filter((t) => now - t < PLAY_SHORT_CODE_WINDOW_MS);
}

/** 테스트용: 현재 윈도우 내 횟수 */
export function memoryCount(
  key: string,
  now: number,
  store: Map<string, MemoryBucket> = memoryBuckets
): number {
  const next = prune(store.get(key) ?? [], now);
  store.set(key, next);
  return next.length;
}

export function memoryRecord(
  key: string,
  now: number,
  store: Map<string, MemoryBucket> = memoryBuckets
): void {
  const next = prune(store.get(key) ?? [], now);
  next.push(now);
  store.set(key, next);
}

export type PlayRateLimitDeps = {
  prisma?: Pick<PrismaClient, "playCodeAttempt">;
  now?: () => number;
  memoryStore?: Map<string, MemoryBucket>;
  limit?: number;
};

export type PlayRateLimitResult =
  | { ok: true }
  | { ok: false; status: 429; error: string };

/**
 * shortCode 형태 요청용 rate limit.
 * DB 기록 실패해도 in-memory로 제한 (가용성·보안 균형).
 */
export async function checkPlayShortCodeRateLimit(
  ip: string,
  deps: PlayRateLimitDeps = {}
): Promise<PlayRateLimitResult> {
  const now = deps.now?.() ?? Date.now();
  const limit = deps.limit ?? PLAY_SHORT_CODE_LIMIT_PER_MIN;
  const ipHash = hashIp(ip);
  const store = deps.memoryStore ?? memoryBuckets;
  const denied: PlayRateLimitResult = {
    ok: false,
    status: 429,
    error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
  };

  if (memoryCount(ipHash, now, store) >= limit) {
    return denied;
  }

  const db = deps.prisma ?? prisma;
  try {
    const since = new Date(now - PLAY_SHORT_CODE_WINDOW_MS);
    const recent = await db.playCodeAttempt.count({
      where: { ipHash, createdAt: { gte: since } },
    });
    if (recent >= limit) {
      return denied;
    }
    await db.playCodeAttempt.create({ data: { ipHash } });
  } catch (err) {
    console.error("[play-rate-limit] DB throttle failed — using memory only", err);
  }

  memoryRecord(ipHash, now, store);
  return { ok: true };
}
