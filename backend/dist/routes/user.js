import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { comparePassword, hashPassword } from "../lib/auth.js";
export const userRouter = Router();
userRouter.use(authMiddleware);
function resolvePathKey(level) {
    return level === "BEGINNER" || level === "BASICS" ? "BEGINNER" : "ADVANCED";
}
userRouter.get("/profile", async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { progress: true, duelRating: true },
    });
    if (!user)
        return res.status(404).json({ error: "User not found" });
    return res.json(user);
});
userRouter.patch("/profile", async (req, res) => {
    const parsed = z.object({ username: z.string().min(2).optional(), avatarId: z.string().min(2).optional() }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: parsed.data,
    });
    return res.json({ id: user.id, username: user.username, avatarId: user.avatarId });
});
userRouter.get("/progress-summary", async (req, res) => {
    const progress = await prisma.userProgress.findUnique({ where: { userId: req.user.userId } });
    return res.json(progress);
});
userRouter.post("/onboarding", async (req, res) => {
    const parsed = z
        .object({
        goal: z.enum(["JOB", "WORK", "FUN", "PROJECT"]),
        experienceLevel: z.enum(["BEGINNER", "BASICS", "INTERMEDIATE", "ADVANCED"]),
        dailyCommitmentMinutes: z.number().int().min(10).max(60),
    })
        .safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const assignedPathKey = resolvePathKey(parsed.data.experienceLevel);
    const assignedPath = await prisma.learningPath.findUnique({ where: { key: assignedPathKey } });
    if (!assignedPath)
        return res.status(400).json({ error: "Assigned learning path not found" });
    const updated = await prisma.userProgress.upsert({
        where: { userId: req.user.userId },
        create: {
            userId: req.user.userId,
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
    return res.json({
        onboardingCompleted: updated.onboardingCompleted,
        pathKey: updated.path.key,
        goal: updated.goal,
        experienceLevel: updated.experienceLevel,
        dailyCommitmentMinutes: updated.dailyCommitmentMinutes,
        notificationsEnabled: updated.notificationsEnabled,
    });
});
userRouter.get("/preferences", async (req, res) => {
    const progress = await prisma.userProgress.findUnique({
        where: { userId: req.user.userId },
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
userRouter.patch("/preferences", async (req, res) => {
    const parsed = z
        .object({
        goal: z.enum(["JOB", "WORK", "FUN", "PROJECT"]),
        experienceLevel: z.enum(["BEGINNER", "BASICS", "INTERMEDIATE", "ADVANCED"]),
        dailyCommitmentMinutes: z.number().int().refine((value) => value === 10 || value === 15 || value === 30),
        notificationsEnabled: z.boolean(),
    })
        .safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const pathKey = resolvePathKey(parsed.data.experienceLevel);
    const path = await prisma.learningPath.findUnique({ where: { key: pathKey } });
    if (!path)
        return res.status(400).json({ error: "Assigned learning path not found" });
    const updated = await prisma.userProgress.upsert({
        where: { userId: req.user.userId },
        create: {
            userId: req.user.userId,
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
userRouter.post("/practice-log", async (req, res) => {
    const parsed = z
        .object({
        dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        practicedSeconds: z.number().int().min(1).max(60 * 60),
    })
        .safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const log = await prisma.dailyPracticeLog.upsert({
        where: {
            userId_dateKey: {
                userId: req.user.userId,
                dateKey: parsed.data.dateKey,
            },
        },
        create: {
            userId: req.user.userId,
            dateKey: parsed.data.dateKey,
            practicedSeconds: parsed.data.practicedSeconds,
        },
        update: {
            practicedSeconds: { increment: parsed.data.practicedSeconds },
        },
    });
    return res.json({ practicedSeconds: log.practicedSeconds });
});
userRouter.get("/daily-goal-status/:dateKey", async (req, res) => {
    const dateKey = String(req.params.dateKey);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return res.status(400).json({ error: "Invalid date key format" });
    }
    const [progress, log] = await Promise.all([
        prisma.userProgress.findUnique({ where: { userId: req.user.userId } }),
        prisma.dailyPracticeLog.findUnique({
            where: {
                userId_dateKey: {
                    userId: req.user.userId,
                    dateKey,
                },
            },
        }),
    ]);
    if (!progress)
        return res.status(404).json({ error: "Progress not found" });
    const goalMinutes = progress.dailyCommitmentMinutes ?? 15;
    const practicedMinutes = Math.floor((log?.practicedSeconds ?? 0) / 60);
    const remainingMinutes = Math.max(0, goalMinutes - practicedMinutes);
    const canSendIncomplete = progress.notificationsEnabled && remainingMinutes > 0 && (log?.incompleteReminderCount ?? 0) < 2;
    const canSendComplete = progress.notificationsEnabled && remainingMinutes === 0 && !(log?.completeReminderSent ?? false);
    return res.json({
        dateKey,
        goalMinutes,
        practicedMinutes,
        remainingMinutes,
        notificationsEnabled: progress.notificationsEnabled,
        canSendIncomplete,
        canSendComplete,
    });
});
userRouter.post("/daily-goal-status/:dateKey/mark-notified", async (req, res) => {
    const dateKey = String(req.params.dateKey);
    const parsed = z.object({ type: z.enum(["INCOMPLETE", "COMPLETE"]) }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return res.status(400).json({ error: "Invalid date key format" });
    }
    const updated = await prisma.dailyPracticeLog.upsert({
        where: {
            userId_dateKey: {
                userId: req.user.userId,
                dateKey,
            },
        },
        create: {
            userId: req.user.userId,
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
userRouter.get("/streak-history", async (req, res) => {
    const logs = await prisma.streakLog.findMany({
        where: { userId: req.user.userId },
        orderBy: { date: "desc" },
        take: 90,
    });
    return res.json(logs);
});
userRouter.post("/change-password", async (req, res) => {
    const parsed = z
        .object({ currentPassword: z.string().min(6), newPassword: z.string().min(6) })
        .safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user)
        return res.status(404).json({ error: "User not found" });
    const valid = await comparePassword(parsed.data.currentPassword, user.hashedPassword);
    if (!valid)
        return res.status(401).json({ error: "Current password is incorrect" });
    await prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword: await hashPassword(parsed.data.newPassword) },
    });
    return res.json({ ok: true });
});
userRouter.delete("/account", async (req, res) => {
    await prisma.user.delete({ where: { id: req.user.userId } });
    return res.json({ ok: true });
});
