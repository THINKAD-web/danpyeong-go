-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'SCHOOL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN "planStartedAt" TIMESTAMP(3),
ADD COLUMN "planExpiresAt" TIMESTAMP(3);
