-- CreateTable
CREATE TABLE "DemoSampleQuestion" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "stem" TEXT NOT NULL,
    "choicesJson" JSONB NOT NULL,
    "answerKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoSampleQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DemoSampleQuestion_unitId_idx" ON "DemoSampleQuestion"("unitId");

-- CreateIndex
CREATE INDEX "DemoSampleQuestion_unitId_type_idx" ON "DemoSampleQuestion"("unitId", "type");

-- AddForeignKey
ALTER TABLE "DemoSampleQuestion" ADD CONSTRAINT "DemoSampleQuestion_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
