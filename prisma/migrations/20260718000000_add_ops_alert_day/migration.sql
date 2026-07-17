-- CreateTable
CREATE TABLE "OpsAlertDay" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsAlertDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpsAlertDay_key_idx" ON "OpsAlertDay"("key");

-- CreateIndex
CREATE UNIQUE INDEX "OpsAlertDay_key_day_key" ON "OpsAlertDay"("key", "day");
