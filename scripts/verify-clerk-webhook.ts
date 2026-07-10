/**
 * Clerk 웹훅 모킹 검증 — 실제 DB 접촉 없음.
 * 실행: npx tsx scripts/verify-clerk-webhook.ts
 */
import {
  EMPTY_DELETION_SUMMARY,
  type TeacherDeletionSummary,
} from "../src/lib/teacher-deletion";
import { handleClerkWebhookRequest } from "../src/lib/clerk-webhook";

const WEBHOOK_SECRET = "whsec_verify_test_secret";
const SAMPLE_SUMMARY: TeacherDeletionSummary = {
  users: 1,
  classrooms: 2,
  tests: 3,
  questions: 10,
  attempts: 5,
  answers: 20,
  testQuestions: 8,
  choices: 40,
  aiUsageLogs: 4,
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function main() {
  // 1) 유효 서명 + user.deleted → 삭제 로직 도달
  let deleteInvoked = false;
  const case1 = await handleClerkWebhookRequest(
    JSON.stringify({ type: "user.deleted", data: { id: "user_del_1" } }),
    {
      svixId: "msg_1",
      svixTimestamp: "1710000000",
      svixSignature: "v1,valid",
    },
    {
      webhookSecret: WEBHOOK_SECRET,
      verify: () => ({ type: "user.deleted", data: { id: "user_del_1" } }),
      deleteTeacher: async (clerkId) => {
        deleteInvoked = true;
        assert(clerkId === "user_del_1", "case1 clerkId passed to delete");
        return { found: true, summary: SAMPLE_SUMMARY };
      },
    }
  );
  assert(case1.status === 200, "case1 status 200");
  if (case1.status === 200) {
    assert(case1.deleted === true, "case1 deleted true");
  }
  assert(deleteInvoked, "case1 deleteTeacher invoked");

  // 2) 서명 불일치 → 400
  const case2 = await handleClerkWebhookRequest(
    "{}",
    {
      svixId: "msg_2",
      svixTimestamp: "1710000000",
      svixSignature: "v1,bad",
    },
    {
      webhookSecret: WEBHOOK_SECRET,
      verify: () => {
        throw new Error("invalid signature");
      },
    }
  );
  assert(case2.status === 400, "case2 status 400");
  assert(
    case2.status === 400 && case2.error === "invalid_signature",
    "case2 invalid_signature"
  );

  // 3) 존재하지 않는 clerkId → 200 (멱등)
  const case3 = await handleClerkWebhookRequest(
    JSON.stringify({ type: "user.deleted", data: { id: "user_missing" } }),
    {
      svixId: "msg_3",
      svixTimestamp: "1710000000",
      svixSignature: "v1,valid",
    },
    {
      webhookSecret: WEBHOOK_SECRET,
      verify: () => ({ type: "user.deleted", data: { id: "user_missing" } }),
      deleteTeacher: async () => ({ found: false, summary: EMPTY_DELETION_SUMMARY }),
    }
  );
  assert(case3.status === 200, "case3 status 200");
  if (case3.status === 200) {
    assert(case3.deleted === false, "case3 deleted false");
  }

  // 4) user.created 등 다른 이벤트 → 200 무시
  let deleteOnOtherEvent = false;
  const case4 = await handleClerkWebhookRequest(
    JSON.stringify({ type: "user.created", data: { id: "user_new" } }),
    {
      svixId: "msg_4",
      svixTimestamp: "1710000000",
      svixSignature: "v1,valid",
    },
    {
      webhookSecret: WEBHOOK_SECRET,
      verify: () => ({ type: "user.created", data: { id: "user_new" } }),
      deleteTeacher: async () => {
        deleteOnOtherEvent = true;
        return { found: false, summary: EMPTY_DELETION_SUMMARY };
      },
    }
  );
  assert(case4.status === 200, "case4 status 200");
  if (case4.status === 200) {
    assert(case4.eventType === "user.created", "case4 eventType user.created");
  }
  assert(!deleteOnOtherEvent, "case4 delete not invoked");

  console.log("\nAll 4 clerk webhook cases passed (mocked, no DB).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
