import { Webhook } from "svix";
import {
  deleteTeacherDataByClerkId,
  type TeacherDeletionSummary,
} from "./teacher-deletion";

export type ClerkWebhookEvent = {
  type: string;
  data: {
    id?: string;
    deleted?: boolean;
  };
};

export type ClerkWebhookHeaders = {
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
};

export type ClerkWebhookResult =
  | { status: 400; error: "missing_headers" | "invalid_signature" | "missing_secret" }
  | { status: 200; eventType: string; clerkId?: string; deleted?: boolean; summary?: TeacherDeletionSummary };

type VerifyFn = (
  payload: string,
  headers: Record<string, string>
) => ClerkWebhookEvent;

/**
 * Clerk 웹훅 요청을 처리한다.
 * svix 서명 검증 후 user.deleted 이벤트에서만 교사 데이터를 파기한다.
 */
export async function handleClerkWebhookRequest(
  payload: string,
  headers: ClerkWebhookHeaders,
  options?: {
    webhookSecret?: string;
    verify?: VerifyFn;
    deleteTeacher?: typeof deleteTeacherDataByClerkId;
  }
): Promise<ClerkWebhookResult> {
  const webhookSecret = options?.webhookSecret ?? process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return { status: 400, error: "missing_secret" };
  }

  const { svixId, svixTimestamp, svixSignature } = headers;
  if (!svixId || !svixTimestamp || !svixSignature) {
    return { status: 400, error: "missing_headers" };
  }

  const verify =
    options?.verify ??
    ((body, hdrs) =>
      new Webhook(webhookSecret).verify(body, hdrs) as ClerkWebhookEvent);

  let event: ClerkWebhookEvent;
  try {
    event = verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return { status: 400, error: "invalid_signature" };
  }

  if (event.type !== "user.deleted") {
    console.info(`[clerk-webhook] ignored event type=${event.type}`);
    return { status: 200, eventType: event.type };
  }

  const clerkId = event.data.id;
  if (!clerkId) {
    console.warn("[clerk-webhook] user.deleted without data.id — treating as no-op");
    return { status: 200, eventType: event.type };
  }

  const deleteTeacher = options?.deleteTeacher ?? deleteTeacherDataByClerkId;
  const { found, summary } = await deleteTeacher(clerkId);

  if (!found) {
    console.info(`[clerk-webhook] user.deleted clerkId=${clerkId} — user not in DB (idempotent 200)`);
    return { status: 200, eventType: event.type, clerkId, deleted: false };
  }

  console.info(
    `[clerk-webhook] user.deleted clerkId=${clerkId} summary=${JSON.stringify(summary)}`
  );

  return {
    status: 200,
    eventType: event.type,
    clerkId,
    deleted: true,
    summary,
  };
}
