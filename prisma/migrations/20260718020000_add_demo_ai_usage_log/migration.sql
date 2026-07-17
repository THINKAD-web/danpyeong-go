-- CreateTable
CREATE TABLE "DemoAiUsageLog" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "unitId" TEXT,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "questionCount" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoAiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoAiUsageLog_ipHash_createdAt_idx" ON "DemoAiUsageLog"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "DemoAiUsageLog_createdAt_idx" ON "DemoAiUsageLog"("createdAt");
