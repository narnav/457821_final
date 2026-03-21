import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
export const learningRouter = Router();
learningRouter.get("/paths", async (_req, res) => {
    const paths = await prisma.learningPath.findMany();
    return res.json(paths);
});
learningRouter.get("/chapters/:pathKey", async (req, res) => {
    const path = await prisma.learningPath.findUnique({
        where: { key: req.params.pathKey },
        include: { chapters: { orderBy: { orderIndex: "asc" } } },
    });
    if (!path)
        return res.status(404).json({ error: "Path not found" });
    return res.json(path.chapters);
});
learningRouter.get("/lessons/:chapterId", async (req, res) => {
    const lessons = await prisma.lesson.findMany({
        where: { chapterId: req.params.chapterId },
        orderBy: { orderIndex: "asc" },
    });
    return res.json(lessons);
});
learningRouter.get("/exercises/:lessonId", async (req, res) => {
    const exercises = await prisma.exercise.findMany({
        where: { lessonId: req.params.lessonId },
        orderBy: { orderIndex: "asc" },
        include: { options: true },
    });
    return res.json(exercises);
});
learningRouter.use(authMiddleware);
learningRouter.post("/submit-exercise", async (req, res) => {
    const parsed = z
        .object({
        exerciseId: z.string().min(3),
        answer: z.string(),
        timeTakenMs: z.number().int().positive().default(1000),
        attempts: z.number().int().positive().default(1),
    })
        .safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const exercise = await prisma.exercise.findUnique({ where: { id: parsed.data.exerciseId } });
    if (!exercise)
        return res.status(404).json({ error: "Exercise not found" });
    const isCorrect = parsed.data.answer.trim().replace(/\s/g, "") === exercise.correctAnswer.trim().replace(/\s/g, "");
    await prisma.userExerciseHistory.create({
        data: {
            userId: req.user.userId,
            exerciseId: exercise.id,
            isCorrect,
            attempts: parsed.data.attempts,
            timeTakenMs: parsed.data.timeTakenMs,
        },
    });
    if (isCorrect) {
        await prisma.userProgress.update({
            where: { userId: req.user.userId },
            data: {
                xpTotal: { increment: exercise.xpReward },
            },
        });
    }
    return res.json({
        isCorrect,
        xpEarned: isCorrect ? exercise.xpReward : 0,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
    });
});
learningRouter.get("/lesson-results/:lessonId", async (req, res) => {
    const lessonId = String(req.params.lessonId);
    const history = await prisma.userExerciseHistory.findMany({
        where: {
            userId: req.user.userId,
            exercise: { lessonId },
        },
    });
    const total = history.length;
    const correct = history.filter((h) => h.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return res.json({ total, correct, accuracy });
});
learningRouter.get("/resume", async (req, res) => {
    const progress = await prisma.userProgress.findUnique({ where: { userId: req.user.userId } });
    return res.json(progress);
});
