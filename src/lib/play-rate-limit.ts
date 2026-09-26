// 6자리 shortCode 응시 시작 rate limit (docs/PHASE2-5_지시서.md 3-4, 결정 R1)
//
// 두 개의 버킷으로 나눈다:
//  1) 틀린 코드(없음·미배포·마감) — IP당 분당 5회. 브루트포스 방어의 핵심.
//     코드별로 세면 코드를 바꿀 때마다 한도가 새로 생겨 방어가 무력화되므로 반드시 IP 단위.
//  2) 맞는 코드로 응시 시작 — (시험 + IP)당 분당 30회. 한 교실이 같은 와이파이(IP)로
//     동시에 들어와도 막히지 않게 한다. 다른 시험은 별도 카운트.
// - shortCode 형태(6~7자리 숫자) 요청에만 적용 (cuid shareToken 은 키스페이스가 커서 제외)
// - in-memory 빠른 경로 + PlayCodeAttempt DB 로 인스턴스 간 폴백
//   (PlayCodeAttempt.ipHash 에는 버킷 키의 해시를 저장한다: 실패 = hash(ip), 시작 = hash(ip|testId))

import { createHash } from "crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export const PLAY_CODE_FAILURE_LIMIT_PER_MIN = 5;
export const PLAY_START_LIMIT_PER_MIN = 30;
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

export function startBucketKey(ip: string, testId: string): string {
  return hashIp(`${ip}|${testId}`);
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

const DENIED: PlayRateLimitResult = {
  ok: false,
  status: 429,
  error: "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.",
};

/** 버킷이 한도에 도달했는지 (기록하지 않음). DB 오류 시 in-memory 만으로 판정 */
async function isBucketFull(
  key: string,
  limit: number,
  deps: PlayRateLimitDeps
): Promise<boolean> {
  const now = deps.now?.() ?? Date.now();
  const store = deps.memoryStore ?? memoryBuckets;
  if (memoryCount(key, now, store) >= limit) return true;
  const db = deps.prisma ?? prisma;
  try {
    const recent = await db.playCodeAttempt.count({
      where: { ipHash: key, createdAt: { gte: new Date(now - PLAY_SHORT_CODE_WINDOW_MS) } },
    });
    return recent >= limit;
  } catch (err) {
    console.error("[play-rate-limit] DB count failed — using memory only", err);
    return false;
  }
}

async function recordBucket(key: string, deps: PlayRateLimitDeps): Promise<void> {
  const now = deps.now?.() ?? Date.now();
  memoryRecord(key, now, deps.memoryStore ?? memoryBuckets);
  const db = deps.prisma ?? prisma;
  try {
    await db.playCodeAttempt.create({ data: { ipHash: key } });
  } catch (err) {
    console.error("[play-rate-limit] DB record failed — using memory only", err);
  }
}

/** 코드 조회 전: 이 IP 의 최근 틀린 코드 입력이 한도에 도달했으면 차단 */
export async function checkPlayCodeFailureLimit(
  ip: string,
  deps: PlayRateLimitDeps = {}
): Promise<PlayRateLimitResult> {
  const limit = deps.limit ?? PLAY_CODE_FAILURE_LIMIT_PER_MIN;
  return (await isBucketFull(hashIp(ip), limit, deps)) ? DENIED : { ok: true };
}

/** 틀린 코드(없음·미배포·마감) 입력 기록 */
export async function recordPlayCodeFailure(
  ip: string,
  deps: PlayRateLimitDeps = {}
): Promise<void> {
  await recordBucket(hashIp(ip), deps);
}

/** 맞는 코드로 응시 시작: (시험 + IP) 버킷 확인 후 기록 */
export async function checkPlayStartLimit(
  ip: string,
  testId: string,
  deps: PlayRateLimitDeps = {}
): Promise<PlayRateLimitResult> {
  const limit = deps.limit ?? PLAY_START_LIMIT_PER_MIN;
  const key = startBucketKey(ip, testId);
  if (await isBucketFull(key, limit, deps)) return DENIED;
  await recordBucket(key, deps);
  return { ok: true };
}
