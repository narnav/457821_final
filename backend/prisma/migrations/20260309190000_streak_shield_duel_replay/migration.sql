ALTER TABLE "UserProgress"
ADD COLUMN "streakShieldAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "streakShieldConsumedAt" TIMESTAMP(3);

ALTER TABLE "DuelSession"
ADD COLUMN "roundReplay" JSONB;
