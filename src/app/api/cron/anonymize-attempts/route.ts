import { NextRequest, NextResponse } from "next/server";
import { handleAnonymizeCronRequest } from "@/lib/anonymize-cron";

// GET /api/cron/anonymize-attempts
// Vercel Cron 전용 — Authorization: Bearer CRON_SECRET 검증.
// POST 사용 금지(보안 리스크).
export async function GET(req: NextRequest) {
  const result = await handleAnonymizeCronRequest(
    req.headers.get("authorization")
  );

  if (result.status === 401) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (result.status === 500) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: result.success,
    anonymizedCount: result.anonymizedCount,
    executedAt: result.executedAt,
    ...(result.skipped ? { skipped: true, reason: result.reason } : {}),
  });
}
