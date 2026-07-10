import { NextRequest, NextResponse } from "next/server";
import { handleClerkWebhookRequest } from "@/lib/clerk-webhook";

// POST /api/webhooks/clerk
// Clerk user.deleted 웹훅 — 교사 탈퇴 시 DB 데이터 파기.
// svix 서명 검증(CLERK_WEBHOOK_SECRET)이 인증을 대체한다.
export async function POST(req: NextRequest) {
  const payload = await req.text();

  const result = await handleClerkWebhookRequest(payload, {
    svixId: req.headers.get("svix-id"),
    svixTimestamp: req.headers.get("svix-timestamp"),
    svixSignature: req.headers.get("svix-signature"),
  });

  if (result.status === 400) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  return NextResponse.json({ received: true, eventType: result.eventType });
}
