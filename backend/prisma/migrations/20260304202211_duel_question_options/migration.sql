-- AlterTable
ALTER TABLE "DuelQuestion" ADD COLUMN     "explanation" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "options" JSONB;
