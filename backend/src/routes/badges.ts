import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const badgesRouter = Router();
badgesRouter.use(authMiddleware);

badgesRouter.get("/", async (req: AuthenticatedRequest, res) => {
  const badges = await prisma.badge.findMany();
  const earned = await prisma.userBadge.findMany({ where: { userId: req.user!.userId } });
  const earnedSet = new Set(earned.map((e: { badgeId: string }) => e.badgeId));
  const merged = badges.map((badge: { id: string }) => ({
    ...badge,
    earned: earnedSet.has(badge.id),
  }));
  return res.json(merged);
});
