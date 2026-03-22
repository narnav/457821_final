import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
import { logInfo, logWarn } from "../lib/logger.js";

export const dailyChallengeRouter = Router();

dailyChallengeRouter.get("/", async (_req, res) => {
  logInfo("[TASKS]", "daily-challenge:fetch");
  const exercise = await prisma.exercise.findFirst({
    where: { type: "FIND_THE_BUG" },
    include: { options: true },
  });
  return res.json({
    challengeDate: new Date().toISOString().slice(0, 10),
    bonusXp: 80,
    exercise,
  });
});

dailyChallengeRouter.use(authMiddleware);

dailyChallengeRouter.post("/submit", async (req: AuthenticatedRequest, res) => {
  logInfo("[TASKS]", "daily-challenge:submit-attempt", { userId: req.user?.userId, exerciseId: req.body?.exerciseId });
  const parsed = z.object({ exerciseId: z.string(), answer: z.string() }).safeParse(req.body);
  if (!parsed.success) {
    logWarn("[TASKS]", "daily-challenge:validation-failed", { userId: req.user?.userId });
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const exercise = await prisma.exercise.findUnique({ where: { id: parsed.data.exerciseId } });
  if (!exercise) return res.status(404).json({ error: "Challenge not found" });
  const isCorrect = exercise.correctAnswer === parsed.data.answer;
  if (isCorrect) {
    await prisma.userProgress.update({
      where: { userId: req.user!.userId },
      data: { xpTotal: { increment: exercise.xpReward + 80 } },
    });
  }
  return res.json({ isCorrect, xpAwarded: isCorrect ? exercise.xpReward + 80 : 0 });
});
