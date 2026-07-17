-- AlterTable
ALTER TABLE "Test" ADD COLUMN "shortCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Test_shortCode_key" ON "Test"("shortCode");

-- CreateIndex
CREATE INDEX "Test_shortCode_idx" ON "Test"("shortCode");

-- CreateTable
CREATE TABLE "PlayCodeAttempt" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayCodeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayCodeAttempt_ipHash_createdAt_idx" ON "PlayCodeAttempt"("ipHash", "createdAt");
