/**
 * 학기 익명화 Cron 모킹 검증 — 실제 DB 접촉 없음.
 * 실행: npm run verify:anonymize-cron
 */
import {
  anonymizeAttempts,
  createAnonymousStudentName,
  isAlreadyAnonymized,
} from "../src/lib/anonymization";
import { handleAnonymizeCronRequest } from "../src/lib/anonymize-cron";

const CRON_SECRET = "cron_verify_test_secret";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

type AttemptRow = { id: string; studentName: string; testId: string };

function createMockDb(closedBefore: Date, attempts: AttemptRow[]) {
  return {
    test: {
      findMany: async ({
        where,
      }: {
        where: { status: string; closedAt: { lt: Date } };
      }) => {
        assert(where.status === "CLOSED", "mock expects CLOSED status");
        return [{ id: "test_closed_1" }];
      },
    },
    attempt: {
      findMany: async () => [...attempts],
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: { studentName: string };
      }) => {
        const row = attempts.find((a) => a.id === where.id);
        if (row) row.studentName = data.studentName;
        return row;
      },
    },
    $transaction: async <T>(ops: Promise<T>[]) => Promise.all(ops),
  };
}

async function main() {
  // 1) CLOSED Test + anonymizeAttempts → studentName 익명화
  const attempts: AttemptRow[] = [
    { id: "attempt_001", studentName: "홍길동", testId: "test_closed_1" },
    { id: "attempt_002", studentName: "김영희", testId: "test_closed_1" },
  ];
  const beforeDate = new Date("2026-02-01T00:00:00+09:00");
  let nameIndex = 0;
  const names = ["학생_aaa111", "학생_bbb222"];
  const count = await anonymizeAttempts(
    beforeDate,
    createMockDb(beforeDate, attempts) as never,
    () => names[nameIndex++]
  );
  assert(count === 2, "case1 anonymized 2 rows");
  assert(
    attempts.every((a) => isAlreadyAnonymized(a.studentName)),
    "case1 all names anonymized"
  );
  assert(attempts[0].studentName === "학생_aaa111", "case1 first name replaced");
  assert(createAnonymousStudentName(() => "xyz999").startsWith("학생_"), "case1 name format");

  // 2) 유효 CRON_SECRET + 2월 → 200 + 변경 행 수
  let cronAnonymizeCalled = false;
  const feb = new Date("2026-02-28T00:00:00+09:00");
  const case2 = await handleAnonymizeCronRequest(
    `Bearer ${CRON_SECRET}`,
    feb,
    {
      cronSecret: CRON_SECRET,
      anonymize: async () => {
        cronAnonymizeCalled = true;
        return 5;
      },
    }
  );
  assert(case2.status === 200, "case2 status 200");
  if (case2.status === 200) {
    assert(case2.anonymizedCount === 5, "case2 anonymizedCount 5");
    assert(cronAnonymizeCalled, "case2 anonymize invoked");
  }

  // 3) 틀린 CRON_SECRET → 401
  const case3 = await handleAnonymizeCronRequest("Bearer wrong_secret", feb, {
    cronSecret: CRON_SECRET,
  });
  assert(case3.status === 401, "case3 status 401");

  // 4) 3월 → 200 + anonymizedCount 0 (스킵)
  let marchCalled = false;
  const march = new Date("2026-03-15T00:00:00+09:00");
  const case4 = await handleAnonymizeCronRequest(
    `Bearer ${CRON_SECRET}`,
    march,
    {
      cronSecret: CRON_SECRET,
      anonymize: async () => {
        marchCalled = true;
        return 99;
      },
    }
  );
  assert(case4.status === 200, "case4 status 200");
  if (case4.status === 200) {
    assert(case4.anonymizedCount === 0, "case4 anonymizedCount 0");
    assert(case4.skipped === true, "case4 skipped");
    assert(!marchCalled, "case4 anonymize not invoked");
  }

  console.log("\nAll 4 anonymize-cron cases passed (mocked, no DB).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
