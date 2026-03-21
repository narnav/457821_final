import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { comparePassword, hashPassword } from "../lib/auth.js";
import {
  createAvatarUploadUrl,
  deleteAvatarObject,
  extractAvatarKeyFromUrl,
  getAvatarPublicUrl,
} from "../lib/storage.js";
import { logError, logInfo, logWarn } from "../lib/logger.js";

export const userRouter = Router();

userRouter.use(authMiddleware);

function resolvePathKey(level: "BEGINNER" | "BASICS" | "INTERMEDIATE" | "ADVANCED"): "BEGINNER" | "ADVANCED" {
  return level === "BEGINNER" || level === "BASICS" ? "BEGINNER" : "ADVANCED";
}

function buildRecentStreakDays(dateKeys: string[], today = new Date()): boolean[] {
  const set = new Set(dateKeys);
  return Array.from({ length: 7 }, (_value, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toLocaleDateString("en-CA");
    return set.has(key);
  });
}

userRouter.get("/profile", async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      progress: {
        select: {
          goal: true,
          experienceLevel: true,
          dailyCommitmentMinutes: true,
          notificationsEnabled: true,
          onboardingCompleted: true,
        },
      },
      duelRating: {
        select: { rating: true, wins: true, losses: true, draws: true },
      },
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(user);
});

userRouter.patch("/profile", async (req: AuthenticatedRequest, res) => {
  const parsed = z
    .object({
      username: z.string().min(2).max(30).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!parsed.data.username) {
    return res.status(400).json({ error: "No profile fields provided" });
  }
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: parsed.data,
  });
  return res.json({ id: user.id, username: user.username, avatarUrl: user.avatarUrl });
});

userRouter.get("/avatar/presigned-url", async (req: AuthenticatedRequest, res) => {
  const parsed = z
    .object({
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      fileSize: z.coerce.number().int().min(1).max(5 * 1024 * 1024),
    })
    .safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid upload metadata" });
  }

  const ext = parsed.data.contentType === "image/jpeg" ? "jpg" : parsed.data.contentType === "image/png" ? "png" : "webp";
  const key = `avatars/${req.user!.userId}/${randomUUID()}.${ext}`;

  try {
    const uploadUrl = await createAvatarUploadUrl({
      key,
      contentType: parsed.data.contentType,
    });
    const publicUrl = getAvatarPublicUrl(key);
    return res.json({ uploadUrl, publicUrl, maxSizeBytes: 5 * 1024 * 1024 });
  } catch (error) {
    logError("[USER]", error, { phase: "avatar-presign", userId: req.user?.userId });
    return res.status(500).json({ error: "Unable to prepare avatar upload" });
  }
});

