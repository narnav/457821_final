-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN     "dailyCommitmentMinutes" INTEGER,
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "goal" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
