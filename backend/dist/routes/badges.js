import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
export const badgesRouter = Router();
badgesRouter.use(authMiddleware);
badgesRouter.get("/", async (req, res) => {
    const badges = await prisma.badge.findMany();
    const earned = await prisma.userBadge.findMany({ where: { userId: req.user.userId } });
    const earnedSet = new Set(earned.map((e) => e.badgeId));
    const merged = badges.map((badge) => ({
        ...badge,
        earned: earnedSet.has(badge.id),
    }));
    return res.json(merged);
});
