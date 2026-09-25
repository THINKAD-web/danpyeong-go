-- CreateEnum
CREATE TYPE "StudentIdMode" AS ENUM ('NAME', 'NUMBER');

-- AlterTable
ALTER TABLE "Test" ADD COLUMN "studentIdMode" "StudentIdMode" NOT NULL DEFAULT 'NAME';
