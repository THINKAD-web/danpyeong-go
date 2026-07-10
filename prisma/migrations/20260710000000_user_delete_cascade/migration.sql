-- Clerk user.deleted 웹훅 시 교사(User) 삭제로 전체 교사 데이터가 파기되도록 FK를 CASCADE로 변경한다.
-- 개인정보처리방침 제3조 1항(탈퇴 시 지체 없이 파기)의 DB 레벨 근거.
--
-- User 직접 FK: Classroom, Question, Test, AiUsageLog → CASCADE
-- Question 삭제 시 TestQuestion 연결도 CASCADE (authorId 귀속 문항 파기)
-- Test/Attempt/Answer 경로는 20260704000000_test_delete_cascade 에서 이미 CASCADE 처리됨.
-- Test.classroomId / Attempt.classroomId 는 기존 SET NULL 유지.
-- Subject/Unit(교육과정)은 교사 소유 데이터가 아니므로 변경하지 않는다.

-- DropForeignKey
ALTER TABLE "Classroom" DROP CONSTRAINT "Classroom_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "AiUsageLog" DROP CONSTRAINT "AiUsageLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "TestQuestion" DROP CONSTRAINT "TestQuestion_questionId_fkey";

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiUsageLog" ADD CONSTRAINT "AiUsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
