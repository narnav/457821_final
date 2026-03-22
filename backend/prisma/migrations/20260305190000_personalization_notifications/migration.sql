ALTER TABLE "UserProgress"
ADD COLUMN "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "DailyPracticeLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "practicedSeconds" INTEGER NOT NULL DEFAULT 0,
  "incompleteReminderCount" INTEGER NOT NULL DEFAULT 0,
  "completeReminderSent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyPracticeLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyPracticeLog_userId_dateKey_key"
ON "DailyPracticeLog"("userId", "dateKey");

ALTER TABLE "DailyPracticeLog"
ADD CONSTRAINT "DailyPracticeLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
