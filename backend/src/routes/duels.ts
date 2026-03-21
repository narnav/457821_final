import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { logInfo } from "../lib/logger.js";

export const duelRouter = Router();
duelRouter.use(authMiddleware);

duelRouter.get("/stats", async (req: AuthenticatedRequest, res) => {
  logInfo("[DUEL]", "stats:fetch", { userId: req.user?.userId });
  const rating = await prisma.duelRating.findUnique({ where: { userId: req.user!.userId } });
  return res.json({
    rating: rating?.rating ?? 0,
    wins: rating?.wins ?? 0,
    losses: rating?.losses ?? 0,
    draws: rating?.draws ?? 0,
    rankTier: rating?.rankTier ?? "BRONZE",
  });
});

duelRouter.get("/history", async (req: AuthenticatedRequest, res) => {
  logInfo("[DUEL]", "history:fetch", { userId: req.user?.userId });
  const sessions = await prisma.duelSession.findMany({
    where: {
      OR: [{ player1Id: req.user!.userId }, { player2Id: req.user!.userId }],
    },
    orderBy: { startedAt: "desc" },
    take: 25,
  });
  return res.json(sessions);
});

duelRouter.get("/leaderboard", async (_req, res) => {
  logInfo("[DUEL]", "leaderboard:fetch");
  const leaderboard = await prisma.duelRating.findMany({
    orderBy: { rating: "desc" },
    take: 50,
    include: { user: { select: { username: true, avatarId: true } } },
  });
  return res.json(leaderboard);
});

duelRouter.get("/questions", async (_req, res) => {
  logInfo("[DUEL]", "questions:fetch");
  const questions = await prisma.duelQuestion.findMany({ take: 100 });
  return res.json(questions);
});

duelRouter.get("/matchmaking-status", async (_req, res) => {
  return res.json({ playersOnline: Math.floor(Math.random() * 120) + 30, estimatedWaitSeconds: 8 });
});