userRouter.patch("/avatar", async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ avatarUrl: z.string().url() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid avatar URL" });

  const nextKey = extractAvatarKeyFromUrl(parsed.data.avatarUrl);
  if (!nextKey) {
    return res.status(400).json({ error: "Avatar URL is not from configured storage bucket" });
  }

  const current = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { avatarUrl: true },
  });
  if (!current) return res.status(404).json({ error: "User not found" });

  await prisma.user.update({
    where: { id: req.user!.userId },
    data: { avatarUrl: parsed.data.avatarUrl },
  });

  if (current.avatarUrl) {
    const oldKey = extractAvatarKeyFromUrl(current.avatarUrl);
    if (oldKey && oldKey !== nextKey) {
      try {
        await deleteAvatarObject(oldKey);
      } catch (error) {
        logWarn("[USER]", "avatar:old-delete-failed", { userId: req.user?.userId, reason: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  return res.json({ avatarUrl: parsed.data.avatarUrl });
});

userRouter.get("/progress-summary", async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const [progress, duelRating, recentPractice, history] = await Promise.all([
    prisma.userProgress.findUnique({ where: { userId } }),
    prisma.duelRating.findUnique({ where: { userId } }),
    prisma.dailyPracticeLog.findMany({
      where: { userId },
      orderBy: { dateKey: "desc" },
      take: 7,
      select: { dateKey: true },
    }),
    prisma.userExerciseHistory.findMany({
      where: { userId, isCorrect: true },
      select: { exercise: { select: { lessonId: true } } },
    }),
  ]);

  const lessonsCompleted = new Set(history.map((item) => item.exercise.lessonId)).size;
  const streakDays = buildRecentStreakDays(recentPractice.map((entry) => entry.dateKey));

  return res.json({
    xpTotal: progress?.xpTotal ?? 0,
    level: progress?.level ?? 1,
    streakCurrent: progress?.streakCurrent ?? 0,
    streakDays,
    lessonsCompleted,
    duelWins: duelRating?.wins ?? 0,
    duelLosses: duelRating?.losses ?? 0,
    duelDraws: duelRating?.draws ?? 0,
    duelRating: duelRating?.rating ?? 0,
    streakShieldAvailable: progress?.streakShieldAvailable ?? false,
  });
});

userRouter.post("/onboarding", async (req: AuthenticatedRequest, res) => {
  logInfo("[ONBOARDING]", "submit:attempt", { userId: req.user?.userId });
  const parsed = z
    .object({
      goal: z.enum(["JOB", "WORK", "FUN", "PROJECT"]),
      experienceLevel: z.enum(["BEGINNER", "BASICS", "INTERMEDIATE", "ADVANCED"]),
      dailyCommitmentMinutes: z.number().int().min(10).max(60),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    logWarn("[ONBOARDING]", "submit:validation-failed", { errors: parsed.error.flatten(), userId: req.user?.userId });
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const assignedPathKey = resolvePathKey(parsed.data.experienceLevel);
    const assignedPath = await prisma.learningPath.findUnique({ where: { key: assignedPathKey } });
    if (!assignedPath) return res.status(400).json({ error: "Assigned learning path not found" });

    const updated = await prisma.userProgress.upsert({
      where: { userId: req.user!.userId },
      create: {
        userId: req.user!.userId,
        pathId: assignedPath.id,
        goal: parsed.data.goal,
        experienceLevel: parsed.data.experienceLevel,
        dailyCommitmentMinutes: parsed.data.dailyCommitmentMinutes,
        onboardingCompleted: true,
        notificationsEnabled: true,
      },
      update: {
        goal: parsed.data.goal,
        experienceLevel: parsed.data.experienceLevel,
        dailyCommitmentMinutes: parsed.data.dailyCommitmentMinutes,
        onboardingCompleted: true,
        pathId: assignedPath.id,
      },
      include: { path: true },
    });

    logInfo("[ONBOARDING]", "submit:success", { userId: req.user?.userId, pathKey: updated.path.key });
    return res.json({
      onboardingCompleted: updated.onboardingCompleted,
      pathKey: updated.path.key,
      goal: updated.goal,
      experienceLevel: updated.experienceLevel,
      dailyCommitmentMinutes: updated.dailyCommitmentMinutes,
      notificationsEnabled: updated.notificationsEnabled,
    });
  } catch (error) {
    logError("[ONBOARDING]", error, { phase: "submit", userId: req.user?.userId });
    return res.status(500).json({ error: "Failed to save onboarding" });
  }
});

userRouter.get("/preferences", async (req: AuthenticatedRequest, res) => {
  const progress = await prisma.userProgress.findUnique({
    where: { userId: req.user!.userId },
    include: { path: true },
  });
  if (!progress) {
    return res.status(404).json({ error: "Progress not found" });
  }
  return res.json({
    hasCompletedOnboarding: progress.onboardingCompleted,
    userGoal: progress.goal,
    userLevel: progress.experienceLevel,
    dailyGoalMinutes: progress.dailyCommitmentMinutes,
    notificationsEnabled: progress.notificationsEnabled,
    pathKey: progress.path.key,
  });
});

userRouter.patch("/preferences", async (req: AuthenticatedRequest, res) => {
  logInfo("[AUTH]", "preferences:update-attempt", { userId: req.user?.userId });
  const parsed = z
    .object({
      goal: z.enum(["JOB", "WORK", "FUN", "PROJECT"]),
      experienceLevel: z.enum(["BEGINNER", "BASICS", "INTERMEDIATE", "ADVANCED"]),
      dailyCommitmentMinutes: z.number().int().refine((value) => value === 10 || value === 15 || value === 30),
      notificationsEnabled: z.boolean(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    logWarn("[AUTH]", "preferences:update-validation-failed", { userId: req.user?.userId, errors: parsed.error.flatten() });
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const pathKey = resolvePathKey(parsed.data.experienceLevel);
  const path = await prisma.learningPath.findUnique({ where: { key: pathKey } });
  if (!path) return res.status(400).json({ error: "Assigned learning path not found" });

  const updated = await prisma.userProgress.upsert({
    where: { userId: req.user!.userId },
    create: {
      userId: req.user!.userId,
      pathId: path.id,
      goal: parsed.data.goal,
      experienceLevel: parsed.data.experienceLevel,
      dailyCommitmentMinutes: parsed.data.dailyCommitmentMinutes,
      notificationsEnabled: parsed.data.notificationsEnabled,
      onboardingCompleted: true,
    },
    update: {
      pathId: path.id,
      goal: parsed.data.goal,
      experienceLevel: parsed.data.experienceLevel,
      dailyCommitmentMinutes: parsed.data.dailyCommitmentMinutes,
      notificationsEnabled: parsed.data.notificationsEnabled,
    },
    include: { path: true },
  });

  return res.json({
    hasCompletedOnboarding: updated.onboardingCompleted,
    goal: updated.goal,
    experienceLevel: updated.experienceLevel,
    dailyCommitmentMinutes: updated.dailyCommitmentMinutes,
    notificationsEnabled: updated.notificationsEnabled,
    pathKey: updated.path.key,
  });
});

userRouter.post("/practice-log", async (req: AuthenticatedRequest, res) => {
  logInfo("[TASKS]", "practice-log:write-attempt", { userId: req.user?.userId, dateKey: req.body?.dateKey });
  const parsed = z
    .object({
      dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      practicedSeconds: z.number().int().min(1).max(60 * 60),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    logWarn("[TASKS]", "practice-log:validation-failed", { userId: req.user?.userId, errors: parsed.error.flatten() });
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const log = await prisma.dailyPracticeLog.upsert({
    where: {
      userId_dateKey: {
        userId: req.user!.userId,
        dateKey: parsed.data.dateKey,
      },
    },
    create: {
      userId: req.user!.userId,
      dateKey: parsed.data.dateKey,
      practicedSeconds: parsed.data.practicedSeconds,
    },
    update: {
      practicedSeconds: { increment: parsed.data.practicedSeconds },
    },
  });

  const progress = await prisma.userProgress.findUnique({
    where: { userId: req.user!.userId },
    select: { streakCurrent: true, streakLastDate: true, streakLongest: true, streakShieldAvailable: true },
  });

  if (progress) {
    const today = new Date(parsed.data.dateKey);
    const streakLastDate = progress.streakLastDate ? new Date(progress.streakLastDate) : null;
    const msInDay = 1000 * 60 * 60 * 24;
    const daysBetween = streakLastDate ? Math.floor((today.getTime() - streakLastDate.getTime()) / msInDay) : null;

    let nextStreak = progress.streakCurrent;
    let shieldAvailable = progress.streakShieldAvailable;
    let shieldConsumedAt: Date | null = null;

    if (daysBetween === null || daysBetween <= 0) {
      nextStreak = Math.max(1, progress.streakCurrent);
    } else if (daysBetween === 1) {
      nextStreak = progress.streakCurrent + 1;
    } else if (daysBetween > 1) {
      if (progress.streakShieldAvailable) {
        shieldAvailable = false;
        shieldConsumedAt = today;
        nextStreak = progress.streakCurrent;
      } else {
        nextStreak = 1;
      }
    }

    if (nextStreak >= 7 && !shieldAvailable) {
      shieldAvailable = true;
    }

    await prisma.userProgress.update({
      where: { userId: req.user!.userId },
      data: {
        streakCurrent: nextStreak,
        streakLongest: Math.max(progress.streakLongest, nextStreak),
        streakLastDate: today,
        streakShieldAvailable: shieldAvailable,
        streakShieldConsumedAt: shieldConsumedAt ?? undefined,
      },
    });
  }
  logInfo("[TASKS]", "practice-log:write-success", { userId: req.user?.userId, practicedSeconds: log.practicedSeconds });
  return res.json({ practicedSeconds: log.practicedSeconds });
});

userRouter.get("/daily-goal-status/:dateKey", async (req: AuthenticatedRequest, res) => {
  const dateKey = String(req.params.dateKey);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return res.status(400).json({ error: "Invalid date key format" });
  }
  const [progress, log] = await Promise.all([
    prisma.userProgress.findUnique({ where: { userId: req.user!.userId } }),
    prisma.dailyPracticeLog.findUnique({
      where: {
        userId_dateKey: {
          userId: req.user!.userId,
          dateKey,
        },
      },
    }),
  ]);
  if (!progress) return res.status(404).json({ error: "Progress not found" });

  const goalMinutes = progress.dailyCommitmentMinutes ?? 15;
  const practicedMinutes = Math.floor((log?.practicedSeconds ?? 0) / 60);
  const remainingMinutes = Math.max(0, goalMinutes - practicedMinutes);
  const canSendIncomplete = progress.notificationsEnabled && remainingMinutes > 0 && (log?.incompleteReminderCount ?? 0) < 2;
  const canSendComplete = progress.notificationsEnabled && remainingMinutes === 0 && !(log?.completeReminderSent ?? false);
  const shieldConsumedDateKey = progress.streakShieldConsumedAt
    ? new Date(progress.streakShieldConsumedAt).toLocaleDateString("en-CA")
    : null;
  return res.json({
    dateKey,
    goalMinutes,
    practicedMinutes,
    remainingMinutes,
    notificationsEnabled: progress.notificationsEnabled,
    streakShieldAvailable: progress.streakShieldAvailable,
    shieldConsumedToday: shieldConsumedDateKey === dateKey,
    canSendIncomplete,
    canSendComplete,
  });
});

userRouter.post("/daily-goal-status/:dateKey/mark-notified", async (req: AuthenticatedRequest, res) => {
  const dateKey = String(req.params.dateKey);
  const parsed = z.object({ type: z.enum(["INCOMPLETE", "COMPLETE"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return res.status(400).json({ error: "Invalid date key format" });
  }

  const updated = await prisma.dailyPracticeLog.upsert({
    where: {
      userId_dateKey: {
        userId: req.user!.userId,
        dateKey,
      },
    },
    create: {
      userId: req.user!.userId,
      dateKey,
      incompleteReminderCount: parsed.data.type === "INCOMPLETE" ? 1 : 0,
      completeReminderSent: parsed.data.type === "COMPLETE",
    },
    update: {
      incompleteReminderCount: parsed.data.type === "INCOMPLETE" ? { increment: 1 } : undefined,
      completeReminderSent: parsed.data.type === "COMPLETE" ? true : undefined,
    },
  });

  return res.json({
    dateKey,
    incompleteReminderCount: updated.incompleteReminderCount,
    completeReminderSent: updated.completeReminderSent,
  });
});

userRouter.get("/streak-history", async (req: AuthenticatedRequest, res) => {
  const logs = await prisma.streakLog.findMany({
    where: { userId: req.user!.userId },
    orderBy: { date: "desc" },
    take: 90,
  });
  return res.json(logs);
});

userRouter.post("/change-password", async (req: AuthenticatedRequest, res) => {
  const parsed = z
    .object({ currentPassword: z.string().min(6), newPassword: z.string().min(6) })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  const valid = await comparePassword(parsed.data.currentPassword, user.hashedPassword);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword: await hashPassword(parsed.data.newPassword), tokenVersion: { increment: 1 } },
  });
  return res.json({ ok: true });
});

userRouter.delete("/account", async (req: AuthenticatedRequest, res) => {
  const parsed = z.object({ confirmation: z.literal("DELETE") }).safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Confirmation text mismatch" });
  }

  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, avatarUrl: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const avatarKey = user.avatarUrl ? extractAvatarKeyFromUrl(user.avatarUrl) : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    await tx.dailyPracticeLog.deleteMany({ where: { userId } });
    await tx.userExerciseHistory.deleteMany({ where: { userId } });
    await tx.userBadge.deleteMany({ where: { userId } });
    await tx.streakLog.deleteMany({ where: { userId } });
    await tx.duelSession.updateMany({
      where: { winnerId: userId },
      data: { winnerId: null },
    });
    await tx.duelSession.deleteMany({ where: { OR: [{ player1Id: userId }, { player2Id: userId }] } });
    await tx.duelRating.deleteMany({ where: { userId } });
    await tx.userProgress.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  if (avatarKey) {
    try {
      await deleteAvatarObject(avatarKey);
    } catch (error) {
      logWarn("[USER]", "avatar:delete-failed-during-account-delete", {
        userId,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return res.status(204).send();
});
