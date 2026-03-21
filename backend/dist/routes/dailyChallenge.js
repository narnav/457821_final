import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";
export const dailyChallengeRouter = Router();
dailyChallengeRouter.get("/", async (_req, res) => {
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
dailyChallengeRouter.post("/submit", async (req, res) => {
    const parsed = z.object({ exerciseId: z.string(), answer: z.string() }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const exercise = await prisma.exercise.findUnique({ where: { id: parsed.data.exerciseId } });
    if (!exercise)
        return res.status(404).json({ error: "Challenge not found" });
    const isCorrect = exercise.correctAnswer === parsed.data.answer;
    if (isCorrect) {
        await prisma.userProgress.update({
            where: { userId: req.user.userId },
            data: { xpTotal: { increment: exercise.xpReward + 80 } },
        });
    }
    return res.json({ isCorrect, xpAwarded: isCorrect ? exercise.xpReward + 80 : 0 });
});
