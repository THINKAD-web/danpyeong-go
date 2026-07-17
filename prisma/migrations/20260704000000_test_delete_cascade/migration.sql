-- 교사의 Test 삭제 기능을 지원하기 위해 관련 FK를 CASCADE로 변경한다.
-- Test 삭제 시: TestQuestion(기존 CASCADE 유지) + Attempt(RESTRICT -> CASCADE)가
-- 함께 삭제되고, Attempt 삭제 시 Answer(기존 CASCADE 유지)가 함께 삭제된다.
-- Answer -> TestQuestion(RESTRICT -> CASCADE)도 함께 변경한다: RESTRICT는
-- Postgres에서 즉시(같은 문장 내 다른 경로로 나중에 지워지더라도) 체크되므로,
-- Test 삭제 캐스케이드가 TestQuestion을 먼저 지우려는 순간 아직 남아있는
-- Answer 때문에 실패할 수 있다. 이를 막기 위해 Answer -> TestQuestion도
-- CASCADE로 바꿔 두 경로 중 어느 쪽이 먼저 실행되어도 안전하게 한다.
--
-- 주의: Question(문항 원본, 문제은행)은 이 변경과 무관하며 그대로 보존된다.
-- TestQuestion -> Question FK는 건드리지 않았다.

-- DropForeignKey
ALTER TABLE "Attempt" DROP CONSTRAINT "Attempt_testId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_testQuestionId_fkey";

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_testQuestionId_fkey" FOREIGN KEY ("testQuestionId") REFERENCES "TestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
