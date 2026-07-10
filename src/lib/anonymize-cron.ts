import { anonymizeAttempts } from "./anonymization";

const KST = "Asia/Seoul";

export type AnonymizeCronResult =
  | { status: 401; error: "unauthorized" }
  | { status: 500; error: string }
  | {
      status: 200;
      success: true;
      anonymizedCount: number;
      executedAt: string;
      skipped?: boolean;
      reason?: string;
    };

export function getKSTDateParts(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return { year, month };
}

/** KST 기준 학기 마감일 00:00 (2월 1일 또는 8월 1일) */
export function semesterCutoffKST(year: number, month: 2 | 8): Date {
  const iso = month === 2 ? `${year}-02-01T00:00:00+09:00` : `${year}-08-01T00:00:00+09:00`;
  return new Date(iso);
}

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

/**
 * Vercel Cron GET /api/cron/anonymize-attempts 핸들러 로직.
 * 2월·8월에만 익명화를 실행한다 (KST 기준 월).
 */
export async function handleAnonymizeCronRequest(
  authHeader: string | null,
  now: Date = new Date(),
  options?: {
    cronSecret?: string;
    anonymize?: typeof anonymizeAttempts;
  }
): Promise<AnonymizeCronResult> {
  const cronSecret = options?.cronSecret ?? process.env.CRON_SECRET;
  const token = parseBearerToken(authHeader);

  if (!cronSecret || token !== cronSecret) {
    return { status: 401, error: "unauthorized" };
  }

  const anonymize = options?.anonymize ?? anonymizeAttempts;
  const executedAt = now.toISOString();
  const { year, month } = getKSTDateParts(now);

  if (month === 2) {
    try {
      const count = await anonymize(semesterCutoffKST(year, 2));
      return { status: 200, success: true, anonymizedCount: count, executedAt };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("[anonymize-cron] February run failed:", err);
      return { status: 500, error: message };
    }
  }

  if (month === 8) {
    try {
      const count = await anonymize(semesterCutoffKST(year, 8));
      return { status: 200, success: true, anonymizedCount: count, executedAt };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("[anonymize-cron] August run failed:", err);
      return { status: 500, error: message };
    }
  }

  console.info(`[anonymize-cron] skipped month=${month} (not February or August)`);
  return {
    status: 200,
    success: true,
    anonymizedCount: 0,
    executedAt,
    skipped: true,
    reason: "not_semester_end_month",
  };
}
